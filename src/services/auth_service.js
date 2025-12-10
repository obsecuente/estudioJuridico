import { Abogado } from "../models/index.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import {
  generarToken,
  generarRefreshToken,
  verificarRefreshToken,
} from "../utils/jwt.js";
import {
  generarTokenSeguro,
  generarExpiracion,
} from "../utils/tokenGenerator.js";
import { enviarEmail, plantillas } from "../config/email.js";
import logger from "../config/logger.js";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// REGISTRAR NUEVO ABOGADO
export const registrar = async (datosAbogado) => {
  const {
    dni,
    telefono,
    email,
    password,
    nombre,
    apellido,
    especialidad,
    rol,
  } = datosAbogado;

  if (!dni || !telefono || !email || !password) {
    throw new AppError(
      "DNI, teléfono, email y contraseña son obligatorios",
      400
    );
  }

  if (password.length < 6) {
    throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  const existeDni = await Abogado.findOne({ where: { dni } });
  if (existeDni) {
    throw new AppError("Ya existe un abogado con este DNI", 409);
  }

  const existeEmail = await Abogado.findOne({ where: { email } });
  if (existeEmail) {
    throw new AppError("Ya existe un abogado con este email", 409);
  }

  const passwordHasheado = await hashPassword(password);
  const refreshToken = generarRefreshToken({ email });
  const refreshTokenExpires = generarExpiracion(24 * 7);

  const nuevoAbogado = await Abogado.create({
    dni,
    telefono,
    email: email.toLowerCase().trim(),
    password: passwordHasheado,
    nombre: nombre?.trim(),
    apellido: apellido?.trim(),
    especialidad: especialidad?.trim(),
    rol: rol || "abogado",
    refresh_token: refreshToken,
    refresh_token_expires: refreshTokenExpires,
  });

  const accessToken = generarToken({
    id_abogado: nuevoAbogado.id_abogado,
    email: nuevoAbogado.email,
    rol: nuevoAbogado.rol,
  });

  const abogadoSinPassword = await Abogado.findByPk(nuevoAbogado.id_abogado);

  logger.info("Abogado registrado exitosamente", {
    id_abogado: nuevoAbogado.id_abogado,
    email: nuevoAbogado.email,
  });

  return {
    abogado: abogadoSinPassword,
    accessToken,
    refreshToken,
  };
};

// LOGIN
export const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError("Email y contraseña son obligatorios", 400);
  }

  const abogado = await Abogado.scope("withPassword").findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!abogado) {
    throw new AppError("Credenciales inválidas", 401);
  }

  if (!abogado.password) {
    throw new AppError("Este usuario no tiene contraseña configurada", 401);
  }

  const passwordValido = await comparePassword(password, abogado.password);

  if (!passwordValido) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const refreshToken = generarRefreshToken({
    id_abogado: abogado.id_abogado,
    email: abogado.email,
  });
  const refreshTokenExpires = generarExpiracion(24 * 7);

  await abogado.update({
    refresh_token: refreshToken,
    refresh_token_expires: refreshTokenExpires,
  });

  const accessToken = generarToken({
    id_abogado: abogado.id_abogado,
    email: abogado.email,
    rol: abogado.rol,
  });

  const abogadoSinPassword = await Abogado.findByPk(abogado.id_abogado);

  logger.info("Login exitoso", {
    id_abogado: abogado.id_abogado,
    email: abogado.email,
  });

  return {
    abogado: abogadoSinPassword,
    accessToken,
    refreshToken,
  };
};

// OBTENER PERFIL
export const obtenerPerfil = async (id_abogado) => {
  const abogado = await Abogado.findByPk(id_abogado);

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  return abogado;
};

// ACTUALIZAR PERFIL
export const actualizarPerfil = async (id_abogado, datosActualizacion) => {
  const { nombre, apellido, telefono, email, especialidad } =
    datosActualizacion;

  const abogado = await Abogado.findByPk(id_abogado);

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  if (email && email !== abogado.email) {
    const existeEmail = await Abogado.findOne({ where: { email } });
    if (existeEmail) {
      throw new AppError("Ya existe un abogado con ese email", 409);
    }
  }

  await abogado.update({
    ...(nombre && { nombre: nombre.trim() }),
    ...(apellido && { apellido: apellido.trim() }),
    ...(telefono && { telefono }),
    ...(email && { email: email.toLowerCase().trim() }),
    ...(especialidad && { especialidad: especialidad.trim() }),
  });

  logger.info("Perfil actualizado", {
    id_abogado,
  });

  return abogado;
};

// CAMBIAR CONTRASEÑA
export const cambiarPassword = async (
  id_abogado,
  passwordActual,
  nuevaPassword
) => {
  if (!passwordActual || !nuevaPassword) {
    throw new AppError(
      "Contraseña actual y nueva contraseña son obligatorias",
      400
    );
  }

  if (nuevaPassword.length < 6) {
    throw new AppError(
      "La nueva contraseña debe tener al menos 6 caracteres",
      400
    );
  }

  const abogado = await Abogado.scope("withPassword").findByPk(id_abogado);

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  const passwordValido = await comparePassword(
    passwordActual,
    abogado.password
  );

  if (!passwordValido) {
    throw new AppError("La contraseña actual es incorrecta", 401);
  }

  const esMismaPassword = await comparePassword(
    nuevaPassword,
    abogado.password
  );

  if (esMismaPassword) {
    throw new AppError(
      "La nueva contraseña debe ser diferente a la actual",
      400
    );
  }

  const passwordHasheado = await hashPassword(nuevaPassword);

  await abogado.update({
    password: passwordHasheado,
  });

  logger.info("Contraseña cambiada exitosamente", {
    id_abogado,
  });

  return {
    message: "Contraseña actualizada exitosamente",
  };
};

// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
export const solicitarRecuperacionPassword = async (email) => {
  if (!email) {
    throw new AppError("El email es obligatorio", 400);
  }

  const abogado = await Abogado.scope("withResetToken").findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!abogado) {
    return {
      message: "Si el email existe, recibirás un link de recuperación",
    };
  }

  const resetToken = generarTokenSeguro();
  const resetExpires = generarExpiracion(1);

  await abogado.update({
    reset_password_token: resetToken,
    reset_password_expires: resetExpires,
  });

  const resetLink = `${
    process.env.FRONTEND_URL || "http://localhost:3001"
  }/reset-password/${resetToken}`;

  // ENVÍO DE EMAIL REAL
  try {
    const emailData = plantillas.recuperacionPassword(
      abogado.nombre || abogado.email,
      resetLink
    );

    await enviarEmail({
      to: abogado.email,
      ...emailData,
    });

    logger.info("Email de recuperación enviado", {
      email: abogado.email,
    });
  } catch (error) {
    logger.error("Error al enviar email de recuperación", {
      error: error.message,
      email: abogado.email,
    });
  }

  return {
    message: "Si el email existe, recibirás un link de recuperación",
    ...(process.env.NODE_ENV === "development" && {
      resetToken,
      resetLink,
    }),
  };
};

// RESETEAR CONTRASEÑA
export const resetearPassword = async (token, nuevaPassword) => {
  if (!token || !nuevaPassword) {
    throw new AppError("Token y nueva contraseña son obligatorios", 400);
  }

  if (nuevaPassword.length < 6) {
    throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  const abogado = await Abogado.scope("withPassword", "withResetToken").findOne(
    {
      where: {
        reset_password_token: token,
      },
    }
  );

  if (!abogado) {
    throw new AppError("Token inválido o expirado", 400);
  }

  const ahora = new Date();
  if (ahora > abogado.reset_password_expires) {
    throw new AppError("Token expirado. Solicitá uno nuevo", 400);
  }

  const passwordHasheado = await hashPassword(nuevaPassword);

  await abogado.update({
    password: passwordHasheado,
    reset_password_token: null,
    reset_password_expires: null,
  });

  logger.info("Contraseña reseteada exitosamente", {
    email: abogado.email,
  });

  return {
    message: "Contraseña actualizada exitosamente",
  };
};

// RENOVAR TOKEN
export const renovarToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token es obligatorio", 400);
  }

  let decoded;
  try {
    decoded = verificarRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError("Refresh token inválido o expirado", 401);
  }

  const abogado = await Abogado.scope("withRefreshToken").findOne({
    where: {
      id_abogado: decoded.id_abogado,
      refresh_token: refreshToken,
    },
  });

  if (!abogado) {
    throw new AppError("Refresh token inválido", 401);
  }

  const ahora = new Date();
  if (ahora > abogado.refresh_token_expires) {
    throw new AppError(
      "Refresh token expirado. Por favor, volvé a hacer login",
      401
    );
  }

  const nuevoAccessToken = generarToken({
    id_abogado: abogado.id_abogado,
    email: abogado.email,
    rol: abogado.rol,
  });

  const nuevoRefreshToken = generarRefreshToken({
    id_abogado: abogado.id_abogado,
    email: abogado.email,
  });
  const nuevaExpiracion = generarExpiracion(24 * 7);

  await abogado.update({
    refresh_token: nuevoRefreshToken,
    refresh_token_expires: nuevaExpiracion,
  });

  logger.info("Token renovado exitosamente", {
    id_abogado: abogado.id_abogado,
  });

  return {
    accessToken: nuevoAccessToken,
    refreshToken: nuevoRefreshToken,
  };
};

// LOGOUT
export const logout = async (id_abogado) => {
  const abogado = await Abogado.scope("withRefreshToken").findByPk(id_abogado);

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  await abogado.update({
    refresh_token: null,
    refresh_token_expires: null,
  });

  logger.info("Logout exitoso", {
    id_abogado,
  });

  return {
    message: "Logout exitoso",
  };
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
  logout,
};
