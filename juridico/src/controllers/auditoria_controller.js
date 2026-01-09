import {
  obtenerAuditoria,
  obtenerActividadReciente,
} from "../services/auditoria_service.js";

/**
 * Obtener historial de auditoría con filtros
 */
export const obtenerHistorial = async (req, res) => {
  try {
    const {
      page,
      limit,
      id_usuario,
      accion,
      entidad,
      id_entidad,
      desde,
      hasta,
    } = req.query;

    const resultado = await obtenerAuditoria({
      page,
      limit,
      id_usuario,
      accion,
      entidad,
      id_entidad,
      desde,
      hasta,
    });

    res.json({
      success: true,
      data: resultado.registros,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener auditoría:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener el historial de auditoría",
    });
  }
};

/**
 * Obtener actividad reciente del usuario logueado
 */
export const obtenerActividadRecienteUsuario = async (req, res) => {
  try {
    const id_usuario = req.user.id_abogado;
    const limit = req.query.limit || 10;

    const actividad = await obtenerActividadReciente(id_usuario, limit);

    res.json({
      success: true,
      data: actividad,
    });
  } catch (error) {
    console.error("Error al obtener actividad reciente:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener la actividad reciente",
    });
  }
};
