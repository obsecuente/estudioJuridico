import express from "express";
import {
  resumirDocumento,
  obtenerResumen,
  eliminarResumen,
} from "../controllers/ia.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/ia/resumir/:id - Generar o recuperar resumen de documento
router.post("/resumir/:id", resumirDocumento);

// GET /api/ia/resumen/:id - Obtener resumen de un documento
router.get("/resumen/:id", obtenerResumen);

// DELETE /api/ia/resumen/:id - Eliminar resumen
router.delete("/resumen/:id", eliminarResumen);

export default router;
