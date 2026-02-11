// src/routes/configuracion.routes.js
import { Router } from "express";
import {
    obtenerJus,
    actualizarJus,
    obtenerTodas,
    upsertConfiguracion,
} from "../controllers/configuracion_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/configuracion/jus
 * Obtiene valores de JUS para ambas provincias
 */
router.get("/jus", obtenerJus);

/**
 * PUT /api/configuracion/jus
 * Actualiza valor JUS de una provincia
 * Body: { provincia: "NQN"|"RN", valor: number }
 */
router.put("/jus", actualizarJus);

/**
 * GET /api/configuracion
 * Lista todas las configuraciones del estudio
 */
router.get("/", obtenerTodas);

/**
 * PUT /api/configuracion
 * Crea o actualiza una configuración genérica
 * Body: { clave: string, valor: string }
 */
router.put("/", upsertConfiguracion);

export default router;
