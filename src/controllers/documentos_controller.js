import documentosService from "../services/documentos_service.js";

export const subirDocumento = async (req, res) => {
  try {
    console.log("📦 req.body:", req.body);
    console.log("📁 req.files:", req.files);
    console.log("🔍 id_caso extraído:", req.body.id_caso);
    // req.files viene de Multer cuando usás .array()
    // Puede ser un array vacío, con 1 elemento, o con varios
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionó ningún archivo",
      });
    }

    // Procesar cada archivo
    const documentosCreados = [];

    for (const archivo of req.files) {
      const documento = await documentosService.crear(req.body, archivo);
      documentosCreados.push(documento);
    }

    // Mensaje singular o plural según cantidad
    const cantidad = documentosCreados.length;
    const mensaje =
      cantidad === 1
        ? "1 documento subido exitosamente"
        : `${cantidad} documentos subidos exitosamente`;

    return res.status(201).json({
      success: true,
      message: mensaje,
      total: cantidad,
      data: documentosCreados,
    });
  } catch (error) {
    console.error("Error al subir documento(s):", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerDocumentosPorCaso = async (req, res) => {
  try {
    const documentos = await documentosService.obtenerPorCaso(
      req.params.id_caso
    );

    res.json({
      success: true,
      total: documentos.length,
      data: documentos,
    });
  } catch (error) {
    console.error("Error al obtener documentos:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerDocumentoPorId = async (req, res) => {
  try {
    const documento = await documentosService.obtenerPorId(req.params.id);

    res.json({
      success: true,
      data: documento,
    });
  } catch (error) {
    console.error("Error al obtener documento:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const obtenerDocumentos = async (req, res) => {
  try {
    const resultado = await documentosService.obtenerTodos({
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({
      success: true,
      data: resultado.documentos,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener documentos:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const eliminarDocumento = async (req, res) => {
  try {
    const resultado = await documentosService.eliminar(req.params.id);

    res.json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al eliminar documento:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
export const descargarDocumento = async (req, res) => {
  try {
    const { ruta, nombre_archivo } = await documentosService.descargar(
      req.params.id
    );

    // Descargar archivo
    res.download(ruta, nombre_archivo, (error) => {
      if (error) {
        console.error("Error al descargar archivo:", error);
        res.status(500).json({
          success: false,
          error: "Error al descargar el archivo",
        });
      }
    });
  } catch (error) {
    console.error("Error al descargar documento:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
