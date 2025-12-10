import express from "express";
import {
  crearAbogado,
  obtenerAbogados,
  obtenerAbogadoPorId,
  actualizarAbogado,
  eliminarAbogado,
} from "../controllers/abogados_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticación y solo admin puede usarlas
router.use(authMiddleware);
router.use(verificarRol(["admin"]));

router.get("/", obtenerAbogados);
router.get("/:id", obtenerAbogadoPorId);

router.post("/", audit("CREAR", "abogado"), crearAbogado);

router.put("/:id", audit("ACTUALIZAR", "abogado"), actualizarAbogado);

router.delete("/:id", audit("ELIMINAR", "abogado"), eliminarAbogado);

export default router;
