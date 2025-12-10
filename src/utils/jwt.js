import jwt from "jsonwebtoken";

/**
 * Genera un token JWT (JSON Web Token)
 *
 * Un JWT es como un "carnet digital" que contiene información del usuario.
 * Tiene 3 partes separadas por puntos:
 *
 * header.payload.signature
 *
 * Ejemplo de payload que guardamos:
 * {
 *   id_abogado: 1,
 *   email: "juan@estudio.com",
 *   rol: "admin",
 *   iat: 1702123456,  // issued at (cuándo se creó)
 *   exp: 1702209856   // expiration (cuándo expira)
 * }
 *
 * La firma (signature) se crea usando JWT_SECRET, lo que hace
 * imposible que alguien modifique el token sin ser detectado.
 */
export const generarToken = (payload) => {
  // payload: { id_abogado, email, rol }
  // process.env.JWT_SECRET: clave secreta para firmar
  // expiresIn: cuándo expira el token (ej: "7d" = 7 días)

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Verifica y decodifica un token JWT
 *
 * Esto pasa en cada petición protegida:
 * 1. Usuario envía token en header: "Bearer eyJhbGc..."
 * 2. Middleware extrae el token
 * 3. jwt.verify() verifica la firma usando JWT_SECRET
 * 4. Si es válido, decodifica y retorna el payload
 * 5. Si es inválido o expiró, lanza error
 *
 * Posibles errores:
 * - TokenExpiredError: El token ya venció
 * - JsonWebTokenError: Token inválido o firma incorrecta
 */
export const verificarToken = (token) => {
  try {
    // jwt.verify() hace 2 cosas:
    // 1. Verifica que la firma sea válida (no fue modificado)
    // 2. Verifica que no haya expirado
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expirado");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Token inválido");
    }
    throw error;
  }
};

export default {
  generarToken,
  verificarToken,
};
