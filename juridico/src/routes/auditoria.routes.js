import express from "express";
import {
  obtenerHistorial,
  obtenerActividadRecienteUsuario,
} from "../controllers/auditoria_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/auditoria - Obtener historial completo (admin)
router.get("/", obtenerHistorial);

// GET /api/auditoria/reciente - Actividad reciente del usuario
router.get("/reciente", obtenerActividadRecienteUsuario);

export default router;
