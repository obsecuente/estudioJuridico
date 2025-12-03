import { Cliente, Consulta, Caso } from "../models/index.js";
import { Op } from "sequelize";
import { emailRegex, telefonoRegex } from "../utils/regex.js";
class AppError extends Error {
  // creacion de clase, el extends indica que va a heredar toda propiedad y metodo de otra clase existente
  // en este caso heredará la clase nativa de js "Error"
  // que logramos con esto? crearmos un tipo de error mas especifico, y sigue siendo reconocido como un error legitimo por el entorno node.js
  constructor(message, statusCode = 500) {
    // inicializa el objeto, estableciedno sus propiedades y comportamientos iniciales

    // se utiliza para asignar valores a la propiedad del objeto //** this.statusCode  this.name */

    super(message); // esto llama al constructor de la clase padre (Error)
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
//* ============================================
//* MÉTODO: CREAR CLIENTES
//* ============================================

export const crear = async (datosCliente) => {
  /**
   * Crea un nuevo cliente en la base de datos
   *
   * @param {Object} datosCliente - Datos del cliente
   * @param {string} datosCliente.nombre - Nombre del cliente
   * @param {string} datosCliente.apellido - Apellido del cliente
   * @param {string} datosCliente.email - Email del cliente
   * @param {string} datosCliente.telefono - Teléfono del cliente
   * @param {boolean} datosCliente.consentimiento_datos - Consentimiento
   * @returns {Promise<Object>} Cliente creado
   * @throws {AppError} Si faltan datos o el email/teléfono ya existe
   */

  const { nombre, apellido, telefono, email, consentimiento_datos } =
    datosCliente;

  if (!nombre || !apellido || !email) {
    throw new AppError("Nombre, Apellido y Email son obligatorios", 400);
  }

  const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailValidation.test(email)) {
    throw new AppError("El formato del mail no es válido", 400);
  }

  const telefonoValidation = /^\+[1-9]\d{1,14}$/;
  if (!telefonoValidation.test(telefono)) {
    throw new AppError("El formato del numero de telefono no es válido", 400);
  }

  const existeEmail = await Cliente.findOne({ where: { email } });
  if (existeEmail) {
    throw new AppError("Ya existe un cliente con este email", 409);
  }

  if (telefono) {
    const existeTelefono = await Cliente.findOne({ where: { telefono } });
    if (existeTelefono) {
      throw new AppError(
        "Ya existe un cliente con este número de teléfono",
        409
      );
    }
  }

  //** Creacion de cliente */

  try {
    const nuevoCliente = await Cliente.create({
      nombre: nombre.trim(), //elimina espacios
      apellido: apellido.trim(),
      telefono,
      email: email.toLowerCase().trim(), // convierte el email en minusculas, y le quita espacios
      fecha_registro: new Date(),
      consentimiento_datos: consentimiento_datos || false,
    });

    return nuevoCliente;
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    throw new AppError(
      "Error al crear el cliente en la base de datos [clientes_service.js]",
      500
    );
    //* SequelizeValidationError es el nombre que Sequelize asigna a los errores que ocurren con los datos que violan las reglas definidas en el modelo
    // error.errors contiene los errores que almacenó sequelize, este objeto datalla el error
    //* .map(e => e.message) este metodo recorre los errores, y extrae solo lo legible
    //* .join(', ') une todos los mensajes de errores en una sola cadena de texto, separadas por una coma y espacio

    //* throw new  AppError(...), en lugar de lanzar el error, y estar adivinando cual es el error, toda esta traduccion que hicimos facilitará el arreglo de la misma
  }
};

//* ============================================
//* MÉTODO: OBTENER TODOS LOS CLIENTES
//* ============================================

export const obtenerTodos = async (opciones = {}) => {
  /**
   * Obtiene lista de clientes con paginación y búsqueda
   *
   * @param {Object} opciones - Opciones de consulta
   * @param {number} opciones.page - Página actual
   * @param {number} opciones.limit - Clientes por página
   * @param {string} opciones.search - Término de búsqueda
   * @returns {Promise<Object>} { clientes, pagination }
   */

  const { page = 1, limit = 20, search } = opciones;

  // Calcular offset
  const offset = (page - 1) * limit;

  // Construir filtro de búsqueda
  const where = {};

  if (search) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${search}%` } },
      { apellido: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  // Consultar base de datos
  const { count, rows: clientes } = await Cliente.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["fecha_registro", "DESC"]],
    attributes: [
      "id_cliente",
      "nombre",
      "apellido",
      "email",
      "telefono",
      "fecha_registro",
      "consentimiento_datos",
    ],
  });

  // Retornar datos con paginación
  return {
    clientes,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

//* ============================================
//* MÉTODO: OBTENER CLIENTE POR ID
//* ============================================

export const obtenerPorId = async (id) => {
  /**
   * Obtiene un cliente específico con sus relaciones
   *
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Cliente con consultas y casos
   * @throws {AppError} Si el cliente no existe
   */

  const cliente = await Cliente.findByPk(id, {
    include: [
      {
        model: Consulta,
        as: "consultas",
        attributes: ["id_consulta", "mensaje", "estado", "fecha_envio"],
        order: [["fecha_envio", "DESC"]],
      },
      {
        model: Caso,
        as: "casos",
        attributes: ["id_caso", "descripcion", "estado", "fecha_inicio"],
        order: [["fecha_inicio", "DESC"]],
      },
    ],
  });

  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }

  return cliente;
};

//* ============================================
//* MÉTODO: BUSCAR CLIENTES
//* ============================================

export const buscar = async (termino) => {
  /**
   * Busca clientes por nombre, apellido, email o teléfono
   *
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Lista de clientes encontrados
   * @throws {AppError} Si el término es muy corto
   */

  if (!termino || termino.length < 2) {
    throw new AppError(
      "Debe proporcionar al menos 2 caracteres para buscar",
      400
    );
  }

  const clientes = await Cliente.findAll({
    where: {
      [Op.or]: [
        { nombre: { [Op.like]: `%${termino}%` } },
        { apellido: { [Op.like]: `%${termino}%` } },
        { email: { [Op.like]: `%${termino}%` } },
        { telefono: { [Op.like]: `%${termino}%` } },
      ],
    },
    limit: 10,
    attributes: ["id_cliente", "nombre", "apellido", "email", "telefono"],
  });

  return clientes;
};

//* ============================================
//* MÉTODO: ACTUALIZAR CLIENTE
//* ============================================

export const actualizar = async (id, datosActualizacion) => {
  /**
   * Actualiza un cliente existente
   *
   * @param {number} id - ID del cliente
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<Object>} Cliente actualizado
   * @throws {AppError} Si el cliente no existe o hay duplicados
   */

  const { nombre, apellido, telefono, email, consentimiento_datos } =
    datosActualizacion;

  // Buscar el cliente
  const cliente = await Cliente.findByPk(id);

  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }

  // Verificar email único (si se quiere cambiar)
  if (email && email !== cliente.email) {
    const existeEmail = await Cliente.findOne({ where: { email } });
    if (existeEmail) {
      throw new AppError("Ya existe un cliente con ese email", 409);
    }
  }

  // Verificar teléfono único (si se quiere cambiar)
  if (telefono && telefono !== cliente.telefono) {
    const existeTelefono = await Cliente.findOne({ where: { telefono } });
    if (existeTelefono) {
      throw new AppError("Ya existe un cliente con ese teléfono", 409);
    }
  }

  // Actualizar solo campos proporcionados
  await cliente.update({
    ...(nombre && { nombre: nombre.trim() }),
    ...(apellido && { apellido: apellido.trim() }),
    ...(telefono !== undefined && { telefono }),
    ...(email && { email: email.toLowerCase().trim() }),
    ...(consentimiento_datos !== undefined && { consentimiento_datos }),
  });

  return cliente;
};

//* ============================================
//* MÉTODO: ELIMINAR CLIENTE
//* ============================================

export const eliminar = async (id) => {
  /**
   * Elimina un cliente si no tiene relaciones
   *
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>} Mensaje de éxito
   * @throws {AppError} Si el cliente no existe o tiene relaciones
   */

  const cliente = await Cliente.findByPk(id);

  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }

  // Verificar relaciones
  const tieneConsultas = await Consulta.count({ where: { id_cliente: id } });
  const tieneCasos = await Caso.count({ where: { id_cliente: id } });

  if (tieneConsultas > 0 || tieneCasos > 0) {
    throw new AppError(
      `No se puede eliminar el cliente porque tiene ${tieneConsultas} consultas y ${tieneCasos} casos asociados`,
      409
    );
  }

  // Eliminar
  await cliente.destroy();

  return {
    message: "Cliente eliminado exitosamente",
    id: id,
  };
};

//* ============================================
//* MÉTODO: VERIFICAR SI EXISTE
//* ============================================

export const existe = async (email) => {
  /**
   * Verifica si existe un cliente con el email dado
   *
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>} true si existe, false si no
   */

  const cliente = await Cliente.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  return cliente !== null;
};

//* ============================================
//* EXPORTAR TODO COMO UN OBJETO
//* ============================================

export default {
  crear,
  obtenerTodos,
  obtenerPorId,
  buscar,
  actualizar,
  eliminar,
  existe,
};
