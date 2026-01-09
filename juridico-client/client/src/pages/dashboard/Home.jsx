import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast"; // ← CAMBIO
import ClienteForm from "../clientes/ClienteForm";
import ConsultaForm from "../consultas/ConsultaForm";
import CasoForm from "../casos/CasoForm";
import DocumentoUpload from "../documentos/DocumentoUpload";
import "./Home.css";
import {
  AddIcon,
  CasosIcon,
  ClientIcon,
  ConsultasIcon,
  DocumentosIcon,
  LoginIcon,
  LogoutIcon,
  NextIcon,
  PencilIcon,
  TrashICon,
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
  const [actividadReciente, setActividadReciente] = useState([]);
  const [loadingActividad, setLoadingActividad] = useState(true);
  const [toast, setToast] = useState(null); // ← AGREGAR

  // Estados de modales
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [showCasoModal, setShowCasoModal] = useState(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
    cargarActividadReciente();
  }, []);

  // ← AGREGAR función showToast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

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

  const cargarActividadReciente = async () => {
    setLoadingActividad(true);
    try {
      const response = await api.get("/auditoria/reciente?limit=8");
      setActividadReciente(response.data.data);
    } catch (error) {
      console.error("Error al cargar actividad reciente:", error);
    } finally {
      setLoadingActividad(false);
    }
  };

  // Funciones para cerrar modales
  const handleCloseCliente = (reload) => {
    setShowClienteModal(false);
    if (reload) {
      cargarEstadisticas();
      cargarActividadReciente();
    }
  };

  const handleCloseConsulta = (reload) => {
    setShowConsultaModal(false);
    if (reload) {
      cargarEstadisticas();
      cargarActividadReciente();
    }
  };

  const handleCloseCaso = (reload) => {
    setShowCasoModal(false);
    if (reload) {
      cargarEstadisticas();
      cargarActividadReciente();
    }
  };

  const handleCloseDocumento = (reload) => {
    setShowDocumentoModal(false);
    if (reload) {
      cargarEstadisticas();
      cargarActividadReciente();
    }
  };

  // Formatear fecha relativa
  const formatearFechaRelativa = (fecha) => {
    const ahora = new Date();
    const fechaAudit = new Date(fecha);
    const diffMs = ahora - fechaAudit;
    const diffSeg = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSeg / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHrs / 24);

    if (diffSeg < 60) return "Hace unos segundos";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} hrs`;
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return fechaAudit.toLocaleDateString("es-AR");
  };

  // Obtener icono según acción
  const obtenerIconoAccion = (accion) => {
    switch (accion) {
      case "CREAR":
        return <AddIcon />;
      case "ACTUALIZAR":
        return <PencilIcon />;
      case "ELIMINAR":
        return <TrashICon />;
      case "LOGIN":
        return <LoginIcon />;
      case "LOGOUT":
        return <LogoutIcon />;
      default:
        return <DocumentosIcon />;
    }
  };

  // Obtener descripción de la acción
  const obtenerDescripcionAccion = (registro) => {
    const { accion, entidad, id_entidad, usuario } = registro;

    // Nombre del usuario que hizo la acción
    const nombreUsuario = usuario
      ? `${usuario.nombre} ${usuario.apellido}`
      : "Usuario desconocido";

    const verbo = {
      CREAR: "creó",
      ACTUALIZAR: "actualizó",
      ELIMINAR: "eliminó",
      LOGIN: "inició sesión",
      LOGOUT: "cerró sesión",
    }[accion];

    if (accion === "LOGIN" || accion === "LOGOUT") {
      return `${nombreUsuario} ${verbo}`;
    }

    return `${nombreUsuario} ${verbo} ${entidad.toLowerCase()} #${id_entidad}`;
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
          <button
            onClick={() => setShowClienteModal(true)}
            className="action-btn"
          >
            <span className="action-icon">
              <ClientIcon />
            </span>
            <span>Nuevo Cliente</span>
          </button>
          <button
            onClick={() => setShowConsultaModal(true)}
            className="action-btn"
          >
            <span className="action-icon">
              <ConsultasIcon />
            </span>
            <span>Nueva Consulta</span>
          </button>
          <button onClick={() => setShowCasoModal(true)} className="action-btn">
            <span className="action-icon">
              <CasosIcon />
            </span>
            <span>Nuevo Caso</span>
          </button>
          <button
            onClick={() => setShowDocumentoModal(true)}
            className="action-btn"
          >
            <span className="action-icon">
              <DocumentosIcon />
            </span>
            <span>Subir Documento</span>
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Actividad Reciente</h2>
        <div className="activity-list">
          {loadingActividad ? (
            <div className="activity-item">
              <p className="empty-state">Cargando actividad...</p>
            </div>
          ) : actividadReciente.length === 0 ? (
            <div className="activity-item">
              <p className="empty-state">No hay actividad reciente</p>
            </div>
          ) : (
            actividadReciente.map((registro) => (
              <div key={registro.id_auditoria} className="activity-item">
                <span className="activity-icon">
                  {obtenerIconoAccion(registro.accion)}
                </span>
                <div className="activity-content">
                  <p className="activity-description">
                    {obtenerDescripcionAccion(registro)}
                  </p>
                  <span className="activity-time">
                    {formatearFechaRelativa(registro.fecha)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modales */}
      {showClienteModal && (
        <ClienteForm onClose={handleCloseCliente} showToast={showToast} />
      )}
      {showConsultaModal && (
        <ConsultaForm onClose={handleCloseConsulta} showToast={showToast} />
      )}
      {showCasoModal && (
        <CasoForm onClose={handleCloseCaso} showToast={showToast} />
      )}
      {showDocumentoModal && (
        <DocumentoUpload onClose={handleCloseDocumento} showToast={showToast} />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Home;
