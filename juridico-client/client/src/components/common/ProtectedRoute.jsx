import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);
  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Cargando...
      </div>
    );
  }
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  // Si hay roles permitidos, verificar que el usuario tenga uno
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.rol)) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <h2>Acceso Denegado.</h2>
          <p>No tenés permisos para acceder a esta sección</p>
        </div>
      );
    }
  }
  // Si pasó todas las validaciones, mostrar el contenido
  return children;
};

export default ProtectedRoute;
