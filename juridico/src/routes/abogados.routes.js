import express from "express";
import {
  crearAbogado,
  actualizarAbogado,
  buscarAbogados,
  eliminarAbogado,
  obtenerAbogadoPorId,
  obtenerAbogados,
} from "../controllers/abogados_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware, { verificarRol } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de consulta (Permitidas para admin, abogado y asistente)
router.get("/", verificarRol(["admin", "abogado", "asistente"]), obtenerAbogados);
router.get("/search", verificarRol(["admin", "abogado", "asistente"]), buscarAbogados);
router.get("/:id", verificarRol(["admin", "abogado", "asistente"]), obtenerAbogadoPorId);

// Rutas de administración (Solo ADMIN)
router.post("/", verificarRol(["admin"]), crearAbogado);
router.put("/:id", verificarRol(["admin"]), actualizarAbogado);
router.delete("/:id", verificarRol(["admin"]), eliminarAbogado);

export default router;
