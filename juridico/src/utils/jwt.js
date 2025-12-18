import jwt from "jsonwebtoken";

/**
 * Genera un token de ACCESO (corta duración)
 */
export const generarToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });
};

/**
 * Genera un token de REFRESH (larga duración)
 */
export const generarRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
};

/**
 * Verifica un token de ACCESO
 */
export const verificarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Token inválido o expirado");
  }
};

/**
 * Verifica un token de REFRESH
 */
export const verificarRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new Error("Refresh token inválido o expirado");
  }
};

export default {
  generarToken,
  generarRefreshToken,
  verificarToken,
  verificarRefreshToken,
};
