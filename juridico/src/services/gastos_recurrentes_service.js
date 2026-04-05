// src/services/gastos_recurrentes_service.js
import { GastoRecurrente, MovimientoFinanciero, Abogado } from "../models/index.js";
import { Op } from "sequelize";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

/**
 * Crea un gasto recurrente y genera el movimiento del mes actual si corresponde
 */
export const crearGastoRecurrente = async (datos) => {
    const { categoria, descripcion, monto_ars, dia_vencimiento, id_abogado } = datos;

    if (!categoria) throw new AppError("La categoría es obligatoria", 400);
    if (!monto_ars || monto_ars <= 0) throw new AppError("El monto debe ser mayor a 0", 400);
    if (!dia_vencimiento || dia_vencimiento < 1 || dia_vencimiento > 28) {
        throw new AppError("El día de vencimiento debe ser entre 1 y 28", 400);
    }

    const gasto = await GastoRecurrente.create({
        categoria,
        descripcion: descripcion || null,
        monto_ars,
        dia_vencimiento,
        activo: true,
        id_abogado,
    });

    // Generar movimiento del mes actual si el día aún no pasó
    const hoy = new Date();
    const diaHoy = hoy.getDate();
    if (dia_vencimiento >= diaHoy) {
        await generarMovimientoParaGasto(gasto, hoy.getFullYear(), hoy.getMonth() + 1);
    }

    return gasto;
};

/**
 * Obtiene los gastos recurrentes activos de un abogado
 */
export const obtenerGastosRecurrentes = async (id_abogado) => {
    return await GastoRecurrente.findAll({
        where: { id_abogado, activo: true },
        order: [["dia_vencimiento", "ASC"]],
    });
};

/**
 * Actualiza un gasto recurrente (monto, día, descripción, activo)
 */
export const actualizarGastoRecurrente = async (id, datos) => {
    const gasto = await GastoRecurrente.findByPk(id);
    if (!gasto) throw new AppError("Gasto recurrente no encontrado", 404);

    const camposPermitidos = ["monto_ars", "dia_vencimiento", "descripcion", "activo", "categoria"];
    const actualizacion = {};
    for (const campo of camposPermitidos) {
        if (datos[campo] !== undefined) actualizacion[campo] = datos[campo];
    }

    await gasto.update(actualizacion);
    return gasto;
};

/**
 * Desactiva un gasto recurrente (soft delete)
 */
export const desactivarGastoRecurrente = async (id) => {
    const gasto = await GastoRecurrente.findByPk(id);
    if (!gasto) throw new AppError("Gasto recurrente no encontrado", 404);
    await gasto.update({ activo: false });
    return { message: "Gasto recurrente desactivado" };
};

/**
 * Elimina un gasto recurrente permanentemente
 */
export const eliminarGastoRecurrente = async (id) => {
    const gasto = await GastoRecurrente.findByPk(id);
    if (!gasto) throw new AppError("Gasto recurrente no encontrado", 404);
    await gasto.destroy();
    return { message: "Gasto recurrente eliminado" };
};

/**
 * Genera un MovimientoFinanciero pendiente para un gasto recurrente en un mes/año dado
 * Evita duplicados comprobando si ya existe uno para ese mes
 */
const generarMovimientoParaGasto = async (gasto, year, month) => {
    // Buscar si ya existe movimiento para este gasto en este mes
    const inicioMes = new Date(year, month - 1, 1);
    const finMes = new Date(year, month, 0, 23, 59, 59);

    const existente = await MovimientoFinanciero.findOne({
        where: {
            id_gasto_recurrente: gasto.id_gasto_recurrente,
            createdAt: { [Op.between]: [inicioMes, finMes] },
        },
    });

    if (existente) return existente; // No duplicar

    // Crear movimiento pendiente
    const fechaVencimiento = new Date(year, month - 1, gasto.dia_vencimiento);

    return await MovimientoFinanciero.create({
        tipo: "egreso",
        categoria: gasto.categoria,
        descripcion: gasto.descripcion || `Gasto fijo: ${gasto.categoria}`,
        monto_ars: gasto.monto_ars,
        estado: "pendiente",
        es_recurrente: true,
        id_gasto_recurrente: gasto.id_gasto_recurrente,
        id_abogado: gasto.id_abogado,
    });
};

/**
 * Genera movimientos pendientes del mes actual para TODOS los gastos activos
 * Llamar al inicio del servidor o periódicamente
 */
export const generarMovimientosMensuales = async () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = hoy.getMonth() + 1;

    const gastosActivos = await GastoRecurrente.findAll({
        where: { activo: true },
    });

    let generados = 0;
    for (const gasto of gastosActivos) {
        const inicioMes = new Date(year, month - 1, 1);
        const finMes = new Date(year, month, 0, 23, 59, 59);

        const existente = await MovimientoFinanciero.findOne({
            where: {
                id_gasto_recurrente: gasto.id_gasto_recurrente,
                createdAt: { [Op.between]: [inicioMes, finMes] },
            },
        });

        if (!existente) {
            await generarMovimientoParaGasto(gasto, year, month);
            generados++;
        }
    }

    return { message: `${generados} movimientos generados para ${month}/${year}` };
};

/**
 * Obtiene los gastos recurrentes pendientes del mes para un abogado
 * (movimientos con es_recurrente=true y estado=pendiente del mes actual)
 */
export const obtenerPendientesMes = async (id_abogado) => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

    return await MovimientoFinanciero.findAll({
        where: {
            id_abogado,
            es_recurrente: true,
            [Op.or]: [
                { estado: "pendiente" },
                { createdAt: { [Op.between]: [inicioMes, finMes] } }
            ]
        },
        include: [
            { model: GastoRecurrente, as: "gasto_recurrente" },
        ],
        order: [["createdAt", "ASC"]],
    });
};

/**
 * Marca un movimiento como pagado
 */
export const marcarPagado = async (id_movimiento) => {
    const mov = await MovimientoFinanciero.findByPk(id_movimiento);
    if (!mov) throw new AppError("Movimiento no encontrado", 404);
    // Si ya está pagado, retornar silenciosamente (idempotente)
    if (mov.estado === "pagado") return mov;
    await mov.update({ estado: "pagado", fecha_pago: new Date() });
    return mov;
};

/**
 * Desmarca un movimiento pagado (undo) → vuelve a pendiente
 */
export const desmarcarPagado = async (id_movimiento) => {
    const mov = await MovimientoFinanciero.findByPk(id_movimiento);
    if (!mov) throw new AppError("Movimiento no encontrado", 404);
    if (mov.estado !== "pagado") throw new AppError("Este movimiento no está pagado", 400);
    await mov.update({ estado: "pendiente" });
    return mov;
};

export default {
    crearGastoRecurrente,
    obtenerGastosRecurrentes,
    actualizarGastoRecurrente,
    desactivarGastoRecurrente,
    eliminarGastoRecurrente,
    generarMovimientosMensuales,
    obtenerPendientesMes,
    marcarPagado,
    desmarcarPagado,
};
