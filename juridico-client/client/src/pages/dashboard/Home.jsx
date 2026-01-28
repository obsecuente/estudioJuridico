import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast"; // ← CAMBIO
import ClienteForm from "../clientes/ClienteForm";
import ConsultaForm from "../consultas/ConsultaForm";
import CasoForm from "../casos/CasoForm";
import DocumentoUpload from "../documentos/DocumentoUpload";
import EventoForm from "../eventos/EventoForm";
import VencimientoForm from "../vencimientos/VencimientoForm";
import eventosService from "../../services/eventos.service";
import vencimientosService from "../../services/vencimientos.service";
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
  EventIcon,
  AlarmIcon,
  CalendarIcon,
  YellowState,
  RedState, // Asumiendo que existe o lo creamos inline si no
  GreenState,
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
  
  const [proximosEventos, setProximosEventos] = useState([]);
  const [proximosVencimientos, setProximosVencimientos] = useState([]);
  const [loadingWidgets, setLoadingWidgets] = useState(true);

  const [toast, setToast] = useState(null); // ← AGREGAR

  // Estados de modales
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [showCasoModal, setShowCasoModal] = useState(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [showVencimientoModal, setShowVencimientoModal] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
    cargarEstadisticas();
    cargarActividadReciente();
    cargarWidgets();
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

  const cargarWidgets = async () => {
    setLoadingWidgets(true);
    try {
        const [eventosRes, vencimientosRes] = await Promise.all([
            eventosService.getProximos(7),
            vencimientosService.getProximos(7)
        ]);
        setProximosEventos(eventosRes.data || []);
        setProximosVencimientos(vencimientosRes.data || []);
    } catch (error) {
        console.error("Error al cargar widgets:", error);
    } finally {
        setLoadingWidgets(false);
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

  const handleCloseEvento = (reload) => {
    setShowEventoModal(false);
    if (reload) {
        cargarWidgets();
    }
  };

  const handleCloseVencimiento = (reload) => {
    setShowVencimientoModal(false);
    if (reload) {
        cargarWidgets();
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
         <button onClick={() => setShowEventoModal(true)} className="action-btn">
            <span className="action-icon">
              <CalendarIcon />
            </span>
            <span>Nuevo Evento</span>
          </button>
           <button onClick={() => setShowVencimientoModal(true)} className="action-btn">
            <span className="action-icon">
              <AlarmIcon />
            </span>
            <span>Nuevo Vencimiento</span>
          </button>
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

      <div className="dashboard-widgets-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          
          {/* Widget Eventos */}
          <div className="widget-card card">
            <div className="widget-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CalendarIcon /> Agenda (7 días)
                </h3>
                <Link to="/dashboard/eventos" className="text-sm">Ver todo</Link>
            </div>
            <div className="widget-body" style={{ padding: '15px' }}>
                {loadingWidgets ? (
                    <p>Cargando...</p>
                ) : proximosEventos.length === 0 ? (
                    <p className="text-muted">No hay eventos próximos.</p>
                ) : (
                    <div className="events-list">
                        {proximosEventos.map(evt => (
                            <div key={evt.id_evento} className="event-item" style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f9f9f9' }}>
                                <div style={{ fontWeight: 'bold' }}>{evt.titulo}</div>
                                <div style={{ fontSize: '0.85em', color: '#666' }}>
                                    {new Date(evt.fecha_inicio).toLocaleDateString()} - {new Date(evt.fecha_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>

          {/* Widget Vencimientos */}
           <div className="widget-card card">
            <div className="widget-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlarmIcon /> Vencimientos (7 días)
                </h3>
                <Link to="/dashboard/vencimientos" className="text-sm">Ver todo</Link>
            </div>
             <div className="widget-body" style={{ padding: '15px' }}>
                {loadingWidgets ? (
                    <p>Cargando...</p>
                ) : proximosVencimientos.length === 0 ? (
                    <p className="text-muted">No hay vencimientos próximos.</p>
                ) : (
                    <div className="vencimientos-list">
                         {proximosVencimientos.map(venc => (
                            <div key={venc.id_vencimiento} className="vencimiento-item" style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f9f9f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{venc.titulo}</div>
                                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                                        Vence: {new Date(venc.fecha_vencimiento).toLocaleDateString()} {new Date(venc.fecha_vencimiento).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                <div>
                                    <span className="badge badge-warning">{venc.tipo_vencimiento}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
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
      {showEventoModal && (
        <EventoForm onClose={handleCloseEvento} showToast={showToast} />
      )}
      {showVencimientoModal && (
        <VencimientoForm onClose={handleCloseVencimiento} showToast={showToast} />
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
