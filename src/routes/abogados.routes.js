import express from "express";
import {
  crearAbogado,
  actualizarAbogado,
  buscarAbogados,
  eliminarAbogado,
  obtenerAbogadoPorId,
  obtenerAbogados,
} from "../controllers/abogados_controller.js";

const router = express.Router();

router.post("/", crearAbogado);

router.get("/", obtenerAbogados);
router.get("/search", buscarAbogados);
router.get("/:id", obtenerAbogadoPorId);

router.put("/:id", actualizarAbogado);

router.delete("/:id", eliminarAbogado);

export default router;
