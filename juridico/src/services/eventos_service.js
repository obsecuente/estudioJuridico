import { Evento, Caso, Cliente, Abogado } from "../models/index.js";
import { Op } from "sequelize";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// crear evento
export const crear = async (datosEvento) => {
  const {
    titulo,
    descripcion,
    tipo,
    fecha_inicio,
    hora_inicio,
    fecha_fin,
    hora_fin,
    todo_el_dia,
    color,
    ubicacion,
    recordatorio,
    id_caso,
    id_cliente,
    id_abogado,
  } = datosEvento;

  // validaciones
  if (!titulo || !fecha_inicio || !id_abogado) {
    throw new AppError(
      "Título, fecha de inicio y abogado son obligatorios",
      400,
    );
  }

  // validar que el abogado existe
  const abogadoExiste = await Abogado.findByPk(id_abogado);
  if (!abogadoExiste) {
    throw new AppError("El abogado especificado no existe", 404);
  }

  // validar caso si se proporciona
  if (id_caso) {
    const casoExiste = await Caso.findByPk(id_caso);
    if (!casoExiste) {
      throw new AppError("El caso especificado no existe", 404);
    }
  }

  // validar cliente si se proporciona
  if (id_cliente) {
    const clienteExiste = await Cliente.findByPk(id_cliente);
    if (!clienteExiste) {
      throw new AppError("El cliente especificado no existe", 404);
    }
  }

  // validar tipo
  const tiposValidos = ["audiencia", "reunion", "tarea", "vencimiento", "otro"];
  if (tipo && !tiposValidos.includes(tipo)) {
    throw new AppError(`El tipo debe ser: ${tiposValidos.join(", ")}`, 400);
  }

  try {
    const nuevoEvento = await Evento.create({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      tipo: tipo || "otro",
      fecha_inicio,
      hora_inicio: todo_el_dia ? null : hora_inicio,
      fecha_fin: fecha_fin || fecha_inicio,
      hora_fin: todo_el_dia ? null : hora_fin,
      todo_el_dia: todo_el_dia || false,
      color: color || "#3b82f6",
      ubicacion: ubicacion?.trim() || null,
      recordatorio: recordatorio ?? 60,
      id_caso: id_caso || null,
      id_cliente: id_cliente || null,
      id_abogado,
    });

    return await obtenerPorId(nuevoEvento.id_evento);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    throw new AppError("Error al crear evento", 500);
  }
};

// obtener evento por id
export const obtenerPorId = async (id) => {
  const evento = await Evento.findByPk(id, {
    include: [
      {
        model: Caso,
        as: "caso",
        attributes: ["id_caso", "descripcion", "estado"],
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: ["id_cliente", "nombre", "apellido"],
          },
        ],
      },
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido", "telefono", "email"],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
      },
    ],
  });

  if (!evento) {
    throw new AppError("Evento no encontrado", 404);
  }

  return evento;
};

// obtener todos los eventos con filtros
export const obtenerTodos = async (opciones = {}) => {
  const {
    page = 1,
    limit = 50,
    fecha_desde,
    fecha_hasta,
    month,
    year,
    tipo,
    estado,
    id_abogado,
    id_caso,
    id_cliente,
  } = opciones;

  const offset = (page - 1) * limit;
  const where = {};

  // filtro por rango de fechas (prioriza month/year o year-only si vienen)
  if (year) {
    if (month) {
      const primerDia = new Date(year, month - 1, 1);
      const ultimoDia = new Date(year, month, 0, 23, 59, 59);
      where.fecha_inicio = {
        [Op.between]: [primerDia, ultimoDia],
      };
    } else {
      // Si solo viene el año (Todos los meses)
      const primerDia = new Date(year, 0, 1);
      const ultimoDia = new Date(year, 11, 31, 23, 59, 59);
      where.fecha_inicio = {
        [Op.between]: [primerDia, ultimoDia],
      };
    }
  } else if (fecha_desde || fecha_hasta) {
    where.fecha_inicio = {};
    if (fecha_desde) where.fecha_inicio[Op.gte] = fecha_desde;
    if (fecha_hasta) where.fecha_inicio[Op.lte] = fecha_hasta;
  }

  if (tipo) where.tipo = tipo;
  if (estado) where.estado = estado;
  if (id_abogado) where.id_abogado = id_abogado;
  if (id_caso) where.id_caso = id_caso;
  if (id_cliente) where.id_cliente = id_cliente;

  const { count, rows } = await Evento.findAndCountAll({
    where,
    include: [
      {
        model: Caso,
        as: "caso",
        attributes: ["id_caso", "descripcion"],
      },
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido"],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido"],
      },
    ],
    order: [
      ["fecha_inicio", "ASC"],
      ["hora_inicio", "ASC"],
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    eventos: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

// obtener eventos por mes (para calendario)
export const obtenerPorMes = async (año, mes, id_abogado = null) => {
  const primerDia = new Date(año, mes - 1, 1);
  const ultimoDia = new Date(año, mes, 0);

  const where = {
    fecha_inicio: {
      [Op.between]: [primerDia, ultimoDia],
    },
  };

  if (id_abogado) {
    where.id_abogado = id_abogado;
  }

  const eventos = await Evento.findAll({
    where,
    include: [
      {
        model: Caso,
        as: "caso",
        attributes: ["id_caso", "descripcion"],
      },
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido"],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido"],
      },
    ],
    order: [
      ["fecha_inicio", "ASC"],
      ["hora_inicio", "ASC"],
    ],
  });

  return eventos;
};

// obtener próximos eventos
export const obtenerProximos = async (id_abogado, dias = 7) => {
  const hoy = new Date();
  const fechaLimite = new Date();
  fechaLimite.setDate(hoy.getDate() + dias);

  const eventos = await Evento.findAll({
    where: {
      id_abogado,
      fecha_inicio: {
        [Op.between]: [
          hoy.toISOString().split("T")[0],
          fechaLimite.toISOString().split("T")[0],
        ],
      },
      estado: "pendiente",
    },
    include: [
      {
        model: Caso,
        as: "caso",
        attributes: ["id_caso", "descripcion"],
      },
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id_cliente", "nombre", "apellido"],
      },
    ],
    order: [
      ["fecha_inicio", "ASC"],
      ["hora_inicio", "ASC"],
    ],
    limit: 10,
  });

  return eventos;
};

// actualizar evento
export const actualizar = async (id, datosActualizacion) => {
  const evento = await Evento.findByPk(id);

  if (!evento) {
    throw new AppError("Evento no encontrado", 404);
  }

  const {
    titulo,
    descripcion,
    tipo,
    fecha_inicio,
    hora_inicio,
    fecha_fin,
    hora_fin,
    todo_el_dia,
    estado,
    color,
    ubicacion,
    recordatorio,
    id_caso,
    id_cliente,
    id_abogado,
  } = datosActualizacion;

  // validar caso si se quiere cambiar
  if (id_caso && id_caso !== evento.id_caso) {
    const casoExiste = await Caso.findByPk(id_caso);
    if (!casoExiste) {
      throw new AppError("El caso especificado no existe", 404);
    }
  }

  // validar cliente si se quiere cambiar
  if (id_cliente && id_cliente !== evento.id_cliente) {
    const clienteExiste = await Cliente.findByPk(id_cliente);
    if (!clienteExiste) {
      throw new AppError("El cliente especificado no existe", 404);
    }
  }

  // validar abogado si se quiere cambiar
  if (id_abogado && id_abogado !== evento.id_abogado) {
    const abogadoExiste = await Abogado.findByPk(id_abogado);
    if (!abogadoExiste) {
      throw new AppError("El abogado especificado no existe", 404);
    }
  }

  await evento.update({
    ...(titulo && { titulo: titulo.trim() }),
    ...(descripcion !== undefined && {
      descripcion: descripcion?.trim() || null,
    }),
    ...(tipo && { tipo }),
    ...(fecha_inicio && { fecha_inicio }),
    ...(hora_inicio !== undefined && { hora_inicio }),
    ...(fecha_fin !== undefined && { fecha_fin }),
    ...(hora_fin !== undefined && { hora_fin }),
    ...(todo_el_dia !== undefined && { todo_el_dia }),
    ...(estado && { estado }),
    ...(color && { color }),
    ...(ubicacion !== undefined && { ubicacion: ubicacion?.trim() || null }),
    ...(recordatorio !== undefined && { recordatorio }),
    ...(id_caso !== undefined && { id_caso }),
    ...(id_cliente !== undefined && { id_cliente }),
    ...(id_abogado && { id_abogado }),
  });

  return await obtenerPorId(id);
};

// cambiar estado
export const cambiarEstado = async (id, nuevoEstado) => {
  const estadosValidos = ["pendiente", "completado", "cancelado"];
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new AppError(`El estado debe ser: ${estadosValidos.join(", ")}`, 400);
  }

  const evento = await Evento.findByPk(id);
  if (!evento) {
    throw new AppError("Evento no encontrado", 404);
  }

  await evento.update({ estado: nuevoEstado });
  return await obtenerPorId(id);
};

// eliminar evento
export const eliminar = async (id) => {
  const evento = await Evento.findByPk(id);

  if (!evento) {
    throw new AppError("Evento no encontrado", 404);
  }

  await evento.destroy();

  return { message: "Evento eliminado exitosamente", id };
};

export default {
  crear,
  obtenerPorId,
  obtenerTodos,
  obtenerPorMes,
  obtenerProximos,
  actualizar,
  cambiarEstado,
  eliminar,
};
