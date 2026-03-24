import IAService from "../services/ia.service.js";

// Generar o recuperar resumen
export const resumirDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const forzarRegeneracion = req.query.forzar === "true";

    // El middleware usa req.user, NO req.usuario
    const idUsuario = req.user.id_abogado;

    console.log("📋 Usuario ID:", idUsuario);
    console.log("🔄 Forzar:", forzarRegeneracion);

    const resultado = await IAService.resumirDocumento(
      id,
      idUsuario,
      forzarRegeneracion
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al resumir documento:", error);
    res.status(500).json({
      mensaje: "Error al resumir documento",
      error: error.message,
    });
  }
};

// Obtener resumen existente
export const obtenerResumen = async (req, res) => {
  try {
    const { id } = req.params;

    const resumen = await IAService.obtenerResumen(id);

    if (!resumen) {
      return res.status(404).json({
        mensaje: "No existe resumen para este documento",
      });
    }

    res.status(200).json(resumen);
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    res.status(500).json({
      mensaje: "Error al obtener resumen",
      error: error.message,
    });
  }
};

// Eliminar resumen
export const eliminarResumen = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await IAService.eliminarResumen(id);

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al eliminar resumen:", error);
    res.status(500).json({
      mensaje: "Error al eliminar resumen",
      error: error.message,
    });
  }
};

// Nueva: Chatear con documento
export const preguntarDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({ mensaje: "La pregunta es obligatoria" });
    }

    const resultado = await IAService.preguntarDocumento(id, pregunta);

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error en pregunta IA:", error);
    res.status(500).json({
      mensaje: "Error al procesar la pregunta",
      error: error.message,
    });
  }
};

// Chat general con IA
export const chatGeneral = async (req, res) => {
  try {
    const { mensajes } = req.body;

    if (!mensajes || !Array.isArray(mensajes) || mensajes.length === 0) {
      return res.status(400).json({ mensaje: "Se requiere un array de mensajes" });
    }

    const resultado = await IAService.chatGeneral(mensajes);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error en chat general:", error);
    res.status(500).json({
      mensaje: "Error al procesar la conversación",
      error: error.message,
    });
  }
};
