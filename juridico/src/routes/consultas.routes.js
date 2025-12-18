import express from "express";
import {
  crearConsulta,
  obtenerConsultas,
  obtenerConsultaPorId,
  actualizarConsulta,
  eliminarConsulta,
  cambiarEstadoConsulta,
  asignarAbogadoAConsulta,
  crearConsultaPublica,
} from "../controllers/consultas_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Ruta pública (sin autenticación)
router.post("/publica", crearConsultaPublica);

// Todas las demás rutas requieren autenticación
router.use(authMiddleware);

router.get("/", obtenerConsultas);
router.get("/:id", obtenerConsultaPorId);

router.post(
  "/",
  verificarRol(["admin", "abogado", "asistente"]),
  audit("CREAR", "consulta"),
  crearConsulta
);

router.put(
  "/:id",
  verificarRol(["admin", "abogado"]),
  audit("ACTUALIZAR", "consulta"),
  actualizarConsulta
);

router.patch(
  "/:id/estado",
  verificarRol(["admin", "abogado"]),
  audit("CAMBIAR_ESTADO", "consulta"),
  cambiarEstadoConsulta
);

router.patch(
  "/:id/asignar",
  verificarRol(["admin"]),
  audit("ASIGNAR", "consulta"),
  asignarAbogadoAConsulta
);

router.delete(
  "/:id",
  verificarRol(["admin"]),
  audit("ELIMINAR", "consulta"),
  eliminarConsulta
);

export default router;
