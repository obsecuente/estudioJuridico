// src/routes/etapas_legales.routes.js
import express from "express";
import { listarEtapas } from "../controllers/etapas_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarEtapas);

export default router;
