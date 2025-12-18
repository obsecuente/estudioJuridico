import express from "express";
import {
  crearCaso,
  obtenerCasos,
  obtenerCasoPorId,
  actualizarCaso,
  eliminarCaso,
  cambiarEstadoCaso,
  cerrarCaso,
} from "../controllers/casos_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/", obtenerCasos);
router.get("/:id", obtenerCasoPorId);

router.post(
  "/",
  verificarRol(["admin", "abogado"]),
  audit("CREAR", "caso"),
  crearCaso
);

router.put(
  "/:id",
  verificarRol(["admin", "abogado"]),
  audit("ACTUALIZAR", "caso"),
  actualizarCaso
);

router.patch(
  "/:id/estado",
  verificarRol(["admin", "abogado"]),
  audit("CAMBIAR_ESTADO", "caso"),
  cambiarEstadoCaso
);

router.patch(
  "/:id/cerrar",
  verificarRol(["admin", "abogado"]),
  audit("CAMBIAR_ESTADO", "caso"),
  cerrarCaso
);

router.delete(
  "/:id",
  verificarRol(["admin"]),
  audit("ELIMINAR", "caso"),
  eliminarCaso
);

export default router;
