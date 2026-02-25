// src/services/casos.service.js
import api from "./api";

const casosService = {
    /**
     * Lista simple de casos (id, descripcion, cliente_apellido) para selects
     */
    getListaSimple: async () => {
        const response = await api.get("/casos/lista-simple");
        return response.data;
    },
};

export default casosService;
