import { Abogado } from "../models/index.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generarToken } from "../utils/jwt.js";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

/**
 * REGISTRO DE NUEVO ABOGADO
 *
 * Flujo:
 * 1. Validar que vengan todos los datos obligatorios
 * 2. Verificar que email y DNI no existan
 * 3. Hashear la contraseña (bcrypt)
 * 4. Crear abogado en BD con password hasheado
 * 5. Generar token JWT
 * 6. Retornar abogado (SIN password) + token
 */
export const registrar = async (datosRegistro) => {
  const {
    dni,
    telefono,
    email,
    password,
    nombre,
    apellido,
    especialidad,
    rol,
  } = datosRegistro;

  // Validar campos obligatorios
  if (!dni || !telefono || !email || !password) {
    throw new AppError(
      "DNI, teléfono, email y contraseña son obligatorios",
      400
    );
  }

  // Validar longitud de contraseña
  if (password.length < 6) {
    throw new AppError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Formato de email inválido", 400);
  }

  // Validar que el email no exista
  const emailExiste = await Abogado.findOne({ where: { email } });
  if (emailExiste) {
    throw new AppError("Ya existe un abogado con este email", 409);
  }

  // Validar que el DNI no exista
  const dniExiste = await Abogado.findOne({ where: { dni } });
  if (dniExiste) {
    throw new AppError("Ya existe un abogado con este DNI", 409);
  }

  // Hashear la contraseña
  // Esto convierte "miPassword123" en algo como:
  // "$2b$10$KIXz3DG8vT0dKJ9mvF3pOeMt8RjqVxT8Q2I8fJ6Y..."
  const passwordHasheado = await hashPassword(password);

  // Crear el abogado
  const nuevoAbogado = await Abogado.create({
    dni: dni.trim(),
    telefono,
    email: email.toLowerCase().trim(),
    password: passwordHasheado, // ← Guardamos el hash, NUNCA la contraseña original
    nombre: nombre?.trim() || null,
    apellido: apellido?.trim() || null,
    especialidad: especialidad?.trim() || null,
    rol: rol || "abogado",
  });

  // Generar token JWT
  // El token contiene: id_abogado, email, rol
  // NO contiene la contraseña (nunca mandamos eso en el token)
  const token = generarToken({
    id_abogado: nuevoAbogado.id_abogado,
    email: nuevoAbogado.email,
    rol: nuevoAbogado.rol,
  });

  // Retornar abogado sin el password
  const abogadoSinPassword = nuevoAbogado.toJSON();
  delete abogadoSinPassword.password;

  return {
    abogado: abogadoSinPassword,
    token,
  };
};

/**
 * LOGIN (INICIAR SESIÓN)
 *
 * Flujo:
 * 1. Buscar abogado por email (con scope para incluir password)
 * 2. Verificar que exista
 * 3. Comparar contraseña ingresada con hash guardado
 * 4. Si coincide, generar token JWT
 * 5. Retornar abogado (SIN password) + token
 */
export const login = async (credenciales) => {
  const { email, password } = credenciales;

  // Validar que vengan ambos datos
  if (!email || !password) {
    throw new AppError("Email y contraseña son obligatorios", 400);
  }

  // Buscar abogado por email
  // IMPORTANTE: Usamos scope('withPassword') para incluir el campo password
  // Normalmente está excluido por seguridad
  const abogado = await Abogado.scope("withPassword").findOne({
    where: { email: email.toLowerCase().trim() },
  });

  // Si no existe el abogado
  if (!abogado) {
    throw new AppError("Credenciales inválidas", 401);
  }

  // Si el abogado no tiene password configurado
  if (!abogado.password) {
    throw new AppError(
      "Este usuario no tiene contraseña configurada. Contactá al administrador.",
      401
    );
  }

  // Comparar contraseña ingresada con el hash
  // comparePassword("miPassword123", "$2b$10$KIX...") → true/false
  const passwordValido = await comparePassword(password, abogado.password);

  if (!passwordValido) {
    throw new AppError("Credenciales inválidas", 401);
  }

  // Generar token JWT
  const token = generarToken({
    id_abogado: abogado.id_abogado,
    email: abogado.email,
    rol: abogado.rol,
  });

  // Retornar abogado sin password
  const abogadoSinPassword = abogado.toJSON();
  delete abogadoSinPassword.password;

  return {
    abogado: abogadoSinPassword,
    token,
  };
};

/**
 * OBTENER PERFIL DEL USUARIO AUTENTICADO
 *
 * Este método se usa cuando el usuario ya está logueado
 * y quiere ver su información completa.
 */
export const obtenerPerfil = async (id_abogado) => {
  const abogado = await Abogado.findByPk(id_abogado, {
    attributes: [
      "id_abogado",
      "dni",
      "nombre",
      "apellido",
      "email",
      "telefono",
      "especialidad",
      "rol",
    ],
  });

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  return abogado;
};

/**
 * ACTUALIZAR PERFIL DEL USUARIO AUTENTICADO
 *
 * Permite actualizar datos personales (no el password, eso es aparte)
 */
export const actualizarPerfil = async (id_abogado, datosActualizacion) => {
  const { nombre, apellido, telefono, email, especialidad } =
    datosActualizacion;

  const abogado = await Abogado.findByPk(id_abogado);

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  // Verificar email único si se quiere cambiar
  if (email && email !== abogado.email) {
    const existeEmail = await Abogado.findOne({ where: { email } });
    if (existeEmail) {
      throw new AppError("Ya existe un abogado con ese email", 409);
    }
  }

  // Actualizar
  await abogado.update({
    ...(nombre && { nombre: nombre.trim() }),
    ...(apellido && { apellido: apellido.trim() }),
    ...(telefono && { telefono }),
    ...(email && { email: email.toLowerCase().trim() }),
    ...(especialidad && { especialidad: especialidad.trim() }),
  });

  return abogado;
};

/**
 * CAMBIAR CONTRASEÑA
 *
 * Flujo:
 * 1. Verificar que la contraseña actual sea correcta
 * 2. Validar que la nueva contraseña sea diferente a la actual
 * 3. Validar nueva contraseña
 * 4. Hashear nueva contraseña
 * 5. Actualizar en BD
 */
export const cambiarPassword = async (
  id_abogado,
  passwordActual,
  passwordNuevo
) => {
  // Validaciones
  if (!passwordActual || !passwordNuevo) {
    throw new AppError(
      "Contraseña actual y nueva contraseña son obligatorias",
      400
    );
  }

  if (passwordNuevo.length < 6) {
    throw new AppError(
      "La nueva contraseña debe tener al menos 6 caracteres",
      400
    );
  }

  // Buscar abogado con password
  const abogado = await Abogado.scope("withPassword").findByPk(id_abogado);

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  // Verificar contraseña actual
  const passwordValido = await comparePassword(
    passwordActual,
    abogado.password
  );

  if (!passwordValido) {
    throw new AppError("La contraseña actual es incorrecta", 401);
  }

  // ← NUEVO: Verificar que la nueva contraseña sea diferente
  const esLaMisma = await comparePassword(passwordNuevo, abogado.password);

  if (esLaMisma) {
    throw new AppError(
      "La nueva contraseña no puede ser igual a la actual",
      400
    );
  }

  // Hashear nueva contraseña
  const nuevoPasswordHasheado = await hashPassword(passwordNuevo);

  // Actualizar
  await abogado.update({ password: nuevoPasswordHasheado });

  return { message: "Contraseña actualizada exitosamente" };
};

export default {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
};
