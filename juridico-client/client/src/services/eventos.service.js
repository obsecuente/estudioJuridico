import api from "./api";

const eventosService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/eventos", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/eventos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post("/eventos", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/eventos/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/eventos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProximos: async (dias = 7) => {
    try {
      const response = await api.get(`/eventos/proximos?dias=${dias}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default eventosService;
