import vencimientosService from "../services/vencimientos_service.js";

export const crearVencimiento = async (req, res) => {
  try {
    const vencimiento = await vencimientosService.crear({
      ...req.body,
      id_abogado: req.body.id_abogado || req.user.id_abogado,
    });

    return res.status(201).json({
      success: true,
      message: "Vencimiento creado exitosamente",
      data: vencimiento,
    });
  } catch (error) {
    console.error("Error al crear vencimiento:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerVencimientos = async (req, res) => {
  try {
    const resultado = await vencimientosService.obtenerTodos({
      page: req.query.page,
      limit: req.query.limit,
      estado: req.query.estado,
      prioridad: req.query.prioridad,
      tipo_vencimiento: req.query.tipo_vencimiento,
      id_abogado: req.query.id_abogado,
      id_caso: req.query.id_caso,
      proximos: req.query.proximos,
      vencidos: req.query.vencidos,
    });

    return res.json({
      success: true,
      data: resultado.vencimientos,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener vencimientos:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerVencimientoPorId = async (req, res) => {
  try {
    const vencimiento = await vencimientosService.obtenerPorId(req.params.id);

    return res.json({
      success: true,
      data: vencimiento,
    });
  } catch (error) {
    console.error("Error al obtener vencimiento:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerResumen = async (req, res) => {
  try {
    const id_abogado = req.query.id_abogado || req.user?.id_abogado;
    const resumen = await vencimientosService.obtenerResumen(id_abogado);

    return res.json({
      success: true,
      data: resumen,
    });
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerProximosVencimientos = async (req, res) => {
  try {
    const id_abogado = req.query.id_abogado || req.user.id_abogado;
    const dias = parseInt(req.query.dias) || 7;

    const vencimientos = await vencimientosService.obtenerProximosPorAbogado(
      id_abogado,
      dias,
    );

    return res.json({
      success: true,
      data: vencimientos,
      total: vencimientos.length,
    });
  } catch (error) {
    console.error("Error al obtener próximos vencimientos:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const actualizarVencimiento = async (req, res) => {
  try {
    const vencimiento = await vencimientosService.actualizar(
      req.params.id,
      req.body,
    );

    return res.json({
      success: true,
      message: "Vencimiento actualizado exitosamente",
      data: vencimiento,
    });
  } catch (error) {
    console.error("Error al actualizar vencimiento:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const marcarCumplido = async (req, res) => {
  try {
    const { notas } = req.body;
    const vencimiento = await vencimientosService.marcarCumplido(
      req.params.id,
      notas,
    );

    return res.json({
      success: true,
      message: "Vencimiento marcado como cumplido",
      data: vencimiento,
    });
  } catch (error) {
    console.error("Error al marcar cumplido:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const eliminarVencimiento = async (req, res) => {
  try {
    const resultado = await vencimientosService.eliminar(req.params.id);

    return res.json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al eliminar vencimiento:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export const obtenerTiposVencimiento = async (req, res) => {
  try {
    const tipos = vencimientosService.obtenerTipos();

    return res.json({
      success: true,
      data: tipos,
    });
  } catch (error) {
    console.error("Error al obtener tipos:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  crearVencimiento,
  obtenerVencimientos,
  obtenerVencimientoPorId,
  obtenerResumen,
  obtenerProximosVencimientos,
  actualizarVencimiento,
  marcarCumplido,
  eliminarVencimiento,
  obtenerTiposVencimiento,
};
