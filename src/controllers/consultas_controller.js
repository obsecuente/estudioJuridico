import consultaService from "../services/consultas_service.js";

export const crearConsulta = async (req, res) => {
  try {
    const consulta = await consultaService.crear(req.body);
    return res.status(201).json({
      success: true,
      message: "Consulta creada exitosamente",
      data: consulta,
    });
  } catch (error) {
    console.error("Error al crear la consulta", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerConsultas = async (req, res) => {
  try {
    const resultado = await consultaService.obtenerTodas({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.estado, //filtro por estado (pendiente,en_progreso,resuelta)
      id_cliente: req.query.id_cliente,
      id_abogado: req.query.id_abogado,
    });
    res.json({
      success: true,
      data: resultado.consultas,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener consultas.", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerConsultasporId = async (req, res) => {
  try {
    const consulta = await consultaService.obtenerPorId(req.params.id);

    res.json({
      success: true,
      data: consulta,
    });
  } catch (error) {
    console.error("Error al obtener la consulta:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

export default { crearConsulta, obtenerConsultas, obtenerConsultasporId };
