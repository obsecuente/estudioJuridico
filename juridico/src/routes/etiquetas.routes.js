// src/routes/etiquetas.routes.js
import express from "express";
import {
    listarEtiquetas,
    crearEtiqueta,
    eliminarEtiqueta,
} from "../controllers/etiquetas_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarEtiquetas);
router.post("/", crearEtiqueta);
router.delete("/:id", eliminarEtiqueta);

export default router;
