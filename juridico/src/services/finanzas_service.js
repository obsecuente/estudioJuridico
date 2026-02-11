// src/services/finanzas_service.js
import { MovimientoFinanciero, Cuota, Cliente, Caso } from "../models/index.js";
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
        estado = "pendiente",
        cuotas = [],
    } = datos;

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
        const movimiento = await MovimientoFinanciero.create(
            {
                tipo,
                categoria,
                descripcion,
                monto_ars: montoFinalArs,
                monto_jus: monto_jus || null,
                valor_jus_referencia: valorJusReferencia,
                estado,
                id_caso,
                id_cliente,
            },
            { transaction }
        );

        // Crear cuotas si se especifican
        if (cuotas.length > 0) {
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
        if (error.name === "SequelizeValidationError") {
            const mensajes = error.errors.map((e) => e.message).join(", ");
            throw new AppError(`Error de validación: ${mensajes}`, 400);
        }
        throw new AppError("Error al crear movimiento financiero", 500);
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
        // Si no hay valor configurado, continuar con 0
        valorJusActual = 0;
    }

    // Construir filtro base - admins ven todo, otros solo sus datos
    const baseWhere = {};
    const isAdmin = userContext?.rol === "admin";

    if (!isAdmin && userContext?.id_abogado) {
        baseWhere.id_abogado = userContext.id_abogado;
    }

    // Agregaciones con Sequelize para performance
    // 1. Total percibido (pagados)
    const totalPercibidoResult = await MovimientoFinanciero.findOne({
        where: { ...baseWhere, tipo: "ingreso", estado: "pagado" },
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("monto_ars")), 0), "total"],
        ],
        raw: true,
    });
    const totalPercibido = parseFloat(totalPercibidoResult?.total || 0);

    // 2. Total pendiente en ARS fijos (sin JUS)
    const pendienteArsFijoResult = await MovimientoFinanciero.findOne({
        where: {
            ...baseWhere,
            tipo: "ingreso",
            estado: { [Op.in]: ["pendiente", "parcial"] },
            monto_jus: { [Op.or]: [null, 0] },
        },
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("monto_ars")), 0), "total"],
        ],
        raw: true,
    });
    const pendienteArsFijo = parseFloat(pendienteArsFijoResult?.total || 0);

    // 3. Total JUS pendientes (para recalcular al valor actual)
    const pendienteJusResult = await MovimientoFinanciero.findOne({
        where: {
            ...baseWhere,
            tipo: "ingreso",
            estado: { [Op.in]: ["pendiente", "parcial"] },
            monto_jus: { [Op.gt]: 0 },
        },
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("monto_jus")), 0), "total_jus"],
        ],
        raw: true,
    });
    const totalJusPendientes = parseFloat(pendienteJusResult?.total_jus || 0);

    // Recálculo anti-inflación: JUS pendientes * valor actual
    const pendienteJusActualizado = totalJusPendientes * valorJusActual;

    // Total pendiente actualizado
    const totalPendienteActualizado = pendienteArsFijo + pendienteJusActualizado;

    // 4. Total egresos
    const totalEgresosResult = await MovimientoFinanciero.findOne({
        where: { ...baseWhere, tipo: "egreso" },
        attributes: [
            [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("monto_ars")), 0), "total"],
        ],
        raw: true,
    });
    const totalEgresos = parseFloat(totalEgresosResult?.total || 0);

    // 5. Contadores
    const [countPendientes, countCuotasVencidas, countTotal] = await Promise.all([
        MovimientoFinanciero.count({
            where: { ...baseWhere, tipo: "ingreso", estado: { [Op.in]: ["pendiente", "parcial"] } },
        }),
        Cuota.count({
            where: {
                estado: "pendiente",
                fecha_vencimiento: { [Op.lt]: new Date() },
            },
        }),
        MovimientoFinanciero.count({ where: baseWhere }),
    ]);

    // Calcular ratio de cobrabilidad
    const baseCobrabilidad = totalPercibido + totalPendienteActualizado;
    const ratioCobrabilidad = baseCobrabilidad > 0
        ? ((totalPercibido / baseCobrabilidad) * 100).toFixed(2)
        : 0;

    // Caja neta (percibido - egresos)
    const cajaNeta = totalPercibido - totalEgresos;

    return {
        caja: {
            percibido: totalPercibido,
            egresos: totalEgresos,
            neto: cajaNeta,
        },
        cartera: {
            pendiente_ars_fijo: pendienteArsFijo,
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
            total_movimientos: countTotal,
            vista: isAdmin ? "estudio_completo" : "mis_finanzas",
        },
        formula_aplicada: {
            descripcion: "Total Pendiente = (JUS pendientes × Valor JUS hoy) + ARS fijos pendientes",
            calculo: `(${totalJusPendientes} JUS × $${valorJusActual}) + $${pendienteArsFijo} = $${totalPendienteActualizado.toFixed(2)}`,
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
        order: [["createdAt", "DESC"]],
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
    } = opciones;

    const offset = (page - 1) * limit;
    const where = {};

    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (id_cliente) where.id_cliente = id_cliente;
    if (id_caso) where.id_caso = id_caso;
    if (categoria) where.categoria = categoria;

    const { count, rows: movimientos } = await MovimientoFinanciero.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
            { model: Cuota, as: "cuotas" },
            { model: Cliente, as: "cliente", attributes: ["id_cliente", "nombre", "apellido"] },
            { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
        ],
        order: [["createdAt", "DESC"]],
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
    provincia = "NQN"
) => {
    return await crearMovimiento({
        tipo: "ingreso",
        categoria: "apertura_carpeta",
        descripcion: `Apertura de carpeta - ${monto_jus} JUS (Ley 1594 ${provincia})`,
        monto_jus,
        provincia,
        id_caso,
        id_cliente,
        estado: "pendiente",
    });
};

export default {
    crearMovimiento,
    obtenerResumenEstudio,
    marcarCuotaPagada,
    obtenerMovimientosPorCaso,
    obtenerMovimientos,
    registrarAperturaCarpeta,
};
