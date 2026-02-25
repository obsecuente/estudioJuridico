
import { Router } from "express";
import cierreMensualController from "../controllers/cierre_mensual_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", cierreMensualController.obtenerCierres);
router.post("/generar", cierreMensualController.generarCierreManual);

export default router;
