import express from "express";
import {
  crearCliente,
  eliminarCliente,
  actualizarCliente,
  obtenerClientes,
  obtenerClientePorId,
  buscarClientes,
} from "../controllers/clientes_controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Aplicar autenticación a TODAS las rutas
router.use(authMiddleware);

// GET - Obtener todos los clientes
router.get("/", obtenerClientes);

// GET - Buscar clientes
router.get("/search", buscarClientes);

// GET - Obtener un cliente por ID
router.get("/:id", obtenerClientePorId);

// POST - Crear cliente (con auditoría)
router.post(
  "/",
  verificarRol(["admin", "abogado", "asistente"]),
  audit("CREAR", "cliente"),
  crearCliente
);

// PUT - Actualizar cliente (con auditoría)
router.put(
  "/:id",
  verificarRol(["admin", "abogado", "asistente"]),
  audit("ACTUALIZAR", "cliente"),
  actualizarCliente
);

// DELETE - Eliminar cliente (con auditoría)
router.delete(
  "/:id",
  verificarRol(["admin", "abogado"]),
  audit("ELIMINAR", "cliente"),
  eliminarCliente
);

export default router;
