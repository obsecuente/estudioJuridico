import { procesarMensaje } from "../services/chat_ia_service.js";
import { registrarAuditoria } from "../services/auditoria_service.js";

/**
 * Endpoint para procesar el Chat Inteligente General (RAG Sensible)
 * POST /api/ia/chat-general
 */
export const chatGeneral = async (req, res) => {
    try {
        const { mensajes } = req.body;
        const id_abogado = req.user.id_abogado;

        if (!mensajes || !Array.isArray(mensajes) || mensajes.length === 0) {
            return res.status(400).json({
                success: false,
                error: "El historial de mensajes es obligatorio y debe ser un array.",
            });
        }

        // El mensaje más reciente es el usuario actual
        const mensajeUsuarioObj = mensajes[mensajes.length - 1];
        if (!mensajeUsuarioObj || !mensajeUsuarioObj.content) {
            return res.status(400).json({
                success: false,
                error: "El mensaje del usuario no puede estar vacío.",
            });
        }

        const mensajeString = mensajeUsuarioObj.content;
        const mensajesAnteriores = mensajes.slice(0, -1);

        // Llamar a nuestro servicio IA Inteligente
        const respuestaIA = await procesarMensaje(mensajesAnteriores, mensajeString, id_abogado);

        // Opcional: registrar en auditoría
        await registrarAuditoria({
            id_usuario: id_abogado,
            accion: "CONSULTA_IA",
            entidad: "chat_ia",
            detalle: { accion: "Chat IA General" },
            req,
        });

        return res.json({
            success: true,
            respuesta: respuestaIA,
        });
    } catch (error) {
        console.error("Error en chat_ia_controller:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Error interno al procesar chat IA",
        });
    }
};

export default { chatGeneral };
