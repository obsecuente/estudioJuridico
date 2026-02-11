// src/routes/finanzas.routes.js
import { Router } from "express";
import {
    crearMovimiento,
    obtenerDashboard,
    marcarCuotaPagada,
    obtenerMovimientosPorCaso,
    obtenerMovimientos,
} from "../controllers/finanzas_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

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
 * Query: page, limit, tipo, estado, id_cliente, id_caso, categoria
 */
router.get("/", obtenerMovimientos);

/**
 * GET /api/finanzas/dashboard
 * Dashboard financiero con métricas anti-inflación
 * Query: provincia (NQN|RN, default: NQN)
 */
router.get("/dashboard", obtenerDashboard);

/**
 * GET /api/finanzas/caso/:id_caso
 * Movimientos de un caso específico
 */
router.get("/caso/:id_caso", obtenerMovimientosPorCaso);

/**
 * PATCH /api/finanzas/cuotas/:id
 * Marca una cuota como pagada
 * Body: { fecha_pago? } (opcional, default: hoy)
 */
router.patch("/cuotas/:id", marcarCuotaPagada);

export default router;
