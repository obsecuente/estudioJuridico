import express from "express";
import {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  solicitarRecuperacionPassword,
  resetearPassword,
  renovarToken,
  logout, // NUEVO
} from "../controllers/auth_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Rutas públicas
router.post("/register", registrar);
router.post("/login", login);
router.post("/forgot-password", solicitarRecuperacionPassword);
router.post("/reset-password", resetearPassword);
router.post("/refresh", renovarToken);

// Rutas protegidas
router.get("/perfil", authMiddleware, obtenerPerfil);
router.put("/perfil", authMiddleware, actualizarPerfil);
router.put("/password", authMiddleware, cambiarPassword);
router.post("/logout", authMiddleware, logout); // NUEVO

export default router;
