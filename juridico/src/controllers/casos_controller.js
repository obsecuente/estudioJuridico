import casosService from "../services/casos_service.js";

export const crearCaso = async (req, res) => {
  try {
    const caso = await casosService.crear(req.body);
    return res.status(201).json({
      success: true,
      message: "Caso creado exitosamente!",
      data: caso,
    });
  } catch (error) {
    console.error("Error al caso", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerCasos = async (req, res) => {
  try {
    const resultado = await casosService.obtenerTodos({
      page: req.query.page,
      limit: req.query.limit,
      estado: req.query.estado,
      id_cliente: req.query.id_cliente,
      id_abogado: req.query.id_abogado,
      search: req.query.search,
    });
    res.json({
      success: true,
      data: resultado.casos,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener casos:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerCasoPorId = async (req, res) => {
  try {
    const caso = await casosService.obtenerPorId(req.params.id);
    res.json({
      success: true,
      data: caso,
    });
  } catch (error) {
    console.error("Error al obtener caso:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerCasosPorCliente = async (req, res) => {
  try {
    const casos = await casosService.obtenerPorCliente(req.params.id_cliente);
    res.json({
      success: true,
      total: casos.length,
      data: casos,
    });
  } catch (error) {
    console.error("Error al obtener casos del cliente:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerCasosPorAbogado = async (req, res) => {
  try {
    const casos = await casosService.obtenerPorAbogado(req.params.id_abogado);
    res.json({
      success: true,
      total: casos.length,
      data: casos,
    });
  } catch (error) {
    console.error("Error al obtener casos del abogado:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const actualizarCaso = async (req, res) => {
  try {
    const caso = await casosService.actualizar(req.params.id, req.body);
    res.json({
      success: true,
      message: "Caso actualizado exitosamente",
      data: caso,
    });
  } catch (error) {
    console.error("Error al actualizar caso:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const cambiarEstadoCaso = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        error: "Debe proporcionar el nuevo estado",
      });
    }

    const caso = await casosService.cambiarEstado(req.params.id, estado);

    res.json({
      success: true,
      message: `Caso ${
        estado === "cerrado" ? "cerrado" : "abierto"
      } exitosamente`,
      data: caso,
    });
  } catch (error) {
    console.error("Error al cambiar estado del caso:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const cerrarCaso = async (req, res) => {
  try {
    const caso = await casosService.cerrarCaso(req.params.id);
    res.json({
      success: true,
      message: "Caso cerrado exitosamente",
      data: caso,
    });
  } catch (error) {
    console.error("Error al cerrar caso:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const eliminarCaso = async (req, res) => {
  try {
    const resultado = await casosService.eliminar(req.params.id);
    res.json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al eliminar caso:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
