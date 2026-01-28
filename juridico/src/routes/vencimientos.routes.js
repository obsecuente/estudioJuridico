import express from "express";
import {
  crearVencimiento,
  obtenerVencimientos,
  obtenerVencimientoPorId,
  obtenerResumen,
  obtenerProximosVencimientos,
  actualizarVencimiento,
  marcarCumplido,
  eliminarVencimiento,
  obtenerTiposVencimiento,
} from "../controllers/vencimientos_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js";

const router = express.Router();

// todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/vencimientos/tipos - tipos disponibles
router.get("/tipos", obtenerTiposVencimiento);

// GET /api/vencimientos/resumen - resumen para dashboard
router.get("/resumen", obtenerResumen);

// GET /api/vencimientos/proximos - próximos a vencer
router.get("/proximos", obtenerProximosVencimientos);

// GET /api/vencimientos - obtener todos
router.get("/", obtenerVencimientos);

// GET /api/vencimientos/:id - obtener por ID
router.get("/:id", obtenerVencimientoPorId);

// POST /api/vencimientos - crear
router.post(
  "/",
  verificarRol(["admin", "abogado"]),
  audit("CREAR", "vencimiento"),
  crearVencimiento,
);

// PUT /api/vencimientos/:id - actualizar
router.put(
  "/:id",
  verificarRol(["admin", "abogado"]),
  audit("ACTUALIZAR", "vencimiento"),
  actualizarVencimiento,
);

// PATCH /api/vencimientos/:id/cumplir - marcar cumplido
router.patch(
  "/:id/cumplir",
  verificarRol(["admin", "abogado"]),
  audit("CAMBIAR_ESTADO", "vencimiento"),
  marcarCumplido,
);

// DELETE /api/vencimientos/:id - eliminar
router.delete(
  "/:id",
  verificarRol(["admin", "abogado"]),
  audit("ELIMINAR", "vencimiento"),
  eliminarVencimiento,
);

export default router;
