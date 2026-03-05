// src/controllers/calculadora_contextual_controller.js
import calculadoraContextualService from "../services/calculadora_contextual_service.js";

// POST /api/calculadora/contextual/:id_caso
export const calcularContextual = async (req, res) => {
    try {
        const { fecha_notificacion } = req.body;
        if (!fecha_notificacion) {
            return res.status(400).json({
                success: false,
                error: "La fecha de notificacion es obligatoria",
            });
        }
        const data = await calculadoraContextualService.calcularContextual(
            req.params.id_caso,
            fecha_notificacion
        );
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};
