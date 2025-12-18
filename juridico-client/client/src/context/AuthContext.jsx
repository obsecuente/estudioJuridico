import { createContext, useState, useEffect } from "react";
import api from "../services/api.js";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); //* setea que usuario esta usando la app, primero nadie ( null )
  const [loading, setLoading] = useState(true); //* terminó de revisar el usuario?, siempre revisa si hay un usuario guardado ( true )
  //* set loading, le dice a la app que deje de esperar la revision inicial, y muestre la interfaz del estado actual log o inlog
  // Verificar si hay un token guardado al cargar la app
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (savedUser && accessToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { accessToken, refreshToken, abogado } = response.data.data;

    // Guardar en localStorage
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(abogado));

    // Actualizar estado
    setUser(abogado);

    return abogado;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      // Limpiar localStorage y estado
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.rol);
  };

  const canAccess = (requiredRoles) => {
    return hasRole(requiredRoles);
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem("accessToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
        canAccess,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
