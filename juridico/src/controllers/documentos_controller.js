import documentosService from "../services/documentos_service.js";

export const subirDocumento = async (req, res) => {
  try {
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

    // 1. Detectamos la extensión para saber qué Content-Type poner
    const extension = nombre_archivo.split(".").pop().toLowerCase();

    const mimeTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      txt: "text/plain",
    };

    const contentType = mimeTypes[extension] || "application/octet-stream";

    // 2. Seteamos los headers
    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.FRONTEND_URL || "http://localhost:5173"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // AQUÍ EL CAMBIO: Usamos la variable dinámica
    res.setHeader("Content-Type", contentType);

    // Agregamos el nombre del archivo al disposition para que si se descarga, tenga el nombre real
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${nombre_archivo}"`
    );
    // 3. Enviar archivo
    res.sendFile(ruta, (error) => {
      if (error) {
        console.error("Error al enviar archivo:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: "Error al enviar el archivo",
          });
        }
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
export const actualizarNombreDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_archivo } = req.body;

    const documento = await documentosService.actualizarNombre(
      id,
      nombre_archivo
    );

    res.json({
      success: true,
      message: "Nombre del documento actualizado exitosamente",
      data: documento,
    });
  } catch (error) {
    console.error("Error al actualizar nombre del documento:", error);

    // Aquí usamos el statusCode que definiste en tu AppError
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
