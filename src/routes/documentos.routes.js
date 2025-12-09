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

const router = express.Router();

// CREATE - Subir documento(s)
// upload.array("archivos", 10) permite hasta 10 archivos a la vez
router.post("/", upload.array("archivos", 10), subirDocumento);

router.get("/", obtenerDocumentos);
router.get("/caso/:id_caso", obtenerDocumentosPorCaso); // Por caso
router.get("/:id", obtenerDocumentoPorId); // Por ID
router.get("/:id/descargar", descargarDocumento); // Descargar archivo

router.delete("/:id", eliminarDocumento);

export default router;
