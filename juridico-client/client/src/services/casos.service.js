// src/services/casos.service.js
// API layer para Vista 360 de casos
import api from "./api";

const casosService = {
    // Lista simple (usado por MiDia, selects, etc.)
    getListaSimple: async () => {
        const res = await api.get("/casos/lista-simple");
        return res.data;
    },

    // Vista 360 completa
    getDetalle360: async (idCaso) => {
        const res = await api.get(`/casos/${idCaso}/detalle-360`);
        return res.data;
    },

    // Historial
    getHistorial: async (idCaso, page = 1, limit = 50) => {
        const res = await api.get(`/casos/${idCaso}/historial?page=${page}&limit=${limit}`);
        return res.data;
    },
    postHistorial: async (idCaso, descripcion, esImportante = false) => {
        const res = await api.post(`/casos/${idCaso}/historial`, {
            descripcion,
            es_importante: esImportante,
        });
        return res.data;
    },

    // Etiquetas
    getEtiquetas: async () => {
        const res = await api.get("/etiquetas");
        return res.data;
    },
    crearEtiqueta: async (nombre, colorHex) => {
        const res = await api.post("/etiquetas", { nombre, color_hex: colorHex });
        return res.data;
    },
    eliminarEtiqueta: async (idEtiqueta) => {
        const res = await api.delete(`/etiquetas/${idEtiqueta}`);
        return res.data;
    },
    asignarEtiqueta: async (idCaso, idEtiqueta) => {
        const res = await api.post(`/casos/${idCaso}/etiquetas`, { id_etiqueta: idEtiqueta });
        return res.data;
    },
    quitarEtiqueta: async (idCaso, idEtiqueta) => {
        const res = await api.delete(`/casos/${idCaso}/etiquetas/${idEtiqueta}`);
        return res.data;
    },

    // Etapa procesal
    getEtapasLegales: async (tipoProceso = null) => {
        const query = tipoProceso ? `?tipo_proceso=${tipoProceso}` : "";
        const res = await api.get(`/etapas-legales${query}`);
        return res.data;
    },
    actualizarEtapa: async (idCaso, datos) => {
        const res = await api.put(`/casos/${idCaso}/etapa`, datos);
        return res.data;
    },

    // Calculadora contextual
    calcularContextual: async (idCaso, fechaNotificacion) => {
        const res = await api.post(`/calculadora/contextual/${idCaso}`, {
            fecha_notificacion: fechaNotificacion,
        });
        return res.data;
    },

    // Cobrar cuota (usa endpoint existente)
    cobrarCuota: async (idCuota) => {
        const res = await api.patch(`/finanzas/cuotas/${idCuota}`);
        return res.data;
    },
};

export default casosService;
