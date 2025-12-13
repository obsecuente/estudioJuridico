import { Abogado, Caso } from "../models/index.js";
import { Op } from "sequelize";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
export const crear = async (datosAbogado) => {
  /**
   * Crea un nuevo Abogado en la base de datos
   *
   * @param {Object} datosAbogado - Datos del Abogado
   * @param {string} datosAbogado.dni - DNI del abogado (OBLIGATORIO - 7 u 8 dígitos)
   * @param {string} datosAbogado.telefono - Teléfono del abogado (OBLIGATORIO)
   * @param {string} datosAbogado.nombre - Nombre del Abogado (opcional)
   * @param {string} datosAbogado.apellido - Apellido del Abogado (opcional)
   * @param {string} datosAbogado.email - Email del Abogado (opcional pero único)
   * @param {string} datosAbogado.especialidad - Especialidad del abogado (opcional)
   * @param {string} datosAbogado.rol - Rol: admin, abogado, asistente (opcional)
   * @returns {Promise<Object>} Abogado creado
   * @throws {AppError} Si faltan datos obligatorios o hay duplicados
   */

  const { nombre, apellido, email, especialidad, telefono, dni, rol } =
    datosAbogado;

  if (!dni || !telefono) {
    throw new AppError("DNI y teléfono son obligatorios", 400);
  }

  const dniValidation = /^[0-9]{7,8}$/;
  if (!dniValidation.test(dni)) {
    throw new AppError(
      "El DNI debe tener 7 u 8 dígitos sin puntos ni guiones",
      400
    );
  }

  const existeDNI = await Abogado.findOne({ where: { dni: dni.trim() } });
  if (existeDNI) {
    throw new AppError("Ya existe un abogado con este DNI", 409);
  }

  const telefonoValidation = /^\+[1-9]\d{7,14}$/;
  if (!telefonoValidation.test(telefono)) {
    throw new AppError(
      "El formato del número de teléfono no es válido (debe ser formato E.164: +54...)",
      400
    );
  }

  if (email) {
    const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValidation.test(email)) {
      throw new AppError("El formato del email no es válido", 400);
    }

    const existeEmail = await Abogado.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (existeEmail) {
      throw new AppError("Ya existe un abogado con este email", 409);
    }
  }

  if (rol) {
    const rolesValidos = ["admin", "abogado", "asistente"];
    if (!rolesValidos.includes(rol)) {
      throw new AppError(
        `El rol debe ser uno de: ${rolesValidos.join(", ")}`,
        400
      );
    }
  }

  let nuevoAbogado;

  try {
    nuevoAbogado = await Abogado.create({
      dni: dni.trim(),
      telefono,
      nombre: nombre?.trim() || null,
      apellido: apellido?.trim() || null,
      email: email ? email.toLowerCase().trim() : null,
      especialidad: especialidad?.trim() || null,
      rol: rol || "abogado",
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new AppError("El DNI o email ya está registrado", 409);
    }
    throw new AppError(
      "Error al crear abogado en la base de datos [abogados_service.js]",
      500
    );
  }

  return nuevoAbogado;
};
export const obtenerTodos = async (opciones = {}) => {
  /**
   * Obtiene lista de abogados con paginación y búsqueda
   *
   * @param {Object} opciones - Opciones de consulta
   * @param {number} opciones.page - Página actual
   * @param {number} opciones.limit - Abogados por página
   * @param {string} opciones.search - Término de búsqueda
   * @param {string} opciones.especialidad - Filtrar por especialidad
   * @param {string} opciones.rol - Filtrar por rol
   * @returns {Promise<Object>} { abogados, pagination }
   */

  const { page = 1, limit = 20, search, especialidad, rol } = opciones;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${search}%` } },
      { apellido: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { dni: { [Op.like]: `%${search}%` } },
    ];
  }

  if (especialidad) {
    where.especialidad = { [Op.like]: `%${especialidad}%` };
  }

  if (rol) {
    where.rol = rol;
  }

  const { count, rows: abogados } = await Abogado.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [
      ["apellido", "ASC"],
      ["nombre", "ASC"],
    ],
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

  return {
    abogados,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};
export const obtenerPorId = async (id) => {
  /**
   * Obtiene un abogado específico por ID
   *
   * @param {number} id - ID del abogado
   * @returns {Promise<Object>} Abogado encontrado
   * @throws {AppError} Si el abogado no existe
   */

  const abogado = await Abogado.findByPk(id, {
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
export const buscar = async (termino) => {
  /**
   * Busca abogados por nombre, apellido, email o DNI
   *
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Lista de abogados encontrados
   * @throws {AppError} Si el término es muy corto
   */

  if (!termino || termino.length < 2) {
    throw new AppError(
      "Debe proporcionar al menos 2 caracteres para buscar un abogado",
      400
    );
  }
  const abogados = await Abogado.findAll({
    where: {
      [Op.or]: [
        { nombre: { [Op.like]: `%${termino}%` } },
        { apellido: { [Op.like]: `%${termino}%` } },
        { email: { [Op.like]: `%${termino}%` } },
        { dni: { [Op.like]: `%${termino}%` } },
        { especialidad: { [Op.like]: `%${termino}%` } },
      ],
    },
    limit: 10,
    attributes: [
      "id_abogado",
      "dni",
      "nombre",
      "apellido",
      "email",
      "especialidad",
      "rol",
    ],
  });

  return abogados;
};
export const actualizar = async (id, datosActualizacion) => {
  /**
   * Actualiza un abogado existente
   *
   * @param {number} id - ID del abogado
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<Object>} Abogado actualizado
   * @throws {AppError} Si el abogado no existe o hay duplicados
   */

  const { dni, nombre, apellido, telefono, email, especialidad, rol } =
    datosActualizacion;

  // Buscar el abogado
  const abogado = await Abogado.findByPk(id);

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  // Verificar DNI único (si se quiere cambiar)
  if (dni && dni !== abogado.dni) {
    const dniRegex = /^[0-9]{7,8}$/;
    if (!dniRegex.test(dni)) {
      throw new AppError("El DNI debe tener 7 u 8 dígitos sin puntos", 400);
    }

    const existeDNI = await Abogado.findOne({ where: { dni } });
    if (existeDNI) {
      throw new AppError("Ya existe un abogado con ese DNI", 409);
    }
  }

  // Verificar email único (si se quiere cambiar)
  if (email && email !== abogado.email) {
    const existeEmail = await Abogado.findOne({ where: { email } });
    if (existeEmail) {
      throw new AppError("Ya existe un abogado con ese email", 409);
    }
  }

  // Validar teléfono si se proporciona
  if (telefono) {
    const telefonoRegex = /^\+[1-9]\d{7,14}$/;
    if (!telefonoRegex.test(telefono)) {
      throw new AppError("Formato de teléfono inválido", 400);
    }
    const existeTelefono = await Cliente.findOne({ where: { telefono } });
    if (existeTelefono) {
      throw new AppError(
        "Ya existe un abogado con este número de teléfono",
        409
      );
    }
  }

  // Validar rol si se proporciona
  if (rol) {
    const rolesValidos = ["admin", "abogado", "asistente"];
    if (!rolesValidos.includes(rol)) {
      throw new AppError(
        `El rol debe ser uno de: ${rolesValidos.join(", ")}`,
        400
      );
    }
  }

  // Actualizar solo campos proporcionados
  await abogado.update({
    ...(dni && { dni: dni.trim() }),
    ...(nombre && { nombre: nombre.trim() }),
    ...(apellido && { apellido: apellido.trim() }),
    ...(telefono && { telefono }),
    ...(email !== undefined && {
      email: email ? email.toLowerCase().trim() : null,
    }),
    ...(especialidad && { especialidad: especialidad.trim() }),
    ...(rol && { rol }),
  });

  return abogado;
};
export const eliminar = async (id) => {
  /**
   * Elimina un abogado si NO tiene casos asociados
   * Las consultas se desasignan automáticamente
   *
   * @param {number} id - ID del abogado
   * @returns {Promise<Object>} Mensaje de éxito
   * @throws {AppError} Si el abogado no existe o tiene casos activos
   */

  const abogado = await Abogado.findByPk(id);

  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  // Verificar si tiene casos
  const tieneCasos = await Caso.count({ where: { id_abogado: id } });

  if (tieneCasos > 0) {
    // Usar singular o plural según la cantidad
    const textoCasos = tieneCasos === 1 ? "1 caso" : `${tieneCasos} casos`;
    throw new AppError(
      `No se puede eliminar el abogado porque tiene ${textoCasos} asociado${
        tieneCasos === 1 ? "" : "s"
      }. Primero reasigná o cerrá los casos.`,
      409
    );
  }

  // Desasignar consultas automáticamente antes de eliminar
  const { Consulta } = await import("../models/index.js");
  const consultasDesasignadas = await Consulta.update(
    { id_abogado_asignado: null },
    { where: { id_abogado_asignado: id } }
  );

  // Eliminar abogado
  await abogado.destroy();

  // Mensaje personalizado según si había consultas o no
  const mensajeBase = "Abogado eliminado exitosamente";
  const mensajeConsultas =
    consultasDesasignadas[0] > 0
      ? `. ${consultasDesasignadas[0]} consulta${
          consultasDesasignadas[0] === 1 ? "" : "s"
        } desasignada${consultasDesasignadas[0] === 1 ? "" : "s"}`
      : "";

  return {
    message: mensajeBase + mensajeConsultas,
    id: id,
  };
};
export default {
  crear,
  obtenerTodos,
  obtenerPorId,
  buscar,
  actualizar,
  eliminar,
};
