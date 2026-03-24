import express from "express";
import {
  resumirDocumento,
  obtenerResumen,
  eliminarResumen,
  preguntarDocumento,
  chatGeneral,
} from "../controllers/ia.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/ia/resumir/:id - Generar o recuperar resumen de documento
router.post("/resumir/:id", resumirDocumento);

// POST /api/ia/preguntar/:id - Chatear con un documento
router.post("/preguntar/:id", preguntarDocumento);

// GET /api/ia/resumen/:id - Obtener resumen de un documento
router.get("/resumen/:id", obtenerResumen);

// DELETE /api/ia/resumen/:id - Eliminar resumen
router.delete("/resumen/:id", eliminarResumen);

// POST /api/ia/chat - Chat general con IA
router.post("/chat", chatGeneral);

export default router;
