import express from "express";
import {
  crearEvento,
  obtenerEventos,
  obtenerEventoPorId,
  obtenerEventosPorMes,
  obtenerProximosEventos,
  actualizarEvento,
  cambiarEstadoEvento,
  eliminarEvento,
} from "../controllers/eventos_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js";

const router = express.Router();

// todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/eventos - obtener todos
router.get("/", obtenerEventos);

// GET /api/eventos/proximos - próximos eventos del usuario
router.get("/proximos", obtenerProximosEventos);

// GET /api/eventos/mes/:año/:mes - eventos por mes (calendario)
router.get("/mes/:año/:mes", obtenerEventosPorMes);

// GET /api/eventos/:id - obtener por ID
router.get("/:id", obtenerEventoPorId);

// POST /api/eventos - crear
router.post(
  "/",
  verificarRol(["admin", "abogado", "asistente"]),
  audit("CREAR", "evento"),
  crearEvento,
);

// PUT /api/eventos/:id - actualizar
router.put(
  "/:id",
  verificarRol(["admin", "abogado", "asistente"]),
  audit("ACTUALIZAR", "evento"),
  actualizarEvento,
);

// PATCH /api/eventos/:id/estado - cambiar estado
router.patch(
  "/:id/estado",
  verificarRol(["admin", "abogado", "asistente"]),
  audit("CAMBIAR_ESTADO", "evento"),
  cambiarEstadoEvento,
);

// DELETE /api/eventos/:id - eliminar
router.delete(
  "/:id",
  verificarRol(["admin", "abogado"]),
  audit("ELIMINAR", "evento"),
  eliminarEvento,
);

export default router;
