import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Topbar.css";

const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getRolBadge = (rol) => {
    const badges = {
      admin: { text: "Admin", color: "#e67e22" }, // Un naranja más terracota/cuero
      abogado: { text: "Abogado", color: "#27ae60" }, // Un verde esmeralda más serio
      asistente: { text: "Asistente", color: "#2980b9" }, // Un azul acero,
    };
    return badges[rol] || badges.abogado;
  };

  const badge = getRolBadge(user?.rol);

  return (
    <header className="topbar">
      <div className="topbar-content">
        <div className="topbar-left">
          <h1 className="topbar-title">Panel de Control</h1>
        </div>

        <div className="topbar-right">
          <div className="user-info">
            <div className="user-avatar">
              {user?.nombre?.charAt(0)}
              {user?.apellido?.charAt(0)}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.nombre} {user?.apellido}
              </span>
              <span
                className="user-role"
                style={{ backgroundColor: badge.color }}
              >
                {badge.text}
              </span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
