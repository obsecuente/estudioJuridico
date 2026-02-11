// src/routes/gastos_recurrentes.routes.js
import { Router } from "express";
import gastosRecurrentesService from "../services/gastos_recurrentes_service.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// Todas las rutas protegidas
router.use(authMiddleware);

/**
 * POST /api/finanzas/gastos-recurrentes
 * Crear gasto recurrente
 */
router.post("/", async (req, res) => {
    try {
        const gasto = await gastosRecurrentesService.crearGastoRecurrente({
            ...req.body,
            id_abogado: req.user.id_abogado,
        });
        return res.status(201).json({ success: true, data: gasto });
    } catch (error) {
        console.error("Error al crear gasto recurrente:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/finanzas/gastos-recurrentes
 * Listar gastos recurrentes activos
 */
router.get("/", async (req, res) => {
    try {
        const gastos = await gastosRecurrentesService.obtenerGastosRecurrentes(
            req.user.id_abogado
        );
        return res.json({ success: true, data: gastos });
    } catch (error) {
        console.error("Error al obtener gastos recurrentes:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/finanzas/gastos-recurrentes/pendientes
 * Obtener movimientos pendientes del mes
 */
router.get("/pendientes", async (req, res) => {
    try {
        const pendientes = await gastosRecurrentesService.obtenerPendientesMes(
            req.user.id_abogado
        );
        return res.json({ success: true, data: pendientes });
    } catch (error) {
        console.error("Error al obtener pendientes:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/finanzas/gastos-recurrentes/:id
 * Actualizar gasto recurrente
 */
router.patch("/:id", async (req, res) => {
    try {
        const gasto = await gastosRecurrentesService.actualizarGastoRecurrente(
            req.params.id,
            req.body
        );
        return res.json({ success: true, data: gasto });
    } catch (error) {
        console.error("Error al actualizar gasto recurrente:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * DELETE /api/finanzas/gastos-recurrentes/:id
 * Eliminar gasto recurrente
 */
router.delete("/:id", async (req, res) => {
    try {
        const resultado = await gastosRecurrentesService.eliminarGastoRecurrente(
            req.params.id
        );
        return res.json({ success: true, ...resultado });
    } catch (error) {
        console.error("Error al eliminar gasto recurrente:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/finanzas/gastos-recurrentes/generar
 * Forzar generación de movimientos del mes (admin/debug)
 */
router.post("/generar", async (req, res) => {
    try {
        const resultado = await gastosRecurrentesService.generarMovimientosMensuales();
        return res.json({ success: true, ...resultado });
    } catch (error) {
        console.error("Error al generar movimientos:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/finanzas/movimientos/:id/pagar
 * Marcar movimiento como pagado
 */
router.patch("/movimientos/:id/pagar", async (req, res) => {
    try {
        const mov = await gastosRecurrentesService.marcarPagado(req.params.id);
        return res.json({ success: true, data: mov });
    } catch (error) {
        console.error("Error al marcar pagado:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PATCH /api/finanzas/movimientos/:id/despagar
 * Desmarcar movimiento pagado (undo)
 */
router.patch("/movimientos/:id/despagar", async (req, res) => {
    try {
        const mov = await gastosRecurrentesService.desmarcarPagado(req.params.id);
        return res.json({ success: true, data: mov });
    } catch (error) {
        console.error("Error al desmarcar pagado:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
