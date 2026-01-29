import eventosService from "../services/eventos_service.js";

export const crearEvento = async (req, res) => {
  try {
    const evento = await eventosService.crear({
      ...req.body,
      id_abogado: req.body.id_abogado || req.user.id_abogado,
    });

    return res.status(201).json({
      success: true,
      message: "Evento creado exitosamente",
      data: evento,
    });
  } catch (error) {
    console.error("Error al crear evento:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerEventos = async (req, res) => {
  try {
    const resultado = await eventosService.obtenerTodos({
      page: req.query.page,
      limit: req.query.limit,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      month: req.query.month,
      year: req.query.year,
      tipo: req.query.tipo,
      estado: req.query.estado,
      id_abogado: req.query.id_abogado,
      id_caso: req.query.id_caso,
      id_cliente: req.query.id_cliente,
    });

    return res.json({
      success: true,
      data: resultado.eventos,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerEventoPorId = async (req, res) => {
  try {
    const evento = await eventosService.obtenerPorId(req.params.id);

    return res.json({
      success: true,
      data: evento,
    });
  } catch (error) {
    console.error("Error al obtener evento:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerEventosPorMes = async (req, res) => {
  try {
    const { año, mes } = req.params;
    const id_abogado = req.query.id_abogado || null;

    const eventos = await eventosService.obtenerPorMes(
      parseInt(año),
      parseInt(mes),
      id_abogado,
    );

    return res.json({
      success: true,
      data: eventos,
      total: eventos.length,
    });
  } catch (error) {
    console.error("Error al obtener eventos por mes:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerProximosEventos = async (req, res) => {
  try {
    const id_abogado = req.query.id_abogado || req.user.id_abogado;
    const dias = parseInt(req.query.dias) || 7;

    const eventos = await eventosService.obtenerProximos(id_abogado, dias);

    return res.json({
      success: true,
      data: eventos,
      total: eventos.length,
    });
  } catch (error) {
    console.error("Error al obtener próximos eventos:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const actualizarEvento = async (req, res) => {
  try {
    const evento = await eventosService.actualizar(req.params.id, req.body);

    return res.json({
      success: true,
      message: "Evento actualizado exitosamente",
      data: evento,
    });
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const cambiarEstadoEvento = async (req, res) => {
  try {
    const { estado } = req.body;
    const evento = await eventosService.cambiarEstado(req.params.id, estado);

    return res.json({
      success: true,
      message: `Evento marcado como ${estado}`,
      data: evento,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const eliminarEvento = async (req, res) => {
  try {
    const resultado = await eventosService.eliminar(req.params.id);

    return res.json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  crearEvento,
  obtenerEventos,
  obtenerEventoPorId,
  obtenerEventosPorMes,
  obtenerProximosEventos,
  actualizarEvento,
  cambiarEstadoEvento,
  eliminarEvento,
};
