import express from "express";
import {
  crearCaso,
  obtenerCasos,
  obtenerCasoPorId,
  obtenerCasosPorCliente,
  obtenerCasosPorAbogado,
  actualizarCaso,
  cambiarEstadoCaso,
  cerrarCaso,
  eliminarCaso,
} from "../controllers/casos_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Ver todos - Todos pueden
router.get("/", obtenerCasos);

// Ver por cliente - Todos pueden
router.get("/cliente/:id_cliente", obtenerCasosPorCliente);

// Ver por abogado - Todos pueden
router.get("/abogado/:id_abogado", obtenerCasosPorAbogado);

// Ver uno - Todos pueden
router.get("/:id", obtenerCasoPorId);

// Crear - Admin y Abogado pueden
router.post("/", roleMiddleware(["admin", "abogado"]), crearCaso);

// Actualizar - Admin y Abogado pueden
router.put("/:id", roleMiddleware(["admin", "abogado"]), actualizarCaso);

// Cambiar estado - Admin y Abogado pueden
router.put(
  "/:id/cambiar-estado",
  roleMiddleware(["admin", "abogado"]),
  cambiarEstadoCaso
);

// Cerrar caso - Admin y Abogado pueden
router.put("/:id/cerrar", roleMiddleware(["admin", "abogado"]), cerrarCaso);

// Eliminar - Solo Admin
router.delete("/:id", roleMiddleware(["admin"]), eliminarCaso);

export default router;
