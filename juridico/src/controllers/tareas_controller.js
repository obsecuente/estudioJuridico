// src/controllers/tareas_controller.js
import tareasService from "../services/tareas_service.js";

/**
 * Crea una nueva tarea
 * POST /api/tareas
 */
export const crearTarea = async (req, res) => {
    try {
        // Forzar el id_abogado del usuario autenticado
        const datos = {
            ...req.body,
            id_abogado: req.user.id_abogado,
        };

        const tarea = await tareasService.crear(datos);

        return res.status(201).json({
            success: true,
            message: "Tarea creada exitosamente",
            data: tarea,
        });
    } catch (error) {
        console.error("Error al crear tarea:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtiene las tareas del abogado autenticado
 * GET /api/tareas
 */
export const obtenerTareas = async (req, res) => {
    try {
        const resultado = await tareasService.obtenerPorAbogado(
            req.user.id_abogado,
            {
                completadas: req.query.completadas,
                prioridad: req.query.prioridad,
                id_caso: req.query.id_caso,
                vencidas: req.query.vencidas,
                page: req.query.page,
                limit: req.query.limit,
            }
        );

        return res.json({
            success: true,
            data: resultado.tareas,
            pagination: resultado.pagination,
        });
    } catch (error) {
        console.error("Error al obtener tareas:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtiene una tarea por ID
 * GET /api/tareas/:id
 */
export const obtenerTareaPorId = async (req, res) => {
    try {
        const tarea = await tareasService.obtenerPorId(
            req.params.id,
            req.user.id_abogado
        );

        return res.json({
            success: true,
            data: tarea,
        });
    } catch (error) {
        console.error("Error al obtener tarea:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Actualiza una tarea
 * PUT /api/tareas/:id
 */
export const actualizarTarea = async (req, res) => {
    try {
        const tarea = await tareasService.actualizar(
            req.params.id,
            req.user.id_abogado,
            req.body
        );

        return res.json({
            success: true,
            message: "Tarea actualizada exitosamente",
            data: tarea,
        });
    } catch (error) {
        console.error("Error al actualizar tarea:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Marca una tarea como completada/pendiente
 * PATCH /api/tareas/:id/completar
 */
export const marcarCompletada = async (req, res) => {
    try {
        const { completada = true } = req.body;

        const tarea = await tareasService.marcarCompletada(
            req.params.id,
            req.user.id_abogado,
            completada
        );

        return res.json({
            success: true,
            message: completada ? "Tarea completada" : "Tarea restaurada a pendiente",
            data: tarea,
        });
    } catch (error) {
        console.error("Error al marcar tarea:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Elimina una tarea
 * DELETE /api/tareas/:id
 */
export const eliminarTarea = async (req, res) => {
    try {
        const resultado = await tareasService.eliminar(
            req.params.id,
            req.user.id_abogado
        );

        return res.json({
            success: true,
            message: resultado.message,
        });
    } catch (error) {
        console.error("Error al eliminar tarea:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtiene estadísticas de tareas del abogado
 * GET /api/tareas/estadisticas
 */
export const obtenerEstadisticas = async (req, res) => {
    try {
        const stats = await tareasService.obtenerEstadisticas(req.user.id_abogado);

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

/**
 * Obtiene las tareas organizadas para "Mi Día"
 * GET /api/tareas/mi-dia
 */
export const obtenerMiDia = async (req, res) => {
    try {
        const resultado = await tareasService.obtenerMiDia(req.user.id_abogado);

        return res.json({
            success: true,
            data: resultado,
        });
    } catch (error) {
        console.error("Error al obtener Mi Día:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Pasa una tarea al plazo de gracia
 * PATCH /api/tareas/:id/plazo-gracia
 */
export const pasarAPlazoDeGracia = async (req, res) => {
    try {
        const tarea = await tareasService.pasarAPlazoDeGracia(
            req.params.id,
            req.user.id_abogado
        );

        return res.json({
            success: true,
            message: "Tarea pasada al plazo de gracia (Art. 124 CPCC)",
            data: tarea,
        });
    } catch (error) {
        console.error("Error al pasar al plazo de gracia:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

export default {
    crearTarea,
    obtenerTareas,
    obtenerTareaPorId,
    actualizarTarea,
    marcarCompletada,
    eliminarTarea,
    obtenerEstadisticas,
    obtenerMiDia,
    pasarAPlazoDeGracia,
};
