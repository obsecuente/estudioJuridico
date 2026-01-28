import axios from "axios";

// URL backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Configuracion base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptador del token en cada peticion (se ejecuta ANTES de cada peticion)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    console.log("🔑 Token a enviar:", token); // ← Agregá este log
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para manejar errores globalmente (se ejecuta DESPUES de cada peticion)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log detallado del error
    console.log("❌ Error en API:", error);
    console.log("❌ Status:", error.response?.status);
    console.log("❌ URL:", error.config?.url);
    console.log("❌ Headers:", error.config?.headers);
    console.log("❌ Response data:", error.response?.data);

    // Si el token expiró, cerrar sesión
    if (error.response?.status === 401) {
      console.log(
        "⚠️ Token inválido, esperando 3 segundos antes de desloguear..."
      );

      // Esperar 3 segundos para que veas los logs
      await new Promise((resolve) => setTimeout(resolve, 8000));

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);


export default api;
