// src/routes/tareas.routes.js
import { Router } from "express";
import {
    crearTarea,
    obtenerTareas,
    obtenerTareaPorId,
    actualizarTarea,
    marcarCompletada,
    eliminarTarea,
    obtenerEstadisticas,
    obtenerMiDia,
    pasarAPlazoDeGracia,
} from "../controllers/tareas_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// Todas las rutas requieren autenticación
// Las tareas se filtran automáticamente por req.user.id_abogado
router.use(authMiddleware);

/**
 * GET /api/tareas/estadisticas
 * Estadísticas de tareas del abogado autenticado
 * Debe ir ANTES de /:id para evitar conflicto de rutas
 */
router.get("/estadisticas", obtenerEstadisticas);

/**
 * GET /api/tareas/mi-dia
 * Retorna tareas organizadas por urgencia para el dashboard Mi Día
 */
router.get("/mi-dia", obtenerMiDia);

/**
 * GET /api/tareas
 * Lista tareas del abogado autenticado con filtros
 * Query: completadas, prioridad, id_caso, vencidas, page, limit
 */
router.get("/", obtenerTareas);

/**
 * POST /api/tareas
 * Crea una nueva tarea para el abogado autenticado
 * Body: { descripcion, prioridad?, fecha_limite?, id_caso? }
 */
router.post("/", crearTarea);

/**
 * GET /api/tareas/:id
 * Obtiene una tarea específica (solo si pertenece al abogado)
 */
router.get("/:id", obtenerTareaPorId);

/**
 * PUT /api/tareas/:id
 * Actualiza una tarea
 * Body: { descripcion?, prioridad?, fecha_limite?, id_caso?, completada? }
 */
router.put("/:id", actualizarTarea);

/**
 * PATCH /api/tareas/:id/completar
 * Marca tarea como completada o pendiente
 * Body: { completada: boolean }
 */
router.patch("/:id/completar", marcarCompletada);

/**
 * PATCH /api/tareas/:id/plazo-gracia
 * Pasa tarea al plazo de gracia (Art. 124 CPCC)
 */
router.patch("/:id/plazo-gracia", pasarAPlazoDeGracia);

/**
 * DELETE /api/tareas/:id
 * Elimina una tarea
 */
router.delete("/:id", eliminarTarea);

export default router;
