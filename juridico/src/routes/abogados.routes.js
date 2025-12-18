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
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación Y rol admin
router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

// Todas estas rutas son solo para ADMIN
router.post("/", crearAbogado);
router.get("/", obtenerAbogados);
router.get("/search", buscarAbogados);
router.get("/:id", obtenerAbogadoPorId);
router.put("/:id", actualizarAbogado);
router.delete("/:id", eliminarAbogado);

export default router;
