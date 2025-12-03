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
