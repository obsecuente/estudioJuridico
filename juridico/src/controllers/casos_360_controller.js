// src/controllers/casos_360_controller.js
import casos360Service from "../services/casos_360_service.js";
import historialService from "../services/historial_service.js";
import etiquetasService from "../services/etiquetas_service.js";
import etapasService from "../services/etapas_service.js";

// GET /api/casos/:id/detalle-360
export const obtenerDetalle360 = async (req, res) => {
    try {
        const data = await casos360Service.obtenerDetalle360(req.params.id);
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

// POST /api/casos/:id/historial
export const crearNotaHistorial = async (req, res) => {
    try {
        const { descripcion, es_importante } = req.body;
        const nota = await historialService.crearNota(
            req.params.id,
            descripcion,
            es_importante,
            req.user?.id_abogado || null
        );
        return res.status(201).json({ success: true, data: nota });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

// GET /api/casos/:id/historial
export const obtenerHistorial = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const data = await historialService.obtenerHistorial(req.params.id, page, limit);
        return res.json({ success: true, ...data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

// POST /api/casos/:id/etiquetas
export const asignarEtiqueta = async (req, res) => {
    try {
        const { id_etiqueta } = req.body;
        const data = await etiquetasService.asignarACaso(req.params.id, id_etiqueta);
        return res.status(201).json({ success: true, data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

// DELETE /api/casos/:id/etiquetas/:id_etiqueta
export const quitarEtiqueta = async (req, res) => {
    try {
        const data = await etiquetasService.quitarDeCaso(req.params.id, req.params.id_etiqueta);
        return res.json({ success: true, ...data });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

// PUT /api/casos/:id/etapa
export const actualizarEtapa = async (req, res) => {
    try {
        const caso = await etapasService.actualizarEtapaCaso(
            req.params.id,
            req.body,
            req.user?.id_abogado || null
        );
        return res.json({ success: true, data: caso });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};
