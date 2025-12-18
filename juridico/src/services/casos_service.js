import { Caso, Cliente, Abogado, Documento } from "../models/index.js";
import { Op } from "sequelize";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
export const crear = async (datosCaso) => {
  /**
   * Crea un nuevo caso
   *
   * @param {Object} datosCaso - Datos del caso
   * @param {string} datosCaso.descripcion - Descripción del caso (OBLIGATORIO)
   * @param {number} datosCaso.id_cliente - ID del cliente (OBLIGATORIO)
   * @param {number} datosCaso.id_abogado - ID del abogado (OBLIGATORIO)
   * @param {string} datosCaso.estado - Estado: abierto/cerrado (opcional, default: abierto)
   * @param {string} datosCaso.fecha_inicio - Fecha inicio (opcional, default: hoy)
   * @returns {Promise<Object>} Caso creado con relaciones
   * @throws {AppError} Si faltan datos o el cliente/abogado no existe
   */

  const { descripcion, id_cliente, id_abogado, estado, fecha_inicio } =
    datosCaso;

  // validar CAMPOS OBLIGATORIOS

  if (!descripcion || !id_cliente || !id_abogado) {
    throw new AppError("Descripción, cliente y abogado son obligatorios", 400);
  }

  if (descripcion.trim().length < 10) {
    throw new AppError("La descripción debe tener al menos 10 caracteres", 400);
  }

  // validar QUE EL CLIENTE EXISTE

  const clienteExiste = await Cliente.findByPk(id_cliente);
  if (!clienteExiste) {
    throw new AppError("El cliente especificado no existe", 404);
  }

  // validar QUE EL ABOGADO EXISTE

  const abogadoExiste = await Abogado.findByPk(id_abogado);
  if (!abogadoExiste) {
    throw new AppError("El abogado especificado no existe", 404);
  }

  // validar ESTADO (si se proporciona)

  const estadosValidos = ["abierto", "cerrado"];
  if (estado && !estadosValidos.includes(estado)) {
    throw new AppError(`El estado debe ser: ${estadosValidos.join(", ")}`, 400);
  }

  // CREAR CASO

  let nuevoCaso;

  try {
    nuevoCaso = await Caso.create({
      descripcion: descripcion.trim(),
      id_cliente,
      id_abogado,
      estado: estado || "abierto",
      fecha_inicio: fecha_inicio || new Date(),
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    throw new AppError(
      "Error al crear caso en la base de datos [casos_service.js]",
      500
    );
  }

  // Traer el caso completo con relaciones
  const casoCompleto = await Caso.findByPk(nuevoCaso.id_caso, {
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

  return casoCompleto;
};
export const obtenerTodos = async (opciones = {}) => {
  /**
   * Obtiene lista de casos con paginación y filtros
   *
   * @param {Object} opciones - Opciones de consulta
   * @param {number} opciones.page - Página actual
   * @param {number} opciones.limit - Casos por página
   * @param {string} opciones.estado - Filtrar por estado (abierto/cerrado)
   * @param {number} opciones.id_cliente - Filtrar por cliente
   * @param {number} opciones.id_abogado - Filtrar por abogado
   * @param {string} opciones.search - Búsqueda en descripción
   * @returns {Promise<Object>} { casos, pagination }
   */

  const {
    page = 1,
    limit = 20,
    estado,
    id_cliente,
    id_abogado,
    search,
  } = opciones;

  // Calcular offset
  const offset = (page - 1) * limit;

  // Construir filtros
  const where = {};

  if (estado) {
    const estadosValidos = ["abierto", "cerrado"];
    if (!estadosValidos.includes(estado)) {
      throw new AppError(
        `Estado inválido. Debe ser: ${estadosValidos.join(", ")}`,
        400
      );
    }
    where.estado = estado;
  }

  if (id_cliente) {
    where.id_cliente = id_cliente;
  }

  if (id_abogado) {
    where.id_abogado = id_abogado;
  }

  if (search) {
    where.descripcion = { [Op.like]: `%${search}%` };
  }

  // Consultar base de datos
  const { count, rows: casos } = await Caso.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["fecha_inicio", "DESC"]],
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
    casos,
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
   * Obtiene un caso específico con todas sus relaciones
   *
   * @param {number} id - ID del caso
   * @returns {Promise<Object>} Caso con cliente, abogado y documentos
   * @throws {AppError} Si el caso no existe
   */

  const caso = await Caso.findByPk(id, {
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
        ],
      },
      {
        model: Documento,
        as: "documentos",
        attributes: ["id_documento", "nombre_archivo", "ruta"],
        order: [["id_documento", "DESC"]],
      },
    ],
  });

  if (!caso) {
    throw new AppError("Caso no encontrado", 404);
  }

  return caso;
};
export const obtenerPorCliente = async (id_cliente) => {
  /**
   * Obtiene todos los casos de un cliente específico
   *
   * @param {number} id_cliente - ID del cliente
   * @returns {Promise<Array>} Lista de casos del cliente
   */

  const casos = await Caso.findAll({
    where: { id_cliente },
    order: [["fecha_inicio", "DESC"]],
    include: [
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
      },
    ],
  });

  return casos;
};
export const obtenerPorAbogado = async (id_abogado) => {
  /**
   * Obtiene todos los casos asignados a un abogado
   *
   * @param {number} id_abogado - ID del abogado
   * @returns {Promise<Array>} Lista de casos del abogado
   */

  const casos = await Caso.findAll({
    where: { id_abogado },
    order: [["fecha_inicio", "DESC"]],
    include: [
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido", "email", "telefono"],
      },
    ],
  });

  return casos;
};
export const actualizar = async (id, datosActualizacion) => {
  /**
   * Actualiza un caso existente
   *
   * @param {number} id - ID del caso
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Promise<Object>} Caso actualizado
   * @throws {AppError} Si el caso no existe o hay datos inválidos
   */

  const { descripcion, estado, id_cliente, id_abogado, fecha_inicio } =
    datosActualizacion;

  // Buscar el caso
  const caso = await Caso.findByPk(id);

  if (!caso) {
    throw new AppError("Caso no encontrado", 404);
  }

  // Validar descripción si se proporciona
  if (descripcion && descripcion.trim().length < 10) {
    throw new AppError("La descripción debe tener al menos 10 caracteres", 400);
  }

  // Validar estado si se proporciona
  if (estado) {
    const estadosValidos = ["abierto", "cerrado"];
    if (!estadosValidos.includes(estado)) {
      throw new AppError(
        `El estado debe ser: ${estadosValidos.join(", ")}`,
        400
      );
    }
  }

  // Validar cliente si se quiere cambiar
  if (id_cliente && id_cliente !== caso.id_cliente) {
    const clienteExiste = await Cliente.findByPk(id_cliente);
    if (!clienteExiste) {
      throw new AppError("El cliente especificado no existe", 404);
    }
  }

  // Validar abogado si se quiere cambiar
  if (id_abogado && id_abogado !== caso.id_abogado) {
    const abogadoExiste = await Abogado.findByPk(id_abogado);
    if (!abogadoExiste) {
      throw new AppError("El abogado especificado no existe", 404);
    }
  }

  // Actualizar solo campos proporcionados
  await caso.update({
    ...(descripcion && { descripcion: descripcion.trim() }),
    ...(estado && { estado }),
    ...(id_cliente && { id_cliente }),
    ...(id_abogado && { id_abogado }),
    ...(fecha_inicio && { fecha_inicio }),
  });

  // Devolver caso actualizado con relaciones
  const casoActualizado = await Caso.findByPk(id, {
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

  return casoActualizado;
};
export const cambiarEstado = async (id_caso, nuevoEstado) => {
  /**
   * Cambia el estado de un caso (abierto ↔ cerrado)
   *
   * @param {number} id_caso - ID del caso
   * @param {string} nuevoEstado - Nuevo estado (abierto/cerrado)
   * @returns {Promise<Object>} Caso actualizado
   * @throws {AppError} Si el caso no existe o el estado es inválido
   */

  const estadosValidos = ["abierto", "cerrado"];
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new AppError(`El estado debe ser: ${estadosValidos.join(", ")}`, 400);
  }

  const caso = await Caso.findByPk(id_caso);
  if (!caso) {
    throw new AppError("Caso no encontrado", 404);
  }

  await caso.update({ estado: nuevoEstado });

  // Devolver caso con relaciones
  const casoActualizado = await Caso.findByPk(id_caso, {
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

  return casoActualizado;
};
export const cerrarCaso = async (id_caso) => {
  /**
   * Cierra un caso (helper para cambiarEstado)
   *
   * @param {number} id_caso - ID del caso
   * @returns {Promise<Object>} Caso cerrado
   */

  return await cambiarEstado(id_caso, "cerrado");
};
export const eliminar = async (id) => {
  /**
   * Elimina un caso si no tiene documentos asociados
   *
   * @param {number} id - ID del caso
   * @returns {Promise<Object>} Mensaje de éxito
   * @throws {AppError} Si el caso no existe o tiene documentos
   */

  const caso = await Caso.findByPk(id);

  if (!caso) {
    throw new AppError("Caso no encontrado", 404);
  }

  // Verificar si tiene documentos
  const tieneDocumentos = await Documento.count({ where: { id_caso: id } });

  if (tieneDocumentos > 0) {
    const textoDocumentos =
      tieneDocumentos === 1 ? "1 documento" : `${tieneDocumentos} documentos`;
    throw new AppError(
      `No se puede eliminar el caso porque tiene ${textoDocumentos} asociado${
        tieneDocumentos === 1 ? "" : "s"
      }. Primero eliminá los documentos.`,
      409
    );
  }

  // Eliminar
  await caso.destroy();

  return {
    message: "Caso eliminado exitosamente",
    id: id,
  };
};
export default {
  crear,
  obtenerTodos,
  obtenerPorId,
  obtenerPorCliente,
  obtenerPorAbogado,
  actualizar,
  cambiarEstado,
  cerrarCaso,
  eliminar,
};
