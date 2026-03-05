import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  subirDocumento,
  obtenerDocumentos,
  obtenerDocumentoPorId,
  obtenerDocumentosPorCaso,
  eliminarDocumento,
  descargarDocumento,
  actualizarNombreDocumento,
} from "../controllers/documentos_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = "uploads/temp/";
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `documento-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo - aumentado para documentos legales extensos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido"));
    }
  },
});

// IMPORTANTE: authMiddleware PRIMERO
router.use(authMiddleware);

// Rutas
router.get("/", obtenerDocumentos);
router.get("/:id", obtenerDocumentoPorId);
router.get("/caso/:id_caso", obtenerDocumentosPorCaso);
router.get("/:id/descargar", descargarDocumento);

// POST con upload - SIN audit por ahora
router.post("/", upload.array("archivo", 5), subirDocumento);

// DELETE con audit
router.delete("/:id", audit("ELIMINAR", "documento"), eliminarDocumento);

router.put("/:id", audit("ACTUALIZAR", "documento"), actualizarNombreDocumento);

export default router;
