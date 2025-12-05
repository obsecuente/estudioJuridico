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

const router = express.Router();

router.post("/", crearConsulta); //* (uso interno)
router.post("/publica", crearConsultaPublica);

router.get("/", obtenerConsultas); // paginacion
router.get("/cliente/:id_cliente", obtenerConsultasPorCliente); // Por cliente
router.get("/abogado/:id_abogado", obtenerConsultasPorAbogado); // Por abogado
router.get("/:id", obtenerConsultaPorId); // Por ID específico de consulta

router.put("/:id", actualizarConsulta); // Actualización general
router.put("/:id/asignar-abogado", asignarAbogadoAConsulta);
router.put("/:id/cambiar-estado", cambiarEstadoConsulta);

router.delete("/:id", eliminarConsulta);
export default router;
