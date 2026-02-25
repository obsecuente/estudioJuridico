// src/services/abogados.service.js
import api from "./api";

const abogadosService = {
    /**
     * Obtiene la lista de todos los abogados
     */
    getAll: async () => {
        const response = await api.get("/abogados");
        return response.data;
    },
};

export default abogadosService;
