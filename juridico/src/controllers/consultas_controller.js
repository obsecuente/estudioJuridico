import consultaService from "../services/consultas_service.js";

// (Uso interno/admin)
export const crearConsulta = async (req, res) => {
  try {
    const consulta = await consultaService.crear(req.body);
    return res.status(201).json({
      success: true,
      message: "Consulta creada exitosamente",
      data: consulta,
    });
  } catch (error) {
    console.error("Error al crear la consulta:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const crearConsultaPublica = async (req, res) => {
  try {
    const resultado = await consultaService.crearDesdeFormulario(req.body);
    return res.status(201).json({
      success: true,
      message: resultado.clienteNuevo
        ? "Consulta recibida. Te contactaremos pronto!"
        : "Consulta recibida. Ya te conocemos, nos comunicaremos a la brevedad!",
      data: resultado.consulta,
      clienteNuevo: resultado.clienteNuevo,
    });
  } catch (error) {
    console.error("Error al crear consulta pública:", error);
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
      estado: req.query.estado, // Filtro por estado
      id_cliente: req.query.id_cliente,
      id_abogado: req.query.id_abogado,
    });
    res.json({
      success: true,
      data: resultado.consultas,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener consultas:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerConsultaPorId = async (req, res) => {
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
export const actualizarConsulta = async (req, res) => {
  try {
    const consulta = await consultaService.actualizar(req.params.id, req.body);
    res.json({
      success: true,
      message: "Consulta actualizada exitosamente",
      data: consulta,
    });
  } catch (error) {
    console.error("Error al actualizar consulta:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const asignarAbogadoAConsulta = async (req, res) => {
  try {
    const { id_abogado } = req.body;

    if (!id_abogado) {
      return res.status(400).json({
        success: false,
        error: "Debe proporcionar el ID del abogado",
      });
    }

    const consulta = await consultaService.asignarAbogado(
      req.params.id,
      id_abogado
    );

    res.json({
      success: true,
      message: "Abogado asignado exitosamente",
      data: consulta,
    });
  } catch (error) {
    console.error("Error al asignar abogado:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const cambiarEstadoConsulta = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        error: "Debe proporcionar el nuevo estado",
      });
    }

    const consulta = await consultaService.cambiarEstado(req.params.id, estado);

    res.json({
      success: true,
      message: `Estado cambiado a: ${estado}`,
      data: consulta,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const eliminarConsulta = async (req, res) => {
  try {
    const resultado = await consultaService.eliminar(req.params.id);
    res.json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al eliminar consulta:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerConsultasPorCliente = async (req, res) => {
  try {
    const consultas = await consultaService.obtenerPorCliente(
      req.params.id_cliente
    );
    res.json({
      success: true,
      total: consultas.length,
      data: consultas,
    });
  } catch (error) {
    console.error("Error al obtener consultas del cliente:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerConsultasPorAbogado = async (req, res) => {
  try {
    const consultas = await consultaService.obtenerPorAbogado(
      req.params.id_abogado
    );
    res.json({
      success: true,
      total: consultas.length,
      data: consultas,
    });
  } catch (error) {
    console.error("Error al obtener consultas del abogado:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
