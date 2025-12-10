import express from "express";
import upload from "../config/multerConfig.js";
import {
  subirDocumento,
  obtenerDocumentosPorCaso,
  obtenerDocumentoPorId,
  obtenerDocumentos,
  eliminarDocumento,
  descargarDocumento,
} from "../controllers/documentos_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Ver todos - Todos pueden
router.get("/", obtenerDocumentos);

// Ver por caso - Todos pueden
router.get("/caso/:id_caso", obtenerDocumentosPorCaso);

// Ver uno - Todos pueden
router.get("/:id", obtenerDocumentoPorId);

// Descargar - Todos pueden
router.get("/:id/descargar", descargarDocumento);

// Subir - Admin, Abogado, Asistente pueden
router.post(
  "/",
  roleMiddleware(["admin", "abogado", "asistente"]),
  upload.array("archivos", 10),
  subirDocumento
);

// Eliminar - Solo Admin
router.delete("/:id", roleMiddleware(["admin"]), eliminarDocumento);

export default router;
