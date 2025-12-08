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

const router = express.Router();

router.post("/", crearCaso);

router.get("/", obtenerCasos); // Con paginación y filtros
router.get("/cliente/:id_cliente", obtenerCasosPorCliente); // Por cliente
router.get("/abogado/:id_abogado", obtenerCasosPorAbogado); // Por abogado
router.get("/:id", obtenerCasoPorId); // Por ID específico

router.put("/:id", actualizarCaso); // Actualización general
router.put("/:id/cambiar-estado", cambiarEstadoCaso); // Cambiar estado
router.put("/:id/cerrar", cerrarCaso); // Cerrar caso (helper)

router.delete("/:id", eliminarCaso);

export default router;
