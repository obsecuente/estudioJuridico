import { Auditoria, Abogado } from "../models/index.js";
import logger from "../config/logger.js";

/**
 * Registrar una acción en auditoría
 */
export const registrarAuditoria = async ({
  id_usuario,
  accion,
  entidad,
  id_entidad = null,
  detalle = null,
  req = null,
}) => {
  try {
    const datos = {
      id_usuario,
      accion,
      entidad,
      id_entidad,
      detalle: detalle ? JSON.stringify(detalle) : null,
    };

    // Si hay request, extraer IP y user agent
    if (req) {
      datos.ip = req.ip || req.connection.remoteAddress;
      datos.user_agent = req.headers["user-agent"];
    }

    await Auditoria.create(datos);

    logger.info("Auditoría registrada", {
      accion,
      entidad,
      id_entidad,
      id_usuario,
    });
  } catch (error) {
    logger.error("Error al registrar auditoría", {
      error: error.message,
      stack: error.stack,
    });
  }
};

/**
 * Obtener historial de auditoría con filtros
 */
export const obtenerAuditoria = async (opciones = {}) => {
  const {
    page = 1,
    limit = 50,
    id_usuario,
    accion,
    entidad,
    id_entidad,
    desde,
    hasta,
  } = opciones;

  const offset = (page - 1) * limit;
  const where = {};

  if (id_usuario) where.id_usuario = id_usuario;
  if (accion) where.accion = accion;
  if (entidad) where.entidad = entidad;
  if (id_entidad) where.id_entidad = id_entidad;

  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha[Op.gte] = desde;
    if (hasta) where.fecha[Op.lte] = hasta;
  }

  const { count, rows: registros } = await Auditoria.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["fecha", "DESC"]],
    include: [
      {
        model: Abogado,
        as: "usuario",
        attributes: ["id_abogado", "nombre", "apellido", "email"],
      },
    ],
  });

  return {
    registros,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};

export default {
  registrarAuditoria,
  obtenerAuditoria,
};
