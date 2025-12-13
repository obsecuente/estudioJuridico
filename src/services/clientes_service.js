import { Cliente, Consulta, Caso, Abogado } from "../models/index.js";
import { Op } from "sequelize";
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export const crear = async (datosCliente) => {
  const { nombre, apellido, telefono, email, consentimiento_datos } =
    datosCliente;

  // 1. Normalización y limpieza de datos clave al inicio
  const nombreLimpio = nombre ? nombre.trim() : nombre;
  const apellidoLimpio = apellido ? apellido.trim() : apellido;
  // Limpiamos email de espacios y lo pasamos a minúsculas para todas las validaciones
  const emailNormalizado = email ? email.trim().toLowerCase() : email;

  // 2. Validaciones de campos obligatorios (nombre, apellido, email y teléfono)
  if (!nombreLimpio || !apellidoLimpio || !telefono || !emailNormalizado) {
    throw new AppError(
      "Nombre, Apellido, Email y Teléfono son obligatorios",
      400
    ); // <--- CORRECCIÓN DE MENSAJE
  }

  // 3. Validación de formato de Email
  // Nota: Usamos la validación regex del modelo Cliente si está definida,
  // si no está en el modelo, descomentar la siguiente sección y usar emailRegex:
  // if (!emailRegex.test(emailNormalizado)) {
  //  throw new AppError("El formato del mail no es válido", 400);
  // }

  // 4. Verificación de duplicidad de Email
  const existeEmail = await Cliente.findOne({
    where: { email: emailNormalizado },
  });
  if (existeEmail) {
    throw new AppError("Ya existe un cliente con este email", 409);
  }

  // 5. Validación de formato de Teléfono (asumiendo que viene sin espacios)
  const telefonoValidation = /^\+[1-9]\d{7,14}$/;
  if (!telefonoValidation.test(telefono)) {
    throw new AppError("El formato del numero de telefono no es válido", 400);
  }

  // 6. Verificación de duplicidad de Teléfono
  const existeTelefono = await Cliente.findOne({ where: { telefono } });
  if (existeTelefono) {
    throw new AppError("Ya existe un cliente con este número de teléfono", 409);
  }

  // Creacion de cliente
  try {
    const nuevoCliente = await Cliente.create({
      nombre: nombreLimpio, // Se usa la versión limpia
      apellido: apellidoLimpio, // Se usa la versión limpia
      telefono,
      email: emailNormalizado, // <--- SE USA LA VERSIÓN LIMPIA Y EN MINÚSCULAS
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
  }
};
export const obtenerTodos = async (opciones = {}) => {
  /* ... código de obtenerTodos sin cambios ... */

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
export const obtenerPorId = async (id) => {
  /* ... código de obtenerPorId sin cambios ... */

  const cliente = await Cliente.findByPk(id, {
    include: [
      {
        model: Consulta,
        as: "consultas",
        attributes: ["id_consulta", "mensaje", "estado", "fecha_envio"],
        include: [
          {
            model: Abogado,
            as: "abogado",
            attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
          },
        ],
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
export const buscar = async (termino) => {
  /* ... código de buscar sin cambios ... */

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
export const actualizar = async (id, datosActualizacion) => {
  /* ... código de actualizar sin cambios ... */

  const { nombre, apellido, telefono, email, consentimiento_datos } =
    datosActualizacion;

  // Buscar el cliente
  const cliente = await Cliente.findByPk(id);

  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }

  // Verificar email único (si se quiere cambiar)
  if (email && email.trim().toLowerCase() !== cliente.email) {
    // <--- LIMPIAR Y COMPARAR
    const emailNormalizado = email.trim().toLowerCase(); // <--- LIMPIAR
    const existeEmail = await Cliente.findOne({
      where: { email: emailNormalizado },
    });
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
    // Aseguramos que el email se guarda limpio y en minúsculas
    ...(email && { email: email.toLowerCase().trim() }),
    ...(consentimiento_datos !== undefined && { consentimiento_datos }),
  });

  return cliente;
};
export const eliminar = async (id) => {
  /* ... código de eliminar sin cambios ... */

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

// 3. Implementación de la función existe
export const existe = async (email) => {
  // <--- NUEVA FUNCIÓN
  /**
   * Verifica si existe un cliente con el email proporcionado (case-insensitive y tolerante a espacios).
   * @param {string} email - Email a verificar.
   * @returns {Promise<boolean>}
   */

  if (!email) return false;

  // Normalizar el email para la búsqueda
  const emailLimpio = email.trim().toLowerCase();

  const cliente = await Cliente.findOne({
    // La búsqueda se hace directamente con el email limpio
    where: { email: emailLimpio },
    attributes: ["id_cliente"], // Optimización: solo necesitamos el ID
  });

  return !!cliente; // Retorna true si encuentra algo, false si es null
};

export default {
  // <--- EXPORTACIÓN CORREGIDA
  crear,
  obtenerTodos,
  obtenerPorId,
  buscar,
  actualizar,
  eliminar,
  existe, // <--- AÑADIR LA EXPORTACIÓN DE LA NUEVA FUNCIÓN
};
