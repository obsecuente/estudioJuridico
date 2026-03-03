// src/services/finanzas_service.js
import { MovimientoFinanciero, Cuota, Cliente, Caso, GastoRecurrente } from "../models/index.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import configuracionService from "./configuracion_service.js";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

/**
 * Crea un nuevo movimiento financiero
 * @param {Object} datos - Datos del movimiento
 * @param {string} datos.tipo - "ingreso" o "egreso"
 * @param {string} datos.categoria - Categoría (apertura_carpeta, honorarios, consulta, etc.)
 * @param {string} datos.descripcion - Descripción opcional
 * @param {number} datos.monto_ars - Monto en pesos (obligatorio si no hay monto_jus)
 * @param {number} datos.monto_jus - Monto en JUS (opcional)
 * @param {string} datos.provincia - "NQN" o "RN" para obtener valor JUS
 * @param {number} datos.id_caso - ID del caso vinculado (opcional)
 * @param {number} datos.id_cliente - ID del cliente vinculado (opcional)
 * @param {string} datos.estado - Estado: pendiente, pagado, parcial (default: pendiente)
 * @param {Array} datos.cuotas - Configuración de cuotas si aplica
 * @returns {Promise<Object>} Movimiento creado con sus cuotas
 */
export const crearMovimiento = async (datos) => {
    const {
        tipo,
        categoria,
        descripcion,
        monto_ars,
        monto_jus,
        provincia = "NQN",
        id_caso,
        id_cliente,
        id_abogado,
        estado = "pendiente",
        cuotas = [],
        // Plan de cuotas simplificado: { cantidad, fecha_primera }
        plan_cuotas = null,
        // Nuevos campos para gasto fijo
        es_gasto_fijo = false,
        dia_vencimiento = null,
        fecha_pago = null, // Fecha manual si se especifica
        fecha = null, // Alias para fecha_pago/cobro
    } = datos;

    // Determinar fecha de pago/cobro real
    const fechaReal = fecha_pago || fecha || (estado === "pagado" ? new Date() : null);

    // Validaciones
    if (!tipo || !["ingreso", "egreso"].includes(tipo)) {
        throw new AppError("El tipo debe ser 'ingreso' o 'egreso'", 400);
    }

    if (!categoria) {
        throw new AppError("La categoría es obligatoria", 400);
    }

    // Calcular monto en ARS
    let montoFinalArs = monto_ars;
    let valorJusReferencia = null;

    if (monto_jus && monto_jus > 0) {
        // Obtener valor JUS actual
        try {
            valorJusReferencia = await configuracionService.obtenerValorJus(provincia);
            montoFinalArs = monto_jus * valorJusReferencia;
        } catch (error) {
            if (error.statusCode === 404) {
                throw new AppError(
                    `Debe configurar el valor JUS para ${provincia} antes de registrar movimientos en JUS`,
                    400
                );
            }
            throw error;
        }
    }

    if (!montoFinalArs || montoFinalArs <= 0) {
        throw new AppError("Debe especificar un monto válido (monto_ars o monto_jus)", 400);
    }

    // Validar caso si se proporciona
    if (id_caso) {
        const casoExiste = await Caso.findByPk(id_caso);
        if (!casoExiste) {
            throw new AppError("El caso especificado no existe", 404);
        }
    }

    // Validar cliente si se proporciona
    if (id_cliente) {
        const clienteExiste = await Cliente.findByPk(id_cliente);
        if (!clienteExiste) {
            throw new AppError("El cliente especificado no existe", 404);
        }
    }

    // Crear movimiento en transacción
    const transaction = await sequelize.transaction();

    try {
        let idGastoRecurrente = null;

        // Si es gasto fijo, crearlo primero
        if (tipo === "egreso" && es_gasto_fijo) {
            if (!dia_vencimiento || dia_vencimiento < 1 || dia_vencimiento > 28) {
                throw new AppError("El día de vencimiento debe ser entre 1 y 28", 400);
            }

            const nuevoGasto = await GastoRecurrente.create({
                categoria,
                descripcion: descripcion || `Gasto fijo: ${categoria}`,
                monto_ars: montoFinalArs,
                dia_vencimiento,
                activo: true,
                id_abogado
            }, { transaction });

            idGastoRecurrente = nuevoGasto.id_gasto_recurrente;
        }

        const esPlanCuotas = plan_cuotas && plan_cuotas.cantidad > 0;

        const movimiento = await MovimientoFinanciero.create(
            {
                tipo,
                categoria,
                descripcion,
                monto_ars: montoFinalArs,
                monto_jus: monto_jus || null,
                valor_jus_referencia: valorJusReferencia,
                estado: esPlanCuotas ? "parcial" : estado,
                id_caso,
                id_cliente,
                id_abogado,
                // Vincular con gasto recurrente si aplica
                id_gasto_recurrente: idGastoRecurrente,
                es_recurrente: !!idGastoRecurrente,
                // Plan de cuotas
                es_plan_cuotas: !!esPlanCuotas,
                cantidad_cuotas: esPlanCuotas ? plan_cuotas.cantidad : null,
                // Fechas
                fecha_pago: (tipo === "egreso" && fechaReal) ? fechaReal : null,
                fecha_cobro: (tipo === "ingreso" && fechaReal) ? fechaReal : null,
            },
            { transaction }
        );

        // Crear cuotas: del plan automático o manuales
        if (esPlanCuotas) {
            const { cantidad, fecha_primera } = plan_cuotas;
            const montoPorCuota = Math.round((montoFinalArs / cantidad) * 100) / 100;
            const cuotasData = [];
            const fechaBase = new Date(fecha_primera);

            for (let i = 0; i < cantidad; i++) {
                const fechaVenc = new Date(fechaBase);
                fechaVenc.setMonth(fechaVenc.getMonth() + i);
                cuotasData.push({
                    id_movimiento: movimiento.id_movimiento,
                    numero_cuota: i + 1,
                    monto_cuota: montoPorCuota,
                    fecha_vencimiento: fechaVenc.toISOString().split("T")[0],
                    estado: "pendiente",
                });
            }
            await Cuota.bulkCreate(cuotasData, { transaction });
        } else if (cuotas.length > 0) {
            const cuotasData = cuotas.map((cuota, index) => ({
                id_movimiento: movimiento.id_movimiento,
                numero_cuota: index + 1,
                monto_cuota: cuota.monto || montoFinalArs / cuotas.length,
                fecha_vencimiento: cuota.fecha_vencimiento,
                estado: "pendiente",
            }));

            await Cuota.bulkCreate(cuotasData, { transaction });
        }

        await transaction.commit();

        // Retornar movimiento con cuotas
        const movimientoCompleto = await MovimientoFinanciero.findByPk(
            movimiento.id_movimiento,
            {
                include: [
                    { model: Cuota, as: "cuotas" },
                    { model: Cliente, as: "cliente", attributes: ["id_cliente", "nombre", "apellido"] },
                    { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
                ],
            }
        );

        return movimientoCompleto;
    } catch (error) {
        await transaction.rollback();
        console.error("Error detallado al crear movimiento:", error); // Log para debug

        if (error.name === "SequelizeValidationError") {
            const mensajes = error.errors.map((e) => e.message).join(", ");
            throw new AppError(`Error de validación: ${mensajes}`, 400);
        }
        // Incluir el mensaje original del error para debugging
        throw new AppError(`Error al crear movimiento financiero: ${error.message}`, 500);
    }
};

/**
 * Obtiene el resumen financiero del estudio con recálculo anti-inflación
 * Fórmula: Total Pendiente = (Suma JUS pendientes * Valor JUS hoy) + Suma ARS fijos pendientes
 * KPI: Ratio Cobrabilidad = (Percibido / (Percibido + Pendiente Actualizado)) * 100
 * @param {string} provincia - Provincia para valor JUS (default: NQN)
 * @param {Object} userContext - Contexto del usuario { id_abogado, rol }
 * @returns {Promise<Object>} Resumen financiero completo
 */
export const obtenerResumenEstudio = async (provincia = "NQN", userContext = null) => {
    // Obtener valor JUS actual
    let valorJusActual = 0;
    try {
        valorJusActual = await configuracionService.obtenerValorJus(provincia);
    } catch (error) {
        valorJusActual = 0;
    }

    // Construir filtro base - admins ven todo (o filtran), otros solo sus datos
    const baseWhere = {};
    const isAdmin = userContext?.rol === "admin";

    if (isAdmin && userContext?.id_abogado_filtro) {
        baseWhere.id_abogado = userContext.id_abogado_filtro;
    } else if (!isAdmin && userContext?.id_abogado) {
        baseWhere.id_abogado = userContext.id_abogado;
    }

    // FECHAS MES ACTUAL
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    // 1a. PERCIBIDO MENSUAL — movimientos directos pagados este mes (sin cuotas)
    const ingresosMesResult = await MovimientoFinanciero.findOne({
        where: {
            ...baseWhere,
            tipo: "ingreso",
            estado: "pagado",
            // Movimientos con cuotas parciales tienen estado='parcial' y no fecha_cobro,
            // por lo que naturalmente no aparecen aquí. Los completamente pagados sí.
            [Op.and]: [
                sequelize.where(sequelize.fn('MONTH', sequelize.col('fecha_cobro')), mesActual),
                sequelize.where(sequelize.fn('YEAR', sequelize.col('fecha_cobro')), anioActual)
            ]
        },
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("monto_ars")), 0), "total"],
        ],
        raw: true,
    });
    const ingresosMesDirectos = parseFloat(ingresosMesResult?.total || 0);

    // 1b. PERCIBIDO MENSUAL — cuotas cobradas este mes (de planes de cuotas)
    // Esto captura los cobros parciales que el dashboard ignoraba
    const cuotasMesResult = await Cuota.findOne({
        where: {
            estado: "pagado",
            [Op.and]: [
                sequelize.where(sequelize.fn('MONTH', sequelize.col('fecha_pago_efectivo')), mesActual),
                sequelize.where(sequelize.fn('YEAR', sequelize.col('fecha_pago_efectivo')), anioActual)
            ]
        },
        include: [{
            model: MovimientoFinanciero,
            as: "movimiento",
            where: { ...baseWhere, tipo: "ingreso" },
            attributes: [],
            required: true,
        }],
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("Cuota.monto_cuota")), 0), "total"],
        ],
        raw: true,
    });
    const ingresosMesCuotas = parseFloat(cuotasMesResult?.total || 0);

    const ingresosMes = ingresosMesDirectos + ingresosMesCuotas;

    // 2. EGRESOS MENSUALES
    const egresosMesResult = await MovimientoFinanciero.findOne({
        where: {
            ...baseWhere,
            tipo: "egreso",
            estado: "pagado",
            [Op.or]: [
                {
                    fecha_pago: { [Op.not]: null },
                    [Op.and]: [
                        sequelize.where(sequelize.fn('MONTH', sequelize.col('fecha_pago')), mesActual),
                        sequelize.where(sequelize.fn('YEAR', sequelize.col('fecha_pago')), anioActual)
                    ]
                },
                {
                    fecha_pago: null,
                    [Op.and]: [
                        sequelize.where(sequelize.fn('MONTH', sequelize.col('updated_at')), mesActual),
                        sequelize.where(sequelize.fn('YEAR', sequelize.col('updated_at')), anioActual)
                    ]
                }
            ]
        },
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("monto_ars")), 0), "total"],
        ],
        raw: true,
    });
    const egresosMes = parseFloat(egresosMesResult?.total || 0);

    // 3a. CARTERA PENDIENTE EN EFECTIVO — movimientos sin cuotas
    const pendienteArsFijoResult = await MovimientoFinanciero.findOne({
        where: {
            ...baseWhere,
            tipo: "ingreso",
            estado: { [Op.in]: ["pendiente", "parcial"] },
            monto_jus: { [Op.or]: [null, 0] },
            // Excluir movimientos que tienen cuotas (se calculan por cuota abajo)
            id_movimiento: {
                [Op.notIn]: sequelize.literal(
                    `(SELECT DISTINCT id_movimiento FROM cuotas)`
                )
            }
        },
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("monto_ars")), 0), "total"],
        ],
        raw: true,
    });
    const pendienteArsFijo = parseFloat(pendienteArsFijoResult?.total || 0);

    // 3b. CARTERA PENDIENTE EN EFECTIVO — solo cuotas no pagadas (no el total del movimiento)
    // Esto evita contar $1.000.000 como pendiente cuando ya se cobraron 3 cuotas de $100.000
    const cuotasPendientesResult = await Cuota.findOne({
        where: {
            estado: { [Op.ne]: "pagado" },
        },
        include: [{
            model: MovimientoFinanciero,
            as: "movimiento",
            where: {
                ...baseWhere,
                tipo: "ingreso",
                estado: { [Op.in]: ["pendiente", "parcial"] },
                monto_jus: { [Op.or]: [null, 0] },
            },
            attributes: [],
            required: true,
        }],
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("Cuota.monto_cuota")), 0), "total"],
        ],
        raw: true,
    });
    const pendienteArsCuotas = parseFloat(cuotasPendientesResult?.total || 0);

    // Total efectivo pendiente = movimientos directos + cuotas pendientes
    const pendienteArsTotal = pendienteArsFijo + pendienteArsCuotas;

    // 3c. CARTERA PENDIENTE EN JUS — proporcional a cuotas no pagadas
    // Para movimientos JUS SIN cuotas: suma monto_jus directamente
    // Para movimientos JUS CON cuotas: monto_jus * (cuotas_pendientes / total_cuotas)
    // Esto hace que el JUS pendiente baje cuota a cuota, igual que el efectivo

    // Movimientos JUS sin cuotas
    const pendienteJusSinCuotasResult = await MovimientoFinanciero.findOne({
        where: {
            ...baseWhere,
            tipo: "ingreso",
            estado: { [Op.in]: ["pendiente", "parcial"] },
            monto_jus: { [Op.gt]: 0 },
            id_movimiento: {
                [Op.notIn]: sequelize.literal(`(SELECT DISTINCT id_movimiento FROM cuotas)`)
            }
        },
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("monto_jus")), 0), "total_jus"],
        ],
        raw: true,
    });
    const jusSinCuotas = parseFloat(pendienteJusSinCuotasResult?.total_jus || 0);

    // Movimientos JUS CON cuotas: calcular JUS proporcional a cuotas pendientes
    // Usamos raw query para poder hacer la proporción por movimiento
    const jusQueryWhere = baseWhere.id_abogado
        ? `AND mf.id_abogado = :idAbogado`
        : "";
    const jusConCuotasRows = await sequelize.query(`
        SELECT
            mf.id_movimiento,
            mf.monto_jus,
            COUNT(c.id_cuota) AS total_cuotas,
            SUM(CASE WHEN c.estado != 'pagado' THEN 1 ELSE 0 END) AS cuotas_pendientes
        FROM movimientos_financieros mf
        INNER JOIN cuotas c ON c.id_movimiento = mf.id_movimiento
        WHERE mf.tipo = 'ingreso'
          AND mf.estado IN ('pendiente', 'parcial')
          AND mf.monto_jus > 0
          ${jusQueryWhere}
        GROUP BY mf.id_movimiento, mf.monto_jus
        HAVING cuotas_pendientes > 0
    `, {
        replacements: { idAbogado: baseWhere.id_abogado || null },
        type: sequelize.QueryTypes.SELECT,
    });
    const jusConCuotas = (jusConCuotasRows || []).reduce((acc, row) => {
        const proporcion = row.total_cuotas > 0 ? row.cuotas_pendientes / row.total_cuotas : 1;
        return acc + (parseFloat(row.monto_jus) * proporcion);
    }, 0);

    const totalJusPendientes = jusSinCuotas + jusConCuotas;
    const pendienteJusActualizado = totalJusPendientes * valorJusActual;
    const totalPendienteActualizado = pendienteArsTotal + pendienteJusActualizado;

    // 4. Contadores
    const proximos7dias = new Date();
    proximos7dias.setDate(proximos7dias.getDate() + 7);

    const [countPendientes, countCuotasVencidas, countCuotasProximas, countTotal] = await Promise.all([
        MovimientoFinanciero.count({
            where: { ...baseWhere, tipo: "ingreso", estado: { [Op.in]: ["pendiente", "parcial"] } },
        }),
        // Cuotas ya vencidas — filtradas por abogado via join
        Cuota.count({
            where: {
                estado: { [Op.in]: ["pendiente", "vencido"] },
                fecha_vencimiento: { [Op.lt]: new Date() },
            },
            include: [{
                model: MovimientoFinanciero,
                as: "movimiento",
                where: { ...baseWhere, tipo: "ingreso" },
                attributes: [],
                required: true,
            }],
        }),
        // Cuotas que vencen en los próximos 7 días
        Cuota.count({
            where: {
                estado: { [Op.in]: ["pendiente", "vencido"] },
                fecha_vencimiento: { [Op.between]: [new Date(), proximos7dias] },
            },
            include: [{
                model: MovimientoFinanciero,
                as: "movimiento",
                where: { ...baseWhere, tipo: "ingreso" },
                attributes: [],
                required: true,
            }],
        }),
        MovimientoFinanciero.count({ where: baseWhere }),
    ]);

    // 4b. GASTOS FIJOS PRÓXIMOS A VENCER (para alertas en card de Egresos)
    const diaHoy = hoy.getDate();
    const gastosFijosProximos = await GastoRecurrente.findAll({
        where: {
            activo: true,
            ...(baseWhere.id_abogado ? { id_abogado: baseWhere.id_abogado } : {}),
        },
        raw: true,
    });
    // Calcular días restantes al vencimiento para cada gasto
    const gastosConDias = gastosFijosProximos.map(g => {
        let diasRestantes = g.dia_vencimiento - diaHoy;
        if (diasRestantes < 0) diasRestantes += 30; // ya pasó este mes, siguiente
        return { ...g, dias_restantes: diasRestantes };
    }).filter(g => g.dias_restantes >= 0 && g.dias_restantes <= 7)
        .sort((a, b) => a.dias_restantes - b.dias_restantes);

    // Verificar cuáles de esos gastos fijos ya fueron pagados este mes
    const gastosFijosConEstado = [];
    for (const gf of gastosConDias) {
        const movPagado = await MovimientoFinanciero.findOne({
            where: {
                id_gasto_recurrente: gf.id_gasto_recurrente,
                estado: "pagado",
                [Op.and]: [
                    sequelize.where(sequelize.fn('MONTH', sequelize.col('fecha_pago')), mesActual),
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('fecha_pago')), anioActual)
                ]
            },
        });
        if (!movPagado) {
            gastosFijosConEstado.push(gf);
        }
    }

    // 4c. CUOTAS PRÓXIMAS DETALLADAS (para alertas en card de Cobros Pendientes)
    const cuotasProximasDetalle = await Cuota.findAll({
        where: {
            estado: { [Op.in]: ["pendiente", "vencido"] },
            fecha_vencimiento: { [Op.between]: [new Date(), proximos7dias] },
        },
        include: [{
            model: MovimientoFinanciero,
            as: "movimiento",
            where: { ...baseWhere, tipo: "ingreso" },
            attributes: ["id_movimiento", "descripcion", "categoria", "monto_ars", "monto_jus", "id_caso", "id_cliente", "es_plan_cuotas", "cantidad_cuotas"],
            include: [
                { model: Cliente, as: "cliente", attributes: ["id_cliente", "nombre", "apellido"] },
                { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
            ],
        }],
        order: [["fecha_vencimiento", "ASC"]],
    });

    // 5. Ratio de cobrabilidad histórico — incluye cuotas pagadas
    const totalPercibidoHistResult = await MovimientoFinanciero.sum("monto_ars", {
        where: {
            ...baseWhere, tipo: "ingreso", estado: "pagado",
            id_movimiento: {
                [Op.notIn]: sequelize.literal(`(SELECT DISTINCT id_movimiento FROM cuotas)`)
            }
        }
    });
    const percibidoHistDirecto = totalPercibidoHistResult || 0;

    const cuotasPagadasHistResult = await Cuota.findOne({
        where: { estado: "pagado" },
        include: [{
            model: MovimientoFinanciero,
            as: "movimiento",
            where: { ...baseWhere, tipo: "ingreso" },
            attributes: [],
            required: true,
        }],
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("Cuota.monto_cuota")), 0), "total"],
        ],
        raw: true,
    });
    const percibidoHistCuotas = parseFloat(cuotasPagadasHistResult?.total || 0);
    const totalPercibidoHist = percibidoHistDirecto + percibidoHistCuotas;

    const baseCobrabilidad = totalPercibidoHist + totalPendienteActualizado;
    const ratioCobrabilidad = baseCobrabilidad > 0
        ? ((totalPercibidoHist / baseCobrabilidad) * 100).toFixed(2)
        : 0;

    const balanceMensual = ingresosMes - egresosMes;

    return {
        caja: {
            percibido: ingresosMes,  // Mensual: directos + cuotas cobradas este mes
            egresos: egresosMes,
            neto: balanceMensual,
        },
        cartera: {
            pendiente_ars_fijo: pendienteArsTotal,       // Efectivo pendiente (sin JUS)
            pendiente_ars_cuotas: pendienteArsCuotas,    // Solo la parte de cuotas
            pendiente_jus: totalJusPendientes,
            pendiente_jus_actualizado: pendienteJusActualizado,
            total_pendiente_actualizado: totalPendienteActualizado,
        },
        indicadores: {
            ratio_cobrabilidad: parseFloat(ratioCobrabilidad),
            valor_jus_actual: valorJusActual,
            provincia,
            movimientos_pendientes: countPendientes,
            cuotas_vencidas: countCuotasVencidas,
            cuotas_proximas: countCuotasProximas,
            total_movimientos: countTotal,
            vista: isAdmin
                ? (userContext?.id_abogado_filtro ? "filtro_abogado" : "estudio_completo")
                : "mis_finanzas",
            mes_actual: mesActual,
        },
        // Alertas de gastos fijos próximos a vencer (para card Egresos)
        gastos_fijos_proximos: gastosFijosConEstado,
        // Cuotas de ingreso próximas a vencer con detalle (para card Cobros Pendientes)
        cuotas_proximas_detalle: cuotasProximasDetalle,
        formula_aplicada: {
            descripcion: "Percibido = mes actual (directos + cuotas). Pendiente = cuotas reales sin cobrar.",
            calculo: `Balance ${mesActual}/${anioActual}: $${balanceMensual}`,
        },
    };
};



/**
 * Marca una cuota como pagada
 * @param {number} id_cuota - ID de la cuota
 * @param {string} fecha_pago - Fecha del pago efectivo (default: hoy)
 * @returns {Promise<Object>} Cuota actualizada
 */
export const marcarCuotaPagada = async (id_cuota, fecha_pago = null) => {
    const cuota = await Cuota.findByPk(id_cuota, {
        include: [{ model: MovimientoFinanciero, as: "movimiento" }],
    });

    if (!cuota) {
        throw new AppError("Cuota no encontrada", 404);
    }

    if (cuota.estado === "pagado") {
        throw new AppError("Esta cuota ya está marcada como pagada", 400);
    }

    const transaction = await sequelize.transaction();

    try {
        // Actualizar cuota
        await cuota.update(
            {
                estado: "pagado",
                fecha_pago_efectivo: fecha_pago || new Date(),
            },
            { transaction }
        );

        // Verificar si todas las cuotas del movimiento están pagadas
        const cuotasPendientes = await Cuota.count({
            where: {
                id_movimiento: cuota.id_movimiento,
                estado: { [Op.ne]: "pagado" },
            },
            transaction,
        });

        // Si no hay cuotas pendientes, marcar movimiento como pagado
        if (cuotasPendientes === 0) {
            await MovimientoFinanciero.update(
                { estado: "pagado" },
                { where: { id_movimiento: cuota.id_movimiento }, transaction }
            );
        } else {
            // Si hay pagos parciales, marcar como parcial
            await MovimientoFinanciero.update(
                { estado: "parcial" },
                { where: { id_movimiento: cuota.id_movimiento }, transaction }
            );
        }

        await transaction.commit();

        // Retornar cuota actualizada
        const cuotaActualizada = await Cuota.findByPk(id_cuota, {
            include: [
                {
                    model: MovimientoFinanciero,
                    as: "movimiento",
                    include: [
                        { model: Cliente, as: "cliente", attributes: ["id_cliente", "nombre", "apellido"] },
                        { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
                    ],
                },
            ],
        });

        return cuotaActualizada;
    } catch (error) {
        await transaction.rollback();
        throw new AppError("Error al marcar cuota como pagada", 500);
    }
};

/**
 * Obtiene todos los movimientos de un caso específico
 * @param {number} id_caso - ID del caso
 * @returns {Promise<Array>} Lista de movimientos del caso
 */
export const obtenerMovimientosPorCaso = async (id_caso) => {
    const caso = await Caso.findByPk(id_caso);
    if (!caso) {
        throw new AppError("Caso no encontrado", 404);
    }

    const movimientos = await MovimientoFinanciero.findAll({
        where: { id_caso },
        include: [
            { model: Cuota, as: "cuotas", order: [["numero_cuota", "ASC"]] },
            { model: Cliente, as: "cliente", attributes: ["id_cliente", "nombre", "apellido"] },
        ],
        order: [["updatedAt", "DESC"]],
    });

    return movimientos;
};

/**
 * Obtiene todos los movimientos con paginación y filtros
 * @param {Object} opciones - Opciones de filtrado
 * @returns {Promise<Object>} Movimientos con paginación
 */
export const obtenerMovimientos = async (opciones = {}) => {
    const {
        page = 1,
        limit = 20,
        tipo,
        estado,
        id_cliente,
        id_caso,
        categoria,
        id_abogado,
        fecha_desde,
        fecha_hasta,
    } = opciones;

    const offset = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (id_cliente) where.id_cliente = id_cliente;
    if (id_caso) where.id_caso = id_caso;
    if (categoria) where.categoria = categoria;
    if (id_abogado) where.id_abogado = id_abogado;
    if (fecha_desde && fecha_hasta) {
        where.createdAt = { [Op.between]: [new Date(fecha_desde), new Date(fecha_hasta)] };
    }

    const { count, rows: movimientos } = await MovimientoFinanciero.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
            { model: Cuota, as: "cuotas" },
            { model: Cliente, as: "cliente", attributes: ["id_cliente", "nombre", "apellido"] },
            { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
        ],
        order: [
            // Only pin cuotas that still have pending payments
            [sequelize.literal("CASE WHEN `MovimientoFinanciero`.`es_plan_cuotas` = 1 AND `MovimientoFinanciero`.`estado` != 'pagado' THEN 0 ELSE 1 END"), "ASC"],
            ["updatedAt", "DESC"],
        ],
    });

    return {
        movimientos,
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Registra apertura de carpeta automática para un caso
 * Valor por defecto: 3 JUS (Ley 1594 Neuquén)
 * @param {number} id_caso - ID del caso
 * @param {number} id_cliente - ID del cliente
 * @param {number} monto_jus - Cantidad de JUS (default: 3)
 * @param {string} provincia - Provincia para valor JUS (default: NQN)
 * @returns {Promise<Object>} Movimiento de apertura creado
 */
export const registrarAperturaCarpeta = async (
    id_caso,
    id_cliente,
    monto_jus = 3,
    provincia = "NQN",
    monto_fijo = null,
    plan_cuotas = null
) => {
    // Si viene monto fijo, usamos ese y descripcion en pesos
    // Si no, usamos JUS
    const esFijo = monto_fijo && parseFloat(monto_fijo) > 0;

    return await crearMovimiento({
        tipo: "ingreso",
        categoria: "apertura_carpeta",
        descripcion: esFijo
            ? `Apertura de carpeta - Monto Fijo`
            : `Apertura de carpeta - ${monto_jus} JUS (Ley 1594 ${provincia})`,
        monto_jus: esFijo ? null : monto_jus,
        monto_ars: esFijo ? parseFloat(monto_fijo) : 0, // Si es JUS, monto_ars se calculará o quedará en 0 hasta update
        provincia: esFijo ? null : provincia,
        id_caso,
        id_cliente,
        estado: plan_cuotas ? "parcial" : "pendiente",
        plan_cuotas
    });
};

/**
 * Eliminar movimiento financiero por ID
 */
export const eliminarMovimiento = async (id) => {
    const mov = await MovimientoFinanciero.findByPk(id);

    if (!mov) {
        throw new AppError("Movimiento no encontrado", 404);
    }

    // Si es recurrente, solo eliminamos el movimiento, NO la configuración de gasto recurrente
    await mov.destroy();
    return { message: "Movimiento eliminado exitosamente" };
};

/**
 * Marca un movimiento de ingreso como cobrado
 * Valida que NO sea un plan de cuotas (esos se marcan individualmente)
 * @param {number} id_movimiento - ID del movimiento
 * @param {string} fecha_cobro - Fecha del cobro efectivo (default: hoy)
 * @returns {Promise<Object>} Movimiento actualizado
 */
export const marcarMovimientoCobrado = async (id_movimiento, fecha_cobro = null) => {
    const mov = await MovimientoFinanciero.findByPk(id_movimiento, {
        include: [{ model: Cuota, as: "cuotas" }],
    });

    if (!mov) {
        throw new AppError("Movimiento no encontrado", 404);
    }

    if (mov.tipo !== "ingreso") {
        throw new AppError("Solo se pueden marcar como cobrados los ingresos", 400);
    }

    if (mov.estado === "pagado") {
        throw new AppError("Este ingreso ya está marcado como cobrado", 400);
    }

    // Si tiene cuotas, no se puede marcar el movimiento completo
    if (mov.cuotas && mov.cuotas.length > 0) {
        throw new AppError(
            "Este ingreso tiene plan de cuotas. Marcá las cuotas individualmente.",
            400
        );
    }

    await mov.update({
        estado: "pagado",
        fecha_cobro: fecha_cobro || new Date(),
    });

    return mov;
};
/**
 * Obtiene las cuotas de un movimiento
 * @param {number} id_movimiento
 * @returns {Promise<Array>}
 */
export const obtenerCuotasMovimiento = async (id_movimiento) => {
    const mov = await MovimientoFinanciero.findByPk(id_movimiento, {
        include: [{ model: Cuota, as: "cuotas", order: [["numero_cuota", "ASC"]] }],
    });
    if (!mov) throw new AppError("Movimiento no encontrado", 404);
    return mov.cuotas || [];
};

/**
 * Actualiza datos de una cuota (fecha, monto)
 * @param {number} id_cuota
 * @param {Object} datos - { fecha_vencimiento, monto_cuota }
 * @returns {Promise<Object>}
 */
export const actualizarCuota = async (id_cuota, datos) => {
    const cuota = await Cuota.findByPk(id_cuota);
    if (!cuota) throw new AppError("Cuota no encontrada", 404);

    const updates = {};
    if (datos.fecha_vencimiento) updates.fecha_vencimiento = datos.fecha_vencimiento;
    if (datos.monto_cuota) updates.monto_cuota = datos.monto_cuota;

    await cuota.update(updates);
    return cuota;
};

/**
 * Estadísticas anuales calculadas directamente desde MovimientosFinancieros (no Cierres)
 */
const obtenerEstadisticasAnuales = async (anio, userContext = {}) => {
    const baseWhere = {};
    if (userContext.id_abogado && userContext.rol !== "admin") {
        baseWhere.id_abogado = userContext.id_abogado;
    }

    const meses = [];
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth() + 1; // 1-12

    for (let mes = 1; mes <= 12; mes++) {
        if (parseInt(anio) === anioActual && mes > mesActual) continue;

        const inicioMes = new Date(anio, mes - 1, 1);
        const finMes = new Date(anio, mes, 0, 23, 59, 59);

        const ingresosResult = await MovimientoFinanciero.sum("monto_ars", {
            where: {
                ...baseWhere,
                tipo: "ingreso",
                estado: "pagado",
                [Op.or]: [
                    { fecha_cobro: { [Op.between]: [inicioMes, finMes] } },
                    { [Op.and]: [{ fecha_cobro: null }, { createdAt: { [Op.between]: [inicioMes, finMes] } }] }
                ]
            }
        });

        const cuotasPagadasResult = await Cuota.sum("monto_cuota", {
            where: {
                estado: "pagado",
                fecha_pago_efectivo: { [Op.between]: [inicioMes, finMes] }
            },
            include: [{
                model: MovimientoFinanciero,
                as: "movimiento",
                where: { ...baseWhere, tipo: "ingreso" },
                attributes: [],
            }]
        });

        const ingresos = (ingresosResult || 0) + (cuotasPagadasResult || 0);

        const egresosResult = await MovimientoFinanciero.sum("monto_ars", {
            where: {
                ...baseWhere,
                tipo: "egreso",
                createdAt: { [Op.between]: [inicioMes, finMes] }
            }
        });
        const egresos = egresosResult || 0;

        const topCategorias = await MovimientoFinanciero.findAll({
            attributes: [
                "categoria",
                [sequelize.fn("SUM", sequelize.col("monto_ars")), "total"]
            ],
            where: {
                ...baseWhere,
                tipo: "egreso",
                createdAt: { [Op.between]: [inicioMes, finMes] }
            },
            group: ["categoria"],
            order: [[sequelize.fn("SUM", sequelize.col("monto_ars")), "DESC"]],
            limit: 3,
            raw: true,
        });

        // Caso model has timestamps: false — use fecha_inicio instead
        const casosNuevos = await Caso.count({
            where: { fecha_inicio: { [Op.between]: [inicioMes, finMes] } }
        });
        // For archived cases, just count all archived
        const casosCerrados = 0;

        const esActual = parseInt(anio) === anioActual && mes === mesActual;

        meses.push({
            mes,
            ingresos,
            egresos,
            balance: ingresos - egresos,
            top_categorias: topCategorias.map(tc => ({
                categoria: tc.categoria,
                total: parseFloat(tc.total)
            })),
            casos_nuevos: casosNuevos,
            casos_cerrados: casosCerrados,
            es_actual: esActual,
        });
    }

    const totalIngresos = meses.reduce((s, m) => s + m.ingresos, 0);
    const totalEgresos = meses.reduce((s, m) => s + m.egresos, 0);

    return {
        anio: parseInt(anio),
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        resultado_neto: totalIngresos - totalEgresos,
        meses,
    };
};

export default {
    crearMovimiento,
    obtenerResumenEstudio,
    marcarCuotaPagada,
    marcarMovimientoCobrado,
    obtenerMovimientosPorCaso,
    obtenerMovimientos,
    registrarAperturaCarpeta,
    eliminarMovimiento,
    obtenerCuotasMovimiento,
    actualizarCuota,
    obtenerEstadisticasAnuales,
};
