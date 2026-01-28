import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import {
  ConsultasIcon,
  ClientIcon,
  HomeIcon,
  CasosIcon,
  DocumentosIcon,
  AbogadosIcon,
  EventIcon,
  AlarmIcon,
} from "../common/Icons.jsx";
import "./Sidebar.css";

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Sistema Jurídico</h2>
        <p className="sidebar-subtitle">Gestión Legal</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span className="nav-icon">
            <HomeIcon />
          </span>
          <span>Inicio</span>
        </NavLink>

        <NavLink
          to="/dashboard/clientes"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span className="nav-icon">
            <ClientIcon />
          </span>
          <span>Clientes</span>
        </NavLink>

        <NavLink
          to="/dashboard/consultas"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span className="nav-icon">
            <ConsultasIcon />
          </span>
          <span>Consultas</span>
        </NavLink>

        <NavLink
          to="/dashboard/casos"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span className="nav-icon">
            {" "}
            <CasosIcon />{" "}
          </span>
          <span>Casos</span>
        </NavLink>

        <NavLink
          to="/dashboard/documentos"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span className="nav-icon">
            {" "}
            <DocumentosIcon />{" "}
          </span>
          <span>Documentos</span>
        </NavLink>

        <NavLink
          to="/dashboard/eventos"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span className="nav-icon">
            <EventIcon />
          </span>
          <span>Agenda</span>
        </NavLink>

        <NavLink
          to="/dashboard/vencimientos"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <span className="nav-icon">
            <AlarmIcon />
          </span>
          <span>Vencimientos</span>
        </NavLink>

        {/* Solo mostrar Abogados si es admin */}
        {user?.rol === "admin" && (
          <NavLink
            to="/dashboard/abogados"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">
              {" "}
              <AbogadosIcon />{" "}
            </span>
            <span>Abogados</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <p>© 2025 Sistema Jurídico</p>
      </div>
    </aside>
  );
};

export default Sidebar;
