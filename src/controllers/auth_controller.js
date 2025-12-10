import authService from "../services/auth_service.js";
import { registrarAuditoria } from "../services/auditoria_service.js";

/**
 * REGISTRO DE NUEVO ABOGADO
 * POST /api/auth/register
 */
export const registrar = async (req, res) => {
  try {
    const resultado = await authService.registrar(req.body);

    return res.status(201).json({
      success: true,
      message: "Abogado registrado exitosamente",
      data: {
        abogado: resultado.abogado,
        accessToken: resultado.accessToken,
        refreshToken: resultado.refreshToken,
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
 * LOGIN
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const resultado = await authService.login(
      req.body.email,
      req.body.password
    );

    // AUDITORÍA: Registrar login exitoso
    await registrarAuditoria({
      id_usuario: resultado.abogado.id_abogado,
      accion: "LOGIN",
      entidad: "auth",
      detalle: { email: resultado.abogado.email },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Login exitoso",
      data: {
        abogado: resultado.abogado,
        accessToken: resultado.accessToken,
        refreshToken: resultado.refreshToken,
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
 * OBTENER PERFIL
 * GET /api/auth/perfil
 */
export const obtenerPerfil = async (req, res) => {
  try {
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
 * ACTUALIZAR PERFIL
 * PUT /api/auth/perfil
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
 */
export const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    const resultado = await authService.cambiarPassword(
      req.user.id_abogado,
      passwordActual,
      passwordNuevo
    );

    // AUDITORÍA: Registrar cambio de password
    await registrarAuditoria({
      id_usuario: req.user.id_abogado,
      accion: "CAMBIAR_PASSWORD",
      entidad: "auth",
      req,
    });

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

/**
 * SOLICITAR RECUPERACIÓN DE CONTRASEÑA
 * POST /api/auth/forgot-password
 */
export const solicitarRecuperacionPassword = async (req, res) => {
  try {
    const resultado = await authService.solicitarRecuperacionPassword(
      req.body.email
    );

    return res.status(200).json({
      success: true,
      message: resultado.message,
      ...(process.env.NODE_ENV === "development" &&
        resultado.resetToken && {
          dev: {
            resetToken: resultado.resetToken,
            resetLink: resultado.resetLink,
          },
        }),
    });
  } catch (error) {
    console.error("Error al solicitar recuperación:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * RESETEAR CONTRASEÑA CON TOKEN
 * POST /api/auth/reset-password
 */
export const resetearPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;

    const resultado = await authService.resetearPassword(token, nuevaPassword);

    return res.status(200).json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * RENOVAR ACCESS TOKEN
 * POST /api/auth/refresh
 */
export const renovarToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const resultado = await authService.renovarToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token renovado exitosamente",
      data: {
        accessToken: resultado.accessToken,
        refreshToken: resultado.refreshToken,
      },
    });
  } catch (error) {
    console.error("Error al renovar token:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * LOGOUT
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const resultado = await authService.logout(req.user.id_abogado);

    // AUDITORÍA: Registrar logout
    await registrarAuditoria({
      id_usuario: req.user.id_abogado,
      accion: "LOGOUT",
      entidad: "auth",
      req,
    });

    return res.status(200).json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al hacer logout:", error);

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
  solicitarRecuperacionPassword,
  resetearPassword,
  renovarToken,
  logout, // NUEVO
};
