// src/controllers/etiquetas_controller.js
import etiquetasService from "../services/etiquetas_service.js";

// GET /api/etiquetas
export const listarEtiquetas = async (req, res) => {
    try {
        const etiquetas = await etiquetasService.listar(req.user.id_abogado);
        return res.json({ success: true, data: etiquetas });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

// POST /api/etiquetas
export const crearEtiqueta = async (req, res) => {
    try {
        const { nombre, color_hex } = req.body;
        const etiqueta = await etiquetasService.crear(req.user.id_abogado, nombre, color_hex);
        return res.status(201).json({ success: true, data: etiqueta });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

// DELETE /api/etiquetas/:id
export const eliminarEtiqueta = async (req, res) => {
    try {
        const data = await etiquetasService.eliminar(req.params.id, req.user.id_abogado);
        return res.json({ success: true, ...data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};
