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
import { verificarRol } from "../middleware/roleMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js"; // IMPORTAR

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/", obtenerClientes);
router.get("/search", buscarClientes);
router.get("/:id", obtenerClientePorId);

// Con auditoría
router.post(
  "/",
  verificarRol(["admin", "abogado", "asistente"]),
  audit("CREAR", "cliente"), // ← AUDITAR
  crearCliente
);

router.put(
  "/:id",
  verificarRol(["admin", "abogado", "asistente"]),
  audit("ACTUALIZAR", "cliente"), // ← AUDITAR
  actualizarCliente
);

router.delete(
  "/:id",
  verificarRol(["admin"]),
  audit("ELIMINAR", "cliente"), // ← AUDITAR
  eliminarCliente
);

export default router;
