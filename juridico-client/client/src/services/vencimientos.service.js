import api from "./api";

const vencimientosService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/vencimientos", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/vencimientos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/vencimientos", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/vencimientos/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/vencimientos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProximos: async (dias = 7) => {
    try {
      const response = await api.get(`/vencimientos/proximos?dias=${dias}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  marcarCumplido: async (id, notas = "") => {
    try {
      const response = await api.patch(`/vencimientos/${id}/cumplir`, { notas });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  obtenerResumen: async () => {
    try {
      const response = await api.get("/vencimientos/resumen");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default vencimientosService;
