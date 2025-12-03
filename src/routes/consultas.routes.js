import express from "express";
import { crearConsulta } from "../controllers/consultas_controller.js";

const router = express.Router();
router.post("/", crearConsulta);

export default router;
