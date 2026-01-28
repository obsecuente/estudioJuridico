import { Vencimiento, Caso, Cliente, Abogado } from "../models/index.js";
import { Op } from "sequelize";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// tipos de vencimiento con días de alerta por defecto
export const TIPOS_VENCIMIENTO = {
  contestacion_demanda: { nombre: "Contestación de Demanda", diasDefecto: 15 },
  apelacion: { nombre: "Apelación", diasDefecto: 5 },
  recurso: { nombre: "Recurso", diasDefecto: 5 },
  traslado: { nombre: "Traslado", diasDefecto: 5 },
  ofrecimiento_prueba: { nombre: "Ofrecimiento de Prueba", diasDefecto: 10 },
  alegato: { nombre: "Alegato", diasDefecto: 6 },
  expresion_agravios: { nombre: "Expresión de Agravios", diasDefecto: 10 },
  prescripcion: { nombre: "Prescripción", diasDefecto: 30 },
  caducidad: { nombre: "Caducidad", diasDefecto: 30 },
  otro: { nombre: "Otro", diasDefecto: 5 },
};

// crear vencimiento
export const crear = async (datosVencimiento) => {
  const {
    titulo,
    descripcion,
    tipo_vencimiento,
    fecha_limite,
    dias_alerta,
    prioridad,
    id_caso,
    id_abogado,
  } = datosVencimiento;

  // validaciones
  if (!titulo || !fecha_limite || !id_caso || !id_abogado) {
    throw new AppError(
      "Título, fecha límite, caso y abogado son obligatorios",
      400,
    );
  }

  // validar que el caso existe
  const caso = await Caso.findByPk(id_caso, {
    include: [{ model: Cliente, as: "cliente" }],
  });
  if (!caso) {
    throw new AppError("El caso especificado no existe", 404);
  }

  // validar que el abogado existe
  const abogadoExiste = await Abogado.findByPk(id_abogado);
  if (!abogadoExiste) {
    throw new AppError("El abogado especificado no existe", 404);
  }

  // validar tipo
  const tiposValidos = Object.keys(TIPOS_VENCIMIENTO);
  if (tipo_vencimiento && !tiposValidos.includes(tipo_vencimiento)) {
    throw new AppError(`El tipo debe ser: ${tiposValidos.join(", ")}`, 400);
  }

  // validar prioridad
  const prioridadesValidas = ["alta", "media", "baja"];
  if (prioridad && !prioridadesValidas.includes(prioridad)) {
    throw new AppError(
      `La prioridad debe ser: ${prioridadesValidas.join(", ")}`,
      400,
    );
  }

  // validar que la fecha límite no sea pasada
  const fechaLimiteDate = new Date(fecha_limite);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaLimiteDate < hoy) {
    throw new AppError("La fecha límite no puede ser anterior a hoy", 400);
  }

  try {
    const nuevoVencimiento = await Vencimiento.create({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      tipo_vencimiento: tipo_vencimiento || "otro",
      fecha_limite,
      dias_alerta:
        dias_alerta ??
        TIPOS_VENCIMIENTO[tipo_vencimiento || "otro"].diasDefecto,
      prioridad: prioridad || "media",
      id_caso,
      id_abogado,
      estado: "pendiente",
      notificado: false,
    });

    return await obtenerPorId(nuevoVencimiento.id_vencimiento);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    throw new AppError("Error al crear vencimiento", 500);
  }
};

// calcular días restantes
const calcularDiasRestantes = (fechaLimite) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite);
  limite.setHours(0, 0, 0, 0);
  const diffTime = limite - hoy;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// obtener vencimiento por id
export const obtenerPorId = async (id) => {
  const vencimiento = await Vencimiento.findByPk(id, {
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
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido", "email"],
      },
    ],
  });

  if (!vencimiento) {
    throw new AppError("Vencimiento no encontrado", 404);
  }

  // agregar info calculada
  const vencimientoJSON = vencimiento.toJSON();
  vencimientoJSON.dias_restantes = calcularDiasRestantes(
    vencimiento.fecha_limite,
  );
  vencimientoJSON.esta_por_vencer =
    vencimientoJSON.dias_restantes <= vencimiento.dias_alerta;
  vencimientoJSON.esta_vencido = vencimientoJSON.dias_restantes < 0;

  return vencimientoJSON;
};

// obtener todos con filtros
export const obtenerTodos = async (opciones = {}) => {
  const {
    page = 1,
    limit = 20,
    estado,
    prioridad,
    tipo_vencimiento,
    id_abogado,
    id_caso,
    proximos,
    vencidos,
  } = opciones;

  const offset = (page - 1) * limit;
  const where = {};

  if (estado) where.estado = estado;
  if (prioridad) where.prioridad = prioridad;
  if (tipo_vencimiento) where.tipo_vencimiento = tipo_vencimiento;
  if (id_abogado) where.id_abogado = id_abogado;
  if (id_caso) where.id_caso = id_caso;

  // filtrar solo próximos a vencer (dentro de los próximos 7 días)
  if (proximos === "true" || proximos === true) {
    const hoy = new Date();
    const en7dias = new Date();
    en7dias.setDate(hoy.getDate() + 7);
    where.fecha_limite = {
      [Op.between]: [
        hoy.toISOString().split("T")[0],
        en7dias.toISOString().split("T")[0],
      ],
    };
    where.estado = "pendiente";
  }

  // filtrar solo vencidos
  if (vencidos === "true" || vencidos === true) {
    const hoy = new Date();
    where.fecha_limite = { [Op.lt]: hoy.toISOString().split("T")[0] };
    where.estado = "pendiente";
  }

  const { count, rows } = await Vencimiento.findAndCountAll({
    where,
    include: [
      {
        model: Caso,
        as: "caso",
        attributes: ["id_caso", "descripcion"],
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: ["id_cliente", "nombre", "apellido"],
          },
        ],
      },
      {
        model: Abogado,
        as: "abogado",
        attributes: ["id_abogado", "nombre", "apellido"],
      },
    ],
    order: [
      ["fecha_limite", "ASC"],
      ["prioridad", "DESC"],
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  // agregar info calculada
  const vencimientosConInfo = rows.map((v) => {
    const vJSON = v.toJSON();
    vJSON.dias_restantes = calcularDiasRestantes(v.fecha_limite);
    vJSON.esta_por_vencer =
      vJSON.dias_restantes <= v.dias_alerta && vJSON.dias_restantes >= 0;
    vJSON.esta_vencido = vJSON.dias_restantes < 0;
    return vJSON;
  });

  return {
    vencimientos: vencimientosConInfo,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

// obtener resumen para dashboard
export const obtenerResumen = async (id_abogado = null) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyStr = hoy.toISOString().split("T")[0];

  const baseWhere = id_abogado ? { id_abogado } : {};

  // vencidos
  const vencidos = await Vencimiento.count({
    where: {
      ...baseWhere,
      fecha_limite: { [Op.lt]: hoyStr },
      estado: "pendiente",
    },
  });

  // vencen hoy
  const vencenHoy = await Vencimiento.count({
    where: {
      ...baseWhere,
      fecha_limite: hoyStr,
      estado: "pendiente",
    },
  });

  // próximos 7 días
  const en7dias = new Date();
  en7dias.setDate(hoy.getDate() + 7);
  const proximos7dias = await Vencimiento.count({
    where: {
      ...baseWhere,
      fecha_limite: {
        [Op.between]: [hoyStr, en7dias.toISOString().split("T")[0]],
      },
      estado: "pendiente",
    },
  });

  // total pendientes
  const totalPendientes = await Vencimiento.count({
    where: {
      ...baseWhere,
      estado: "pendiente",
    },
  });

  // alta prioridad
  const altaPrioridad = await Vencimiento.count({
    where: {
      ...baseWhere,
      estado: "pendiente",
      prioridad: "alta",
    },
  });

  return {
    vencidos,
    vencen_hoy: vencenHoy,
    proximos_7_dias: proximos7dias,
    total_pendientes: totalPendientes,
    alta_prioridad: altaPrioridad,
  };
};

// obtener próximos por abogado
export const obtenerProximosPorAbogado = async (id_abogado, dias = 7) => {
  const hoy = new Date();
  const fechaLimite = new Date();
  fechaLimite.setDate(hoy.getDate() + dias);

  const vencimientos = await Vencimiento.findAll({
    where: {
      id_abogado,
      fecha_limite: {
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
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: ["id_cliente", "nombre", "apellido"],
          },
        ],
      },
    ],
    order: [
      ["fecha_limite", "ASC"],
      ["prioridad", "DESC"],
    ],
  });

  return vencimientos.map((v) => {
    const vJSON = v.toJSON();
    vJSON.dias_restantes = calcularDiasRestantes(v.fecha_limite);
    return vJSON;
  });
};

// actualizar vencimiento
export const actualizar = async (id, datosActualizacion) => {
  const vencimiento = await Vencimiento.findByPk(id);

  if (!vencimiento) {
    throw new AppError("Vencimiento no encontrado", 404);
  }

  const {
    titulo,
    descripcion,
    tipo_vencimiento,
    fecha_limite,
    dias_alerta,
    prioridad,
    id_caso,
    id_abogado,
  } = datosActualizacion;

  // validar caso si se quiere cambiar
  if (id_caso && id_caso !== vencimiento.id_caso) {
    const casoExiste = await Caso.findByPk(id_caso);
    if (!casoExiste) {
      throw new AppError("El caso especificado no existe", 404);
    }
  }

  // validar abogado si se quiere cambiar
  if (id_abogado && id_abogado !== vencimiento.id_abogado) {
    const abogadoExiste = await Abogado.findByPk(id_abogado);
    if (!abogadoExiste) {
      throw new AppError("El abogado especificado no existe", 404);
    }
  }

  await vencimiento.update({
    ...(titulo && { titulo: titulo.trim() }),
    ...(descripcion !== undefined && {
      descripcion: descripcion?.trim() || null,
    }),
    ...(tipo_vencimiento && { tipo_vencimiento }),
    ...(fecha_limite && { fecha_limite }),
    ...(dias_alerta !== undefined && { dias_alerta }),
    ...(prioridad && { prioridad }),
    ...(id_caso && { id_caso }),
    ...(id_abogado && { id_abogado }),
  });

  return await obtenerPorId(id);
};

// marcar como cumplido
export const marcarCumplido = async (id, notas = null) => {
  const vencimiento = await Vencimiento.findByPk(id);

  if (!vencimiento) {
    throw new AppError("Vencimiento no encontrado", 404);
  }

  if (vencimiento.estado === "cumplido") {
    throw new AppError("El vencimiento ya está marcado como cumplido", 400);
  }

  await vencimiento.update({
    estado: "cumplido",
    fecha_cumplimiento: new Date(),
    notas_cumplimiento: notas?.trim() || null,
  });

  return await obtenerPorId(id);
};

// marcar vencidos automáticamente
export const marcarVencidos = async () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [actualizados] = await Vencimiento.update(
    { estado: "vencido" },
    {
      where: {
        fecha_limite: { [Op.lt]: hoy },
        estado: "pendiente",
      },
    },
  );

  return { actualizados };
};

// eliminar vencimiento
export const eliminar = async (id) => {
  const vencimiento = await Vencimiento.findByPk(id);

  if (!vencimiento) {
    throw new AppError("Vencimiento no encontrado", 404);
  }

  await vencimiento.destroy();

  return { message: "Vencimiento eliminado exitosamente", id };
};

// obtener tipos de vencimiento
export const obtenerTipos = () => {
  return Object.entries(TIPOS_VENCIMIENTO).map(([key, value]) => ({
    valor: key,
    nombre: value.nombre,
    dias_defecto: value.diasDefecto,
  }));
};

export default {
  crear,
  obtenerPorId,
  obtenerTodos,
  obtenerResumen,
  obtenerProximosPorAbogado,
  actualizar,
  marcarCumplido,
  marcarVencidos,
  eliminar,
  obtenerTipos,
  TIPOS_VENCIMIENTO,
};
