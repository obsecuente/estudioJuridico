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
        const userContext = {
            id_abogado: req.user.id_abogado,
            rol: req.user.rol,
        };
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
        const { fecha_pago } = req.body;

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
        const resultado = await finanzasService.obtenerMovimientos({
            page: req.query.page,
            limit: req.query.limit,
            tipo: req.query.tipo,
            estado: req.query.estado,
            id_cliente: req.query.id_cliente,
            id_caso: req.query.id_caso,
            categoria: req.query.categoria,
            id_abogado: req.user.id_abogado,
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

export default {
    crearMovimiento,
    obtenerDashboard,
    marcarCuotaPagada,
    obtenerMovimientosPorCaso,
    obtenerMovimientos,
    eliminarMovimiento,
};
