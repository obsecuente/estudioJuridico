import express from "express";
import {
  crearCliente,
  eliminarCliente,
  actualizarCliente,
  obtenerClientes,
  obtenerClientePorId,
  buscarClientes,
} from "../controllers/clientes_controller.js";

const router = express.Router();

router.get("/", obtenerClientes);
router.get("/search", buscarClientes);
router.get("/:id", obtenerClientePorId);
router.post("/", crearCliente);
router.put("/:id", actualizarCliente);
router.delete("/:id", eliminarCliente);

export default router;
