import abogadosService from "../services/abogados_service.js";

//* crear,obtenerTodos,obtenerPorId,buscar,actualizar,eliminar

export const crearAbogado = async (req, res) => {
  try {
    const abogado = await abogadosService.crear(req.body);
    return res.status(201).json({
      success: true,
      message: "Abogado creado exitosamente!",
      data: abogado,
    });
  } catch (error) {
    console.error("Error al crear abogado:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerAbogados = async (req, res) => {
  try {
    const resultado = await abogadosService.obtenerTodos({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      especialidad: req.query.especialidad,
      rol: req.query.rol,
    });
    res.json({
      success: true,
      data: resultado.abogados,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener abogado:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerAbogadoPorId = async (req, res) => {
  try {
    const abogado = await abogadosService.obtenerPorId(req.params.id);
    res.json({
      success: true,
      data: abogado,
    });
  } catch (error) {
    console.error("Error al obtener abogado:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const buscarAbogados = async (req, res) => {
  try {
    const abogados = await abogadosService.buscar(req.query.q);
    res.json({
      success: true,
      total: abogados.length,
      data: abogados,
    });
  } catch (error) {
    console.error("Error al buscar abogados:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const actualizarAbogado = async (req, res) => {
  try {
    const abogado = await abogadosService.actualizar(req.params.id, req.body);
    res.json({
      success: true,
      message: "Abogado actualizado exitosamente",
      data: abogado,
    });
  } catch (error) {
    console.error("Error al actualizar abogado:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const eliminarAbogado = async (req, res) => {
  try {
    const resultado = await abogadosService.eliminar(req.params.id);
    res.json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al eliminar abogado:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
