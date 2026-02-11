// src/services/tareas.service.js
import api from "./api";

const tareasService = {
    /**
     * Obtiene las tareas del abogado autenticado
     * @param {Object} filtros - completadas, prioridad, id_caso, vencidas, page, limit
     */
    getTareas: async (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.completadas !== undefined) params.append("completadas", filtros.completadas);
        if (filtros.prioridad) params.append("prioridad", filtros.prioridad);
        if (filtros.id_caso) params.append("id_caso", filtros.id_caso);
        if (filtros.vencidas) params.append("vencidas", filtros.vencidas);
        if (filtros.page) params.append("page", filtros.page);
        if (filtros.limit) params.append("limit", filtros.limit);

        const response = await api.get(`/tareas?${params.toString()}`);
        return response.data;
    },

    /**
     * Crea una nueva tarea
     */
    crear: async (datos) => {
        const response = await api.post("/tareas", datos);
        return response.data;
    },

    /**
     * Actualiza una tarea
     */
    actualizar: async (idTarea, datos) => {
        const response = await api.put(`/tareas/${idTarea}`, datos);
        return response.data;
    },

    /**
     * Marca una tarea como completada o pendiente
     */
    marcarCompletada: async (idTarea, completada = true) => {
        const response = await api.patch(`/tareas/${idTarea}/completar`, { completada });
        return response.data;
    },

    /**
     * Elimina una tarea
     */
    eliminar: async (idTarea) => {
        const response = await api.delete(`/tareas/${idTarea}`);
        return response.data;
    },

    /**
     * Obtiene estadísticas de tareas
     */
    getEstadisticas: async () => {
        const response = await api.get("/tareas/estadisticas");
        return response.data;
    },

    /**
     * Obtiene tareas organizadas por urgencia para Mi Día
     */
    getMiDia: async () => {
        const response = await api.get("/tareas/mi-dia");
        return response.data;
    },

    /**
     * Pasa una tarea al plazo de gracia (Art. 124 CPCC)
     */
    pasarAPlazoDeGracia: async (idTarea) => {
        const response = await api.patch(`/tareas/${idTarea}/plazo-gracia`);
        return response.data;
    },
};

export default tareasService;
