import { verificarToken } from "../utils/jwt.js";
import { Abogado } from "../models/index.js";

/**
 * MIDDLEWARE DE AUTENTICACIÓN
 *
 * Este middleware verifica que el usuario esté autenticado.
 *
 * Flujo:
 * 1. Usuario hace petición con header: Authorization: "Bearer token123"
 * 2. Middleware extrae el token del header
 * 3. Verifica que el token sea válido (no expiró, no fue modificado)
 * 4. Decodifica el token y obtiene: { id_abogado, email, rol }
 * 5. Busca al abogado en la BD para confirmar que existe
 * 6. Agrega el abogado a req.user para que esté disponible en el controller
 * 7. Llama a next() para continuar a la siguiente función
 *
 * Si algo falla (token inválido, expirado, o abogado no existe):
 * - Responde con error 401 Unauthorized
 * - NO llama a next(), corta el flujo
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // 1. Obtener el token del header Authorization
    // Header viene así: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;

    // Validar que exista el header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "No se proporcionó token de autenticación",
      });
    }

    // Validar que tenga el formato correcto: "Bearer token"
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Formato de token inválido. Debe ser: Bearer [token]",
      });
    }

    // 2. Extraer el token (quitar "Bearer ")
    // "Bearer eyJhbG..." → "eyJhbG..."
    const token = authHeader.substring(7);

    // 3. Verificar y decodificar el token
    // Si el token es inválido o expiró, verificarToken() lanza error
    let decoded;
    try {
      decoded = verificarToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: error.message, // "Token expirado" o "Token inválido"
      });
    }

    // decoded ahora tiene: { id_abogado: 1, email: "...", rol: "...", iat: ..., exp: ... }

    // 4. Verificar que el abogado existe en la BD
    // (por si fue eliminado después de generar el token)
    const abogado = await Abogado.findByPk(decoded.id_abogado, {
      attributes: ["id_abogado", "email", "rol", "nombre", "apellido"],
    });

    if (!abogado) {
      return res.status(401).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // 5. Agregar el abogado a req.user
    // Ahora cualquier controller que venga después puede usar req.user
    req.user = {
      id_abogado: abogado.id_abogado,
      email: abogado.email,
      rol: abogado.rol,
      nombre: abogado.nombre,
      apellido: abogado.apellido,
    };

    // 6. Continuar al siguiente middleware o controller
    next();
  } catch (error) {
    console.error("Error en authMiddleware:", error);
    return res.status(500).json({
      success: false,
      error: "Error en la autenticación",
    });
  }
};

export default authMiddleware;
