import authService from "../services/auth_service.js";

/**
 * REGISTRO DE NUEVO ABOGADO
 * POST /api/auth/register
 *
 * Body esperado:
 * {
 *   "dni": "12345678",
 *   "telefono": "+5492995123456",
 *   "email": "juan@estudio.com",
 *   "password": "miPassword123",
 *   "nombre": "Juan",
 *   "apellido": "Pérez",
 *   "especialidad": "Penal",
 *   "rol": "abogado"
 * }
 */
export const registrar = async (req, res) => {
  try {
    const resultado = await authService.registrar(req.body);

    return res.status(201).json({
      success: true,
      message: "Abogado registrado exitosamente",
      data: {
        abogado: resultado.abogado,
        token: resultado.token,
      },
    });
  } catch (error) {
    console.error("Error al registrar abogado:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * LOGIN (INICIAR SESIÓN)
 * POST /api/auth/login
 *
 * Body esperado:
 * {
 *   "email": "juan@estudio.com",
 *   "password": "miPassword123"
 * }
 *
 * Respuesta exitosa:
 * {
 *   "success": true,
 *   "message": "Login exitoso",
 *   "data": {
 *     "abogado": { ... },
 *     "token": "eyJhbGc..."
 *   }
 * }
 */
export const login = async (req, res) => {
  try {
    const resultado = await authService.login(req.body);

    return res.status(200).json({
      success: true,
      message: "Login exitoso",
      data: {
        abogado: resultado.abogado,
        token: resultado.token,
      },
    });
  } catch (error) {
    console.error("Error al hacer login:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * OBTENER PERFIL DEL USUARIO AUTENTICADO
 * GET /api/auth/perfil
 * Headers: { Authorization: "Bearer token" }
 *
 * No necesita parámetros, usa req.user.id_abogado
 * que fue agregado por authMiddleware
 */
export const obtenerPerfil = async (req, res) => {
  try {
    // req.user fue agregado por authMiddleware
    const abogado = await authService.obtenerPerfil(req.user.id_abogado);

    return res.status(200).json({
      success: true,
      data: abogado,
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * ACTUALIZAR PERFIL DEL USUARIO AUTENTICADO
 * PUT /api/auth/perfil
 * Headers: { Authorization: "Bearer token" }
 *
 * Body (todos opcionales):
 * {
 *   "nombre": "Juan Carlos",
 *   "apellido": "Pérez",
 *   "telefono": "+5492995987654",
 *   "email": "juancarlos@estudio.com",
 *   "especialidad": "Penal y Civil"
 * }
 */
export const actualizarPerfil = async (req, res) => {
  try {
    const abogado = await authService.actualizarPerfil(
      req.user.id_abogado,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Perfil actualizado exitosamente",
      data: abogado,
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * CAMBIAR CONTRASEÑA
 * PUT /api/auth/password
 * Headers: { Authorization: "Bearer token" }
 *
 * Body:
 * {
 *   "passwordActual": "miPassword123",
 *   "passwordNuevo": "nuevoPassword456"
 * }
 */
export const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    const resultado = await authService.cambiarPassword(
      req.user.id_abogado,
      passwordActual,
      passwordNuevo
    );

    return res.status(200).json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
};
