import express from "express";
import { chatGeneral } from "../controllers/chat_ia_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas protegidas por autenticación
router.use(authMiddleware);

// POST /api/ia/chat-general
router.post("/chat-general", chatGeneral);

export default router;
