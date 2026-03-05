// src/controllers/finanzas_controller.js
import finanzasService from "../services/finanzas_service.js";

/**
 * Crea un nuevo movimiento financiero
 * POST /api/finanzas
 */
export const crearMovimiento = async (req, res) => {
    try {
        // Forzar id_abogado del usuario autenticado
        const datos = {
            ...req.body,
            id_abogado: req.user.id_abogado,
        };

        const movimiento = await finanzasService.crearMovimiento(datos);
        return res.status(201).json({
            success: true,
            message: "Movimiento registrado exitosamente",
            data: movimiento,
        });
    } catch (error) {
        console.error("Error al crear movimiento:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtiene el dashboard financiero con métricas anti-inflación
 * GET /api/finanzas/dashboard
 * Admins ven todo el estudio, otros ven solo sus datos
 */
export const obtenerDashboard = async (req, res) => {
    try {
        const provincia = req.query.provincia || "NQN";
        const isAdmin = req.user.rol === "admin";

        const userContext = {
            id_abogado: req.user.id_abogado,
            rol: req.user.rol,
        };

        // Admin puede filtrar por abogado específico via query param
        if (isAdmin && req.query.id_abogado) {
            userContext.id_abogado_filtro = parseInt(req.query.id_abogado);
        }

        const resumen = await finanzasService.obtenerResumenEstudio(provincia, userContext);
        return res.json({
            success: true,
            data: resumen,
        });
    } catch (error) {
        console.error("Error al obtener dashboard:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Marca una cuota como pagada
 * PATCH /api/finanzas/cuotas/:id
 */
export const marcarCuotaPagada = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_pago } = req.body || {};

        const cuota = await finanzasService.marcarCuotaPagada(id, fecha_pago);

        return res.json({
            success: true,
            message: "Cuota marcada como pagada",
            data: cuota,
        });
    } catch (error) {
        console.error("Error al marcar cuota:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtiene los movimientos de un caso específico
 * GET /api/finanzas/caso/:id_caso
 */
export const obtenerMovimientosPorCaso = async (req, res) => {
    try {
        const { id_caso } = req.params;
        const movimientos = await finanzasService.obtenerMovimientosPorCaso(id_caso);

        return res.json({
            success: true,
            total: movimientos.length,
            data: movimientos,
        });
    } catch (error) {
        console.error("Error al obtener movimientos del caso:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtiene lista de movimientos con filtros y paginación
 * GET /api/finanzas
 */
export const obtenerMovimientos = async (req, res) => {
    try {
        const isAdmin = req.user.rol === "admin";

        const resultado = await finanzasService.obtenerMovimientos({
            page: req.query.page,
            limit: req.query.limit,
            tipo: req.query.tipo,
            estado: req.query.estado,
            id_cliente: req.query.id_cliente,
            id_caso: req.query.id_caso,
            categoria: req.query.categoria,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta,
            // Admin puede filtrar por abogado o ver todo; abogado solo ve lo suyo
            id_abogado: isAdmin
                ? (req.query.id_abogado || null)
                : req.user.id_abogado,
        });

        return res.json({
            success: true,
            data: resultado.movimientos,
            pagination: resultado.pagination,
        });
    } catch (error) {
        console.error("Error al obtener movimientos:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Elimina un movimiento financiero
 * DELETE /api/finanzas/:id
 */
export const eliminarMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await finanzasService.eliminarMovimiento(id);

        return res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Marca un movimiento de ingreso como cobrado
 * PATCH /api/finanzas/:id/cobrar
 */
export const marcarCobrado = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_cobro } = req.body;

        const movimiento = await finanzasService.marcarMovimientoCobrado(id, fecha_cobro);

        return res.json({
            success: true,
            message: "Ingreso marcado como cobrado",
            data: movimiento,
        });
    } catch (error) {
        console.error("Error al marcar cobrado:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtener cuotas de un movimiento
 * GET /api/finanzas/:id_movimiento/cuotas
 */
export const obtenerCuotasMovimientoHandler = async (req, res) => {
    try {
        const cuotas = await finanzasService.obtenerCuotasMovimiento(req.params.id_movimiento);
        return res.json({ success: true, data: cuotas });
    } catch (error) {
        console.error("Error al obtener cuotas:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Actualizar una cuota (fecha/monto)
 * PATCH /api/finanzas/cuotas/:id/editar
 */
export const actualizarCuotaHandler = async (req, res) => {
    try {
        const cuota = await finanzasService.actualizarCuota(req.params.id, req.body);
        return res.json({ success: true, data: cuota });
    } catch (error) {
        console.error("Error al actualizar cuota:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtiene estadísticas anuales calculadas en tiempo real desde MovimientosFinancieros
 * GET /api/finanzas/estadisticas?anio=2026
 */
export const obtenerEstadisticas = async (req, res) => {
    try {
        const anio = req.query.anio || new Date().getFullYear();
        const userContext = {
            id_abogado: req.user.id_abogado,
            rol: req.user.rol,
        };

        const stats = await finanzasService.obtenerEstadisticasAnuales(anio, userContext);
        return res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

export default {
    crearMovimiento,
    obtenerDashboard,
    marcarCuotaPagada,
    marcarCobrado,
    obtenerMovimientosPorCaso,
    obtenerMovimientos,
    eliminarMovimiento,
    obtenerCuotasMovimientoHandler,
    actualizarCuotaHandler,
    obtenerEstadisticas,
};
