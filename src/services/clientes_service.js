import { Consulta, Cliente, Abogado } from "../models/index.js";
import { Op } from "sequelize";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// consulta desde el front

export const crearDesdeFormulario = async (datosFormulario) => {
  /**
   * Crea una consulta y el cliente si no existe (flujo típico de formulario web)
   *
   * @param {Object} datosFormulario - Datos del formulario
   * @param {string} datosFormulario.mensaje - Mensaje de la consulta (obligatorio)
   * @param {string} datosFormulario.nombre - Nombre del cliente (obligatorio)
   * @param {string} datosFormulario.apellido - Apellido del cliente (obligatorio)
   * @param {string} datosFormulario.telefono - Teléfono del cliente (obligatorio)
   * @param {string} [datosFormulario.email] - Email del cliente (opcional)
   * @param {boolean} datosFormulario.consentimiento_datos - Consentimiento del cliente
   * @returns {Promise<Object>} Consulta creada con el cliente
   * @throws {AppError} Si faltan datos obligatorios
   */

  const { mensaje, nombre, apellido, email, telefono, consentimiento_datos } =
    datosFormulario;

  // Validaciones básicas - teléfono obligatorio, email opcional
  if (!mensaje || !nombre || !apellido || !telefono) {
    throw new AppError(
      "El mensaje, nombre, apellido y teléfono son obligatorios",
      400
    );
  }

  if (mensaje.trim().length < 10) {
    throw new AppError("El mensaje debe tener al menos 10 caracteres", 400);
  }

  // Validar teléfono (obligatorio)
  const telefonoValidation = /^\+[1-9]\d{1,14}$/;
  if (!telefonoValidation.test(telefono)) {
    throw new AppError(
      "El formato del número de teléfono no es válido (debe ser formato E.164: +54...)",
      400
    );
  }

  // Validar email solo si se proporciona (opcional)
  if (email) {
    const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValidation.test(email)) {
      throw new AppError("El formato del email no es válido", 400);
    }
  }

  try {
    // Buscar si el cliente ya existe por teléfono (ahora es el identificador único)
    let cliente = await Cliente.findOne({
      where: { telefono },
    });

    // Si no existe, crearlo
    if (!cliente) {
      cliente = await Cliente.create({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email ? email.toLowerCase().trim() : null,
        telefono,
        fecha_registro: new Date(),
        consentimiento_datos: consentimiento_datos || false,
      });
    }

    // Crear la consulta con el cliente (existente o recién creado)
    const nuevaConsulta = await Consulta.create({
      mensaje: mensaje.trim(),
      id_cliente: cliente.id_cliente,
      id_abogado_asignado: null, // Sin asignar inicialmente
      estado: "pendiente",
      fecha_envio: new Date(),
    });

    // Traer la consulta completa con relaciones
    const consultaCompleta = await Consulta.findByPk(
      nuevaConsulta.id_consulta,
      {
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: [
              "id_cliente",
              "nombre",
              "apellido",
              "email",
              "telefono",
            ],
          },
        ],
      }
    );

    return {
      consulta: consultaCompleta,
      clienteNuevo: !cliente.id_cliente, // Indica si se creó un cliente nuevo
    };
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    throw new AppError(
      "Error al procesar la consulta [consultas_service.js]",
      500
    );
  }
};

// crear consulta desde el equipo interno

export const crear = async (datosConsulta) => {
  /**
   * Crea una nueva consulta en la base de datos (uso interno/admin)
   * Requiere que el cliente ya exista
   *
   * @param {Object} datosConsulta - Datos de la consulta
   * @param {string} datosConsulta.mensaje - Mensaje de la consulta
   * @param {number} datosConsulta.id_cliente - ID del cliente que hace la consulta
   * @param {number} datosConsulta.id_abogado_asignado - ID del abogado asignado (opcional)
   * @param {string} datosConsulta.estado - Estado de la consulta (pendiente, en_progreso, resuelta)
   * @returns {Promise<Object>} Consulta creada
   * @throws {AppError} Si faltan datos o el cliente no existe
   */

  const { mensaje, id_cliente, id_abogado_asignado, estado } = datosConsulta;

  // Validaciones básicas
  if (!mensaje || !id_cliente) {
    throw new AppError("El mensaje y el ID del cliente son obligatorios", 400);
  }

  if (mensaje.trim().length < 10) {
    throw new AppError("El mensaje debe tener al menos 10 caracteres", 400);
  }

  // Verificar que el cliente existe
  const clienteExiste = await Cliente.findByPk(id_cliente);
  if (!clienteExiste) {
    throw new AppError("El cliente especificado no existe", 404);
  }

  // Si se asignó un abogado, verificar que existe
  if (id_abogado_asignado) {
    const abogadoExiste = await Abogado.findByPk(id_abogado_asignado);
    if (!abogadoExiste) {
      throw new AppError("El abogado especificado no existe", 404);
    }
  }

  // Validar estado si se proporciona
  const estadosValidos = ["pendiente", "en_progreso", "resuelta"];
  if (estado && !estadosValidos.includes(estado)) {
    throw new AppError(
      `El estado debe ser uno de: ${estadosValidos.join(", ")}`,
      400
    );
  }

  try {
    const nuevaConsulta = await Consulta.create({
      mensaje: mensaje.trim(),
      id_cliente,
      id_abogado_asignado: id_abogado_asignado || null,
      estado: estado || "pendiente",
      fecha_envio: new Date(),
    });

    // Traer la consulta con las relaciones incluidas
    const consultaCompleta = await Consulta.findByPk(
      nuevaConsulta.id_consulta,
      {
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: ["id_cliente", "nombre", "apellido", "email"],
          },
          {
            model: Abogado,
            as: "abogado",
            attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
          },
        ],
      }
    );

    return consultaCompleta;
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    throw new AppError(
      "Error al crear la consulta en la base de datos [consultas_service.js]",
      500
    );
  }
};

// obtencion de todas las consultas por paginacion

export const obtenerTodas = async (opciones = {}) => {
  /**
   * Obtiene lista de consultas con paginación y filtros
   *
   * @param {Object} opciones - Opciones de consulta
   * @param {number} opciones.page - Página actual
   * @param {number} opciones.limit - Consultas por página
   * @param {string} opciones.estado - Filtrar por estado
   * @param {number} opciones.id_cliente - Filtrar por cliente
   * @param {number} opciones.id_abogado - Filtrar por abogado
   * @returns {Promise<Object>} { consultas, pagination }
   */

  const { page = 1, limit = 20, estado, id_cliente, id_abogado } = opciones;

  // Calcular offset
  const offset = (page - 1) * limit;

  // Construir filtros
  const where = {};

  if (estado) {
    where.estado = estado;
  }

  if (id_cliente) {
    where.id_cliente = id_cliente;
  }

  if (id_abogado) {
    where.id_abogado_asignado = id_abogado;
  }

  // Consultar base de datos
  const { count, rows: consultas } = await Consulta.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["fecha_envio", "DESC"]],
    include: [
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido", "email"],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
      },
    ],
  });

  // Retornar datos con paginación
  return {
    consultas,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

// obtencion de consulta por id

export const obtenerPorId = async (id) => {
  /**
   * Obtiene una consulta específica con sus relaciones
   *
   * @param {number} id - ID de la consulta
   * @returns {Promise<Object>} Consulta con cliente y abogado
   * @throws {AppError} Si la consulta no existe
   */

  const consulta = await Consulta.findByPk(id, {
    include: [
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido", "email", "telefono"],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: [
          "id_abogado",
          "nombre",
          "apellido",
          "email",
          "especialidad",
          "rol",
        ],
      },
    ],
  });

  if (!consulta) {
    throw new AppError("Consulta no encontrada", 404);
  }

  return consulta;
};

//modificacion de consultas

export const actualizar = async (id, datosActualizacion) => {
  /**
   * Actualiza una consulta existente
   *
   * @param {number} id - ID de la consulta
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<Object>} Consulta actualizada
   * @throws {AppError} Si la consulta no existe
   */

  const { mensaje, estado, id_abogado_asignado } = datosActualizacion;

  // Buscar la consulta
  const consulta = await Consulta.findByPk(id);

  if (!consulta) {
    throw new AppError("Consulta no encontrada", 404);
  }

  // Validar estado si se proporciona
  const estadosValidos = ["pendiente", "en_progreso", "resuelta"];
  if (estado && !estadosValidos.includes(estado)) {
    throw new AppError(
      `El estado debe ser uno de: ${estadosValidos.join(", ")}`,
      400
    );
  }

  // Si se asigna un abogado, verificar que existe
  if (id_abogado_asignado) {
    const abogadoExiste = await Abogado.findByPk(id_abogado_asignado);
    if (!abogadoExiste) {
      throw new AppError("El abogado especificado no existe", 404);
    }
  }

  // Validar mensaje si se proporciona
  if (mensaje && mensaje.trim().length < 10) {
    throw new AppError("El mensaje debe tener al menos 10 caracteres", 400);
  }

  // Actualizar solo campos proporcionados
  await consulta.update({
    ...(mensaje && { mensaje: mensaje.trim() }),
    ...(estado && { estado }),
    ...(id_abogado_asignado !== undefined && { id_abogado_asignado }),
  });

  // Devolver consulta actualizada con relaciones
  const consultaActualizada = await Consulta.findByPk(id, {
    include: [
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido", "email"],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
      },
    ],
  });

  return consultaActualizada;
};

// eliminacion de consulta

export const eliminar = async (id) => {
  /**
   * Elimina una consulta
   *
   * @param {number} id - ID de la consulta
   * @returns {Promise<Object>} Mensaje de éxito
   * @throws {AppError} Si la consulta no existe
   */

  const consulta = await Consulta.findByPk(id);

  if (!consulta) {
    throw new AppError("Consulta no encontrada", 404);
  }

  // Eliminar
  await consulta.destroy();

  return {
    message: "Consulta eliminada exitosamente",
    id: id,
  };
};

// asignacion de abogado a consulta

export const asignarAbogado = async (id_consulta, id_abogado) => {
  /**
   * Asigna un abogado a una consulta
   *
   * @param {number} id_consulta - ID de la consulta
   * @param {number} id_abogado - ID del abogado a asignar
   * @returns {Promise<Object>} Consulta actualizada
   * @throws {AppError} Si la consulta o el abogado no existen
   */

  const consulta = await Consulta.findByPk(id_consulta);
  if (!consulta) {
    throw new AppError("Consulta no encontrada", 404);
  }

  const abogado = await Abogado.findByPk(id_abogado);
  if (!abogado) {
    throw new AppError("Abogado no encontrado", 404);
  }

  await consulta.update({
    id_abogado_asignado: id_abogado,
    estado: "en_progreso", // Cambiar estado automáticamente
  });

  // Devolver consulta con relaciones
  const consultaActualizada = await Consulta.findByPk(id_consulta, {
    include: [
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido", "email"],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
      },
    ],
  });

  return consultaActualizada;
};

// cambio de estado de la consulta

export const cambiarEstado = async (id_consulta, nuevoEstado) => {
  /**
   * Cambia el estado de una consulta
   *
   * @param {number} id_consulta - ID de la consulta
   * @param {string} nuevoEstado - Nuevo estado (pendiente, en_progreso, resuelta)
   * @returns {Promise<Object>} Consulta actualizada
   * @throws {AppError} Si la consulta no existe o el estado es inválido
   */

  const estadosValidos = ["pendiente", "en_progreso", "resuelta"];
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new AppError(
      `El estado debe ser uno de: ${estadosValidos.join(", ")}`,
      400
    );
  }

  const consulta = await Consulta.findByPk(id_consulta);
  if (!consulta) {
    throw new AppError("Consulta no encontrada", 404);
  }

  await consulta.update({ estado: nuevoEstado });

  // Devolver consulta con relaciones
  const consultaActualizada = await Consulta.findByPk(id_consulta, {
    include: [
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido", "email"],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
      },
    ],
  });

  return consultaActualizada;
};

// obtencion de consultas por cliente

export const obtenerPorCliente = async (id_cliente) => {
  /**
   * Obtiene todas las consultas de un cliente específico
   *
   * @param {number} id_cliente - ID del cliente
   * @returns {Promise<Array>} Lista de consultas del cliente
   */

  const consultas = await Consulta.findAll({
    where: { id_cliente },
    order: [["fecha_envio", "DESC"]],
    include: [
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
      },
    ],
  });

  return consultas;
};

// obtencion de consultas por abogado

export const obtenerPorAbogado = async (id_abogado) => {
  /**
   * Obtiene todas las consultas asignadas a un abogado
   *
   * @param {number} id_abogado - ID del abogado
   * @returns {Promise<Array>} Lista de consultas del abogado
   */

  const consultas = await Consulta.findAll({
    where: { id_abogado_asignado: id_abogado },
    order: [["fecha_envio", "DESC"]],
    include: [
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido", "email", "telefono"],
      },
    ],
  });

  return consultas;
};

export default {
  crearDesdeFormulario, // ← NUEVO: Para formularios públicos
  crear, // Para uso interno/admin
  obtenerTodas,
  obtenerPorId,
  actualizar,
  eliminar,
  asignarAbogado,
  cambiarEstado,
  obtenerPorCliente,
  obtenerPorAbogado,
};
