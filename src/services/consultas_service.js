import { Cliente, Consulta, Caso, Abogado } from "../models/index.js";
import { Op } from "sequelize";
//* Service de consultas - panel ADMIN
//* Maneja la creacion y gestion de consultas desde el panel administrativo
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
export const crearDesdeFormulario = async (datosFormulario) => {
  /**
   * Crea una consulta y el cliente si no existe en la base de datos del estudio
   *
   * @param {Object} datosFormulario - Datos del formulario
   * @param {string} datosFormulario.mensaje - Mensaje de la consulta
   * @param {string} datosFormulario.nombre - Nombre del cliente
   * @param {string} datosFormulario.apellido - Apellido del cliente
   * @param {string} datosFormulario.email - Email del cliente
   * @param {string} datosFormulario.telefono - Teléfono del cliente
   * @param {boolean} datosFormulario.consentimiento_datos - Consentimiento del cliente
   * @returns {Promise<Object>} Consulta creada con el cliente
   * @throws {AppError} Si faltan datos obligatorios
   */

  const { mensaje, nombre, apellido, email, telefono, consentimiento_datos } =
    datosFormulario;

  // Validaciones básicas
  if (!mensaje || !nombre || !apellido || !telefono) {
    throw new AppError(
      "El mensaje, nombre, apellido y teléfono son obligatorios",
      400
    );
  }

  if (mensaje.trim().length < 10) {
    throw new AppError("El mensaje debe tener al menos 10 caracteres", 400);
  }

  // Validar formato de email
  const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailValidation.test(email)) {
    throw new AppError("El formato del email no es válido", 400);
  }

  // Validar teléfono si se proporciona
  if (telefono) {
    const telefonoValidation = /^\+[1-9]\d{1,14}$/;
    if (!telefonoValidation.test(telefono)) {
      throw new AppError("El formato del número de teléfono no es válido", 400);
    }
  }

  try {
    // Buscar si el cliente ya existe por email
    let cliente = await Cliente.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    // Si no existe, crearlo
    if (!cliente) {
      cliente = await Cliente.create({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.toLowerCase().trim(),
        telefono: telefono || null,
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
export const crear = async (datosConsulta) => {
  /**
   * Crea una nueva consulta en la base de datos
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

  if (!mensaje || !id_cliente) {
    throw new AppError("El mensaje y el ID del cliente son obligatorios.", 400);
  }

  if (mensaje.trim().length < 10) {
    throw new AppError("El mensaje debe contener al menos 10 carácteres.", 400);
  }

  const clienteExiste = await Cliente.findByPk(id_cliente);
  if (!clienteExiste) {
    throw new AppError("El cliente especificado no existe", 404);
  }

  if (id_abogado_asignado) {
    const abogadoExiste = await Abogado.findByPk(id_abogado_asignado);
    if (!abogadoExiste) {
      throw new AppError("El abogado especificado no existe.", 404);
    }
  }

  const estadosValidos = ["pendiente", "en_progreso", "resuelta"];
  if (estado && !estadosValidos.includes(estado)) {
    //* si no coincide el estado con pendiente,progreso,resulto ingresa al if lanzando el error
    throw new AppError(
      `El estado debe ser alguno de estos procesos: ${estadosValidos.join(
        ", "
      )}`,
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
            model: Cliente, // indica que debe buscar y adjuntar la informacion del modelo
            as: "cliente",
            attributes: ["id_cliente", "nombre", "apellido", "email"], //solamente traerá las columnas especificas de la tabla cliente
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
  //* validaciones para los filtrados
  if (id_cliente) {
    const clienteExiste = await Cliente.findByPk(id_cliente);

    if (!clienteExiste) {
      throw new AppError(`El cliente con el ID ${id_cliente} no existe`, 404);
    }
  }

  if (id_abogado) {
    const abogadoExiste = await Abogado.findByPk(id_abogado);
    if (!abogadoExiste) {
      throw new AppError(`El abogado con el ID ${id_abogado} no existe`, 404);
    }
  }
  const estadosValidos = ["pendiente", "en_progreso", "resuelta"];
  if (estado && !estadosValidos.includes(estado)) {
    throw new AppError(
      `Estado inválido. Debe ser: ${estadosValidos.join(", ")}`,
      400
    );
  }

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
        attributes: ["id_cliente", "nombre", "apellido", "email", "telefono"],
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
export default { crear, obtenerTodas, obtenerPorId };
