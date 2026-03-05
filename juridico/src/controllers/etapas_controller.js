// src/controllers/etapas_controller.js
import etapasService from "../services/etapas_service.js";

// GET /api/etapas-legales
export const listarEtapas = async (req, res) => {
    try {
        const { tipo_proceso } = req.query;
        const etapas = await etapasService.listar(tipo_proceso || null);
        return res.json({ success: true, data: etapas });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};
