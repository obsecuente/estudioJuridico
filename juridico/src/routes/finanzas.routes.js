// src/routes/finanzas.routes.js
import { Router } from "express";
import {
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
} from "../controllers/finanzas_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { validateMovimientoOwnership } from "../middleware/validateOwnership.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * POST /api/finanzas
 * Crea un nuevo movimiento financiero (ingreso/egreso)
 * Body: { tipo, categoria, descripcion, monto_ars, monto_jus, provincia, id_caso, id_cliente, estado, cuotas }
 */
router.post("/", crearMovimiento);

/**
 * GET /api/finanzas
 * Lista movimientos con filtros y paginación
 * Query: page, limit, tipo, estado, id_cliente, id_caso, categoria, id_abogado (admin)
 */
router.get("/", obtenerMovimientos);

/**
 * GET /api/finanzas/dashboard
 * Dashboard financiero con métricas anti-inflación
 * Query: provincia (NQN|RN), id_abogado (admin only)
 */
router.get("/dashboard", obtenerDashboard);

/**
 * GET /api/finanzas/estadisticas
 * Estadísticas anuales calculadas en tiempo real
 * Query: anio (default: año actual)
 */
router.get("/estadisticas", obtenerEstadisticas);

/**
 * GET /api/finanzas/caso/:id_caso
 * Movimientos de un caso específico
 */
router.get("/caso/:id_caso", obtenerMovimientosPorCaso);

/**
 * PATCH /api/finanzas/:id/cobrar
 * Marca un ingreso pendiente como cobrado (con validación de ownership)
 * Body: { fecha_cobro? } (opcional, default: hoy)
 */
router.patch("/:id/cobrar", validateMovimientoOwnership, marcarCobrado);

/**
 * DELETE /api/finanzas/:id
 * Elimina un movimiento financiero (validación de ownership)
 */
router.delete("/:id", validateMovimientoOwnership, eliminarMovimiento);

/**
 * PATCH /api/finanzas/cuotas/:id
 * Marca una cuota como pagada
 * Body: { fecha_pago? } (opcional, default: hoy)
 */
router.patch("/cuotas/:id", marcarCuotaPagada);

/**
 * PATCH /api/finanzas/cuotas/:id/editar
 * Edita fecha/monto de una cuota
 * Body: { fecha_vencimiento?, monto_cuota? }
 */
router.patch("/cuotas/:id/editar", actualizarCuotaHandler);

/**
 * GET /api/finanzas/:id_movimiento/cuotas
 * Obtiene las cuotas de un movimiento
 */
router.get("/:id_movimiento/cuotas", obtenerCuotasMovimientoHandler);

export default router;
