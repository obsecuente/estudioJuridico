import MovimientoFinanciero from "../models/MovimientoFinanciero.js";
import CierreMensual from "../models/CierreMensual.js";
import Abogado from "../models/Abogado.js";
import Caso from "../models/Caso.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Genera el cierre mensual para un mes y año específicos
 * Se ejecuta para TODOS los abogados
 * @param {number} mes - 1 a 12
 * @param {number} anio - YYYY
 */
const generarCierreMensual = async (mes, anio) => {
    // Definir rango de fechas
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59); // Último día del mes

    console.log(`[Cierre] Generando cierre para ${mes}/${anio}`);

    // Obtener todos los abogados
    const abogados = await Abogado.findAll();

    for (const abogado of abogados) {
        try {
            // Calcular ingresos
            const ingresos = await MovimientoFinanciero.sum("monto_ars", {
                where: {
                    id_abogado: abogado.id_abogado,
                    tipo: "ingreso",
                    // Consideramos lo cobrado en ese mes (fecha_cobro)
                    // Si no tiene fecha_cobro pero está pagado (legacy), usar updatedAt
                    [Op.and]: [
                        { estado: "pagado" },
                        { fecha_cobro: { [Op.between]: [fechaInicio, fechaFin] } }
                    ]
                },
            });

            // Calcular egresos (por fecha de creación o pago? Usamos createdAt para simplificar criterio contable de lo registrado)
            // O mejor: fecha de pago si está pagado.
            // Para mantener consistencia con "caja": lo que entró y salió efectivamente este mes.
            const egresos = await MovimientoFinanciero.sum("monto_ars", {
                where: {
                    id_abogado: abogado.id_abogado,
                    tipo: "egreso",
                    estado: "pagado",
                    updatedAt: { [Op.between]: [fechaInicio, fechaFin] } // Usamos updatedAt como proxy de fecha pago si no hay campo
                },
            });

            // Casos nuevos este mes
            const casosNuevos = await Caso.count({
                where: {
                    id_abogado: abogado.id_abogado,
                    createdAt: { [Op.between]: [fechaInicio, fechaFin] },
                },
            });

            // Casos cerrados este mes
            const casosCerrados = await Caso.count({
                where: {
                    id_abogado: abogado.id_abogado,
                    estado: "cerrado",
                    actualizado: { [Op.between]: [fechaInicio, fechaFin] }, // Asumiendo que actualizado refleja el cierre
                },
            });

            const totalIngresos = ingresos || 0;
            const totalEgresos = egresos || 0;
            const balance = totalIngresos - totalEgresos;

            // Guardar o actualizar cierre
            const [cierre, created] = await CierreMensual.findOrCreate({
                where: {
                    anio,
                    mes,
                    id_abogado: abogado.id_abogado,
                },
                defaults: {
                    total_ingresos: totalIngresos,
                    total_egresos: totalEgresos,
                    balance,
                    cantidad_casos_nuevos: casosNuevos,
                    cantidad_casos_cerrados: casosCerrados,
                },
            });

            if (!created) {
                await cierre.update({
                    total_ingresos: totalIngresos,
                    total_egresos: totalEgresos,
                    balance,
                    cantidad_casos_nuevos: casosNuevos,
                    cantidad_casos_cerrados: casosCerrados,
                });
            }

            console.log(`[Cierre] Abogado ${abogado.apellido}: Balance ${balance}`);
        } catch (error) {
            console.error(`[Cierre] Error con abogado ${abogado.id_abogado}:`, error);
        }
    }
};

/**
 * Obtener cierres históricos de un abogado.
 * Para el mes actual (si no hay snapshot guardado), calcula en tiempo real.
 */
const obtenerCierres = async (id_abogado, anio) => {
    const where = { id_abogado };
    if (anio) where.anio = anio;

    const cierresGuardados = await CierreMensual.findAll({
        where,
        order: [["anio", "DESC"], ["mes", "DESC"]],
    });

    // Si el año pedido es el actual, verificar si el mes actual tiene cierre
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth() + 1; // 1-12

    if (parseInt(anio) === anioActual) {
        const tieneCierreActual = cierresGuardados.some(
            c => c.mes === mesActual && c.anio === anioActual
        );

        if (!tieneCierreActual) {
            // Calcular mes actual en tiempo real usando la misma lógica que el dashboard
            // Usamos raw queries para poder usar COALESCE en la fecha de cobro/pago

            const [ingresosRows] = await sequelize.query(`
                SELECT COALESCE(SUM(monto_ars), 0) AS total
                FROM movimientos_financieros
                WHERE id_abogado = :idAbogado
                  AND tipo = 'ingreso'
                  AND estado = 'pagado'
                  AND MONTH(COALESCE(fecha_cobro, fecha_pago, updated_at)) = :mes
                  AND YEAR(COALESCE(fecha_cobro, fecha_pago, updated_at)) = :anio
            `, { replacements: { idAbogado: id_abogado, mes: mesActual, anio: anioActual } });

            // Cuotas cobradas este mes (ingresos parciales)
            const [cuotasRows] = await sequelize.query(`
                SELECT COALESCE(SUM(c.monto_cuota), 0) AS total
                FROM cuotas c
                INNER JOIN movimientos_financieros mf ON mf.id_movimiento = c.id_movimiento
                WHERE mf.id_abogado = :idAbogado
                  AND mf.tipo = 'ingreso'
                  AND c.estado = 'pagado'
                  AND MONTH(c.fecha_pago_efectivo) = :mes
                  AND YEAR(c.fecha_pago_efectivo) = :anio
            `, { replacements: { idAbogado: id_abogado, mes: mesActual, anio: anioActual } });

            const [egresosRows] = await sequelize.query(`
                SELECT COALESCE(SUM(monto_ars), 0) AS total
                FROM movimientos_financieros
                WHERE id_abogado = :idAbogado
                  AND tipo = 'egreso'
                  AND estado = 'pagado'
                  AND MONTH(COALESCE(fecha_pago, updated_at)) = :mes
                  AND YEAR(COALESCE(fecha_pago, updated_at)) = :anio
            `, { replacements: { idAbogado: id_abogado, mes: mesActual, anio: anioActual } });

            const [casosNuevosRows] = await sequelize.query(`
                SELECT COUNT(*) AS total
                FROM casos
                WHERE id_abogado = :idAbogado
                  AND MONTH(created_at) = :mes
                  AND YEAR(created_at) = :anio
            `, { replacements: { idAbogado: id_abogado, mes: mesActual, anio: anioActual } });

            const [casosCerradosRows] = await sequelize.query(`
                SELECT COUNT(*) AS total
                FROM casos
                WHERE id_abogado = :idAbogado
                  AND estado = 'cerrado'
                  AND MONTH(updated_at) = :mes
                  AND YEAR(updated_at) = :anio
            `, { replacements: { idAbogado: id_abogado, mes: mesActual, anio: anioActual } });

            const totalIngresos = parseFloat(ingresosRows[0]?.total || 0) + parseFloat(cuotasRows[0]?.total || 0);
            const totalEgresos = parseFloat(egresosRows[0]?.total || 0);

            // Inyectar el mes actual como objeto "virtual" (no guardado en BD)
            cierresGuardados.push({
                id_cierre: null,
                anio: anioActual,
                mes: mesActual,
                id_abogado,
                total_ingresos: totalIngresos,
                total_egresos: totalEgresos,
                balance: totalIngresos - totalEgresos,
                cantidad_casos_nuevos: casosNuevos,
                cantidad_casos_cerrados: casosCerrados,
                es_provisional: true, // flag para el frontend si quiere mostrarlo diferente
            });
        }
    }

    return cierresGuardados;
};

export default {
    generarCierreMensual,
    obtenerCierres,
};
