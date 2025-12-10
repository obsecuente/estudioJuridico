import express from "express";
import {
  crearConsulta,
  obtenerConsultas,
  obtenerConsultaPorId,
  actualizarConsulta,
  asignarAbogadoAConsulta,
  eliminarConsulta,
  cambiarEstadoConsulta,
  crearConsultaPublica,
  obtenerConsultasPorAbogado,
  obtenerConsultasPorCliente,
} from "../controllers/consultas_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Ruta pública (sin autenticación)
router.post("/publica", crearConsultaPublica);

// Todas las demás rutas requieren autenticación
router.use(authMiddleware);

// Ver todas - Todos pueden
router.get("/", obtenerConsultas);

// Ver por cliente - Todos pueden
router.get("/cliente/:id_cliente", obtenerConsultasPorCliente);

// Ver por abogado - Todos pueden
router.get("/abogado/:id_abogado", obtenerConsultasPorAbogado);

// Ver una - Todos pueden
router.get("/:id", obtenerConsultaPorId);

// Crear - Admin, Abogado, Asistente pueden
router.post(
  "/",
  roleMiddleware(["admin", "abogado", "asistente"]),
  crearConsulta
);

// Actualizar - Admin y Abogado pueden
router.put("/:id", roleMiddleware(["admin", "abogado"]), actualizarConsulta);

// Asignar abogado - Solo Admin
router.put(
  "/:id/asignar-abogado",
  roleMiddleware(["admin"]),
  asignarAbogadoAConsulta
);

// Cambiar estado - Admin y Abogado pueden
router.put(
  "/:id/cambiar-estado",
  roleMiddleware(["admin", "abogado"]),
  cambiarEstadoConsulta
);

// Eliminar - Solo Admin
router.delete("/:id", roleMiddleware(["admin"]), eliminarConsulta);

export default router;
