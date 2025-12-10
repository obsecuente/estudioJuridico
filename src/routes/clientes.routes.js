import express from "express";
import {
  crearCliente,
  eliminarCliente,
  actualizarCliente,
  obtenerClientes,
  obtenerClientePorId,
  buscarClientes,
} from "../controllers/clientes_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Ver todos - Todos pueden
router.get("/", obtenerClientes);

// Buscar - Todos pueden
router.get("/search", buscarClientes);

// Ver uno - Todos pueden
router.get("/:id", obtenerClientePorId);

// Crear - Admin, Abogado, Asistente pueden
router.post(
  "/",
  roleMiddleware(["admin", "abogado", "asistente"]),
  crearCliente
);

// Actualizar - Admin, Abogado, Asistente pueden
router.put(
  "/:id",
  roleMiddleware(["admin", "abogado", "asistente"]),
  actualizarCliente
);

// Eliminar - Solo Admin
router.delete("/:id", roleMiddleware(["admin"]), eliminarCliente);

export default router;
