import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import "./Home.css";
import {
  AddIcon,
  CasosIcon,
  ClientIcon,
  ConsultasIcon,
  DocumentosIcon,
  NextIcon,
} from "../../components/common/Icons";

const Home = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    clientes: 0,
    consultas: 0,
    casos: 0,
    documentos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const [clientesRes, consultasRes, casosRes, documentosRes] =
        await Promise.all([
          api.get("/clientes?limit=1"),
          api.get("/consultas?limit=1"),
          api.get("/casos?limit=1"),
          api.get("/documentos?limit=1"),
        ]);

      setStats({
        clientes: clientesRes.data.pagination?.total || 0,
        consultas: consultasRes.data.pagination?.total || 0,
        casos: casosRes.data.pagination?.total || 0,
        documentos: documentosRes.data.pagination?.total || 0,
      });
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: "Clientes",
      value: stats.clientes,
      icon: <ClientIcon />,
      link: "/dashboard/clientes",
    },
    {
      title: "Consultas",
      value: stats.consultas,
      icon: <ConsultasIcon />,
      link: "/dashboard/consultas",
    },
    {
      title: "Casos",
      value: stats.casos,
      icon: <CasosIcon />,
      link: "/dashboard/casos",
    },
    {
      title: "Documentos",
      value: stats.documentos,
      icon: <DocumentosIcon />,
      link: "/dashboard/documentos",
    },
  ];

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1>¡Bienvenido, {user?.nombre}!</h1>
        <p>Panel de gestión para tu estudio jurídico</p>
      </div>

      <div className="stats-grid">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="stat-card skeleton">
                <div className="skeleton-icon"></div>
                <div className="skeleton-text"></div>
              </div>
            ))
          : statsData.map((stat, index) => (
              <Link to={stat.link} key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-info">
                  <h3>{stat.title}</h3>
                  <p className="stat-value">{stat.value}</p>
                  <span className="stat-link">
                    VER TODOS <NextIcon />
                  </span>
                </div>
              </Link>
            ))}
      </div>

      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <Link to="/dashboard/clientes" className="action-btn">
            <span className="action-icon">
              <ClientIcon />
            </span>
            <span>Nuevo Cliente</span>
          </Link>
          <Link to="/dashboard/consultas" className="action-btn">
            <span className="action-icon">
              <ConsultasIcon />
            </span>
            <span>Nueva Consulta</span>
          </Link>
          <Link to="/dashboard/casos" className="action-btn">
            <span className="action-icon">
              <CasosIcon />
            </span>
            <span>Nuevo Caso</span>
          </Link>
          <Link to="/dashboard/documentos" className="action-btn">
            <span className="action-icon">
              <DocumentosIcon />
            </span>
            <span>Subir Documento</span>
          </Link>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Actividad Reciente</h2>
        <div className="activity-card">
          <p className="empty-state">Próximamente: historial de actividades</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
