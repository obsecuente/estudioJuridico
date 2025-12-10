import express from "express";
import {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
} from "../controllers/auth_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * RUTAS PÚBLICAS (sin autenticación)
 * Cualquiera puede acceder a estas rutas
 */

// Registrar nuevo abogado
// POST /api/auth/register
router.post("/register", registrar);

// Iniciar sesión
// POST /api/auth/login
router.post("/login", login);

/**
 * RUTAS PROTEGIDAS (requieren autenticación)
 * Necesitan header: Authorization: Bearer token
 */

// Obtener mi perfil
// GET /api/auth/perfil
router.get("/perfil", authMiddleware, obtenerPerfil);

// Actualizar mi perfil
// PUT /api/auth/perfil
router.put("/perfil", authMiddleware, actualizarPerfil);

// Cambiar mi contraseña
// PUT /api/auth/password
router.put("/password", authMiddleware, cambiarPassword);

export default router;
