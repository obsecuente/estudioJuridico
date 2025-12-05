import express from "express";
import {
  crearConsulta,
  obtenerConsultas,
  obtenerConsultasporId,
} from "../controllers/consultas_controller.js";

const router = express.Router();
router.post("/", crearConsulta);
router.get("/", obtenerConsultas);
router.get("/:id", obtenerConsultasporId);
export default router;
