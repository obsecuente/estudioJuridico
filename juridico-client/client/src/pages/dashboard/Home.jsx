import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import ClienteForm from "../clientes/ClienteForm";
import ConsultaForm from "../consultas/ConsultaForm";
import CasoForm from "../casos/CasoForm";
import DocumentoUpload from "../documentos/DocumentoUpload";
import EventoForm from "../eventos/EventoForm";
import VencimientoForm from "../vencimientos/VencimientoForm";
import eventosService from "../../services/eventos.service";
import vencimientosService from "../../services/vencimientos.service";
import finanzasService from "../../services/finanzas.service";
import DeleteModal from "../../components/common/DeleteModal";
import MiDia from "../../components/common/MiDia";
import "./Home.css";
import {
  AddIcon,
  CasosIcon,
  ClientIcon,
  ConsultasIcon,
  DocumentosIcon,
  LoginIcon,
  LogoutIcon,
  PencilIcon,
  TrashICon,
  CalendarIcon,
  AlarmIcon,
  YellowState,
  RedState,
  GreenState,
  DocumentosIcon as DocIcon,
} from "../../components/common/Icons";

const Home = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [loadingActividad, setLoadingActividad] = useState(true);
  const [actividadExpandida, setActividadExpandida] = useState(false);

  const [proximosEventos, setProximosEventos] = useState([]);
  const [proximosVencimientos, setProximosVencimientos] = useState([]);
  const [loadingWidgets, setLoadingWidgets] = useState(true);

  const [toast, setToast] = useState(null);

  // Estados de modales
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [showCasoModal, setShowCasoModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [showVencimientoModal, setShowVencimientoModal] = useState(false);

  // Gasto fijo pay confirmation
  const [gastoPayConfirm, setGastoPayConfirm] = useState({ open: false, id: null, nombre: "", monto: 0 });

  useEffect(() => {
    cargarActividadReciente();
    cargarWidgets();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarActividadReciente = async () => {
    setLoadingActividad(true);
    try {
      const response = await api.get("/auditoria/reciente?limit=10");
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
        eventosService.getProximos(10),
        vencimientosService.getProximos(10)
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
    if (reload) cargarActividadReciente();
  };

  const handleCloseConsulta = (reload) => {
    setShowConsultaModal(false);
    if (reload) cargarActividadReciente();
  };

  const handleCloseCaso = (reload) => {
    setShowCasoModal(false);
    if (reload) cargarActividadReciente();
  };

  const handleCloseDocumento = (reload) => {
    setShowDocumentoModal(false);
    if (reload) cargarActividadReciente();
  };

  const handleCloseEvento = (reload) => {
    setShowEventoModal(false);
    if (reload) cargarWidgets();
  };

  const handleCloseVencimiento = (reload) => {
    setShowVencimientoModal(false);
    if (reload) cargarWidgets();
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
        return <DocIcon />;
    }
  };

  // Obtener descripción de la acción
  const obtenerDescripcionAccion = (registro) => {
    const { accion, entidad, id_entidad, usuario } = registro;
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

  // Tipo de evento mapeado
  const tipoEventoLabel = {
    audiencia: "Audiencia",
    reunion: "Reunión",
    tarea: "Tarea",
    vencimiento: "Vencimiento",
    otro: "Otro",
  };

  const tipoVencimientoLabel = {
    contestacion_demanda: "Contestación de Demanda",
    apelacion: "Apelación",
    recurso: "Recurso",
    traslado: "Traslado",
    ofrecimiento_prueba: "Ofrecimiento de Prueba",
    alegato: "Alegato",
    expresion_agravios: "Expresión de Agravios",
    prescripcion: "Prescripción",
    caducidad: "Caducidad",
    gasto_fijo: "💸 Gasto Fijo",
    otro: "Otro",
  };

  const handlePayGastoFijo = async () => {
    if (!gastoPayConfirm.id) return;
    try {
      await finanzasService.marcarPagado(gastoPayConfirm.id);
      setGastoPayConfirm({ open: false, id: null, nombre: "", monto: 0 });
      showToast("Gasto marcado como pagado", "success");
      // Refresh
      const vencRes = await vencimientosService.getProximos(10);
      setProximosVencimientos(vencRes.data || []);
    } catch (err) {
      console.error("Error al marcar gasto pagado:", err);
      showToast("Error al marcar como pagado", "error");
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(val || 0);

  // Actividad reciente visible (colapsable)
  const actividadVisible = actividadExpandida
    ? actividadReciente
    : actividadReciente.slice(0, 3);

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1>¡Bienvenido, {user?.nombre}!</h1>
        <p>Panel de gestión para tu estudio jurídico</p>
      </div>

      {/* ═══════════ MI DÍA - TO DO LIST (Protagonista) ═══════════ */}
      <div className="dashboard-midia-hero">
        <MiDia />
      </div>

      {/* ═══════════ AGENDA + VENCIMIENTOS (10 días) ═══════════ */}
      <div className="dashboard-lists-grid">

        {/* Agenda últimos 10 días */}
        <div className="midia-widget">
          <div className="midia-header">
            <h3><CalendarIcon /> Agenda (10 días)</h3>
            <Link to="/dashboard/eventos" className="midia-header-link">Ver todo →</Link>
          </div>
          <div className="midia-list">
            {loadingWidgets ? (
              <div className="midia-loading">
                <span>Cargando eventos...</span>
              </div>
            ) : proximosEventos.length === 0 ? (
              <div className="midia-empty">📅 No hay eventos próximos</div>
            ) : (
              proximosEventos.map((evt) => (
                <div key={evt.id_evento} className="midia-tarea midia-evento">
                  <div className="midia-tarea-content" style={{ flex: 1 }}>
                    <div className="midia-tarea-texto">{evt.titulo}</div>
                    <div className="midia-tarea-meta">
                      <span>📅 {new Date(evt.fecha_inicio).toLocaleDateString("es-AR")}</span>
                      {evt.hora_inicio && (
                        <span>⏰ {evt.hora_inicio.substring(0, 5)}</span>
                      )}
                    </div>
                  </div>
                  <span className="midia-badge">
                    {tipoEventoLabel[evt.tipo] || evt.tipo}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vencimientos últimos 10 días */}
        <div className="midia-widget">
          <div className="midia-header">
            <h3><AlarmIcon /> Vencimientos (10 días)</h3>
            <Link to="/dashboard/vencimientos" className="midia-header-link">Ver todo →</Link>
          </div>
          <div className="midia-list">
            {loadingWidgets ? (
              <div className="midia-loading">
                <span>Cargando vencimientos...</span>
              </div>
            ) : proximosVencimientos.length === 0 ? (
              <div className="midia-empty">⏰ No hay vencimientos próximos</div>
            ) : (
              proximosVencimientos.map((venc) => (
                <div key={venc.id_vencimiento} className={`midia-tarea ${venc.es_gasto_fijo ? 'midia-gasto-fijo' : ''}`}>
                  <div className="midia-prioridad-indicator">
                    {venc.es_gasto_fijo ? (
                      <span style={{ fontSize: '1.1rem' }}>💸</span>
                    ) : venc.prioridad === "alta" ? (
                      <RedState />
                    ) : venc.prioridad === "baja" ? (
                      <GreenState />
                    ) : (
                      <YellowState />
                    )}
                  </div>
                  <div className="midia-tarea-content" style={{ flex: 1 }}>
                    <div className="midia-tarea-texto">{venc.titulo}</div>
                    <div className="midia-tarea-meta">
                      <span>📅 Vence: {new Date(venc.fecha_limite).toLocaleDateString("es-AR")}</span>
                      {venc.es_gasto_fijo && venc.monto_ars && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                          {formatCurrency(venc.monto_ars)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="midia-badge">
                      {tipoVencimientoLabel[venc.tipo_vencimiento] || venc.tipo_vencimiento}
                    </span>
                    {venc.es_gasto_fijo && (
                      <button
                        className="midia-pay-btn"
                        onClick={() => setGastoPayConfirm({
                          open: true,
                          id: venc.id_movimiento,
                          nombre: venc.titulo,
                          monto: venc.monto_ars,
                        })}
                        title="Marcar como pagado"
                      >
                        ✓ Pagado
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ ACCIONES RÁPIDAS ═══════════ */}
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button onClick={() => setShowEventoModal(true)} className="action-btn">
            <span className="action-icon"><CalendarIcon /></span>
            <span>Agendar</span>
          </button>
          <button onClick={() => setShowVencimientoModal(true)} className="action-btn">
            <span className="action-icon"><AlarmIcon /></span>
            <span>Vencimiento</span>
          </button>
          <button onClick={() => setShowClienteModal(true)} className="action-btn">
            <span className="action-icon"><ClientIcon /></span>
            <span>Nuevo Cliente</span>
          </button>
          <button onClick={() => setShowConsultaModal(true)} className="action-btn">
            <span className="action-icon"><ConsultasIcon /></span>
            <span>Nueva Consulta</span>
          </button>
          <button onClick={() => setShowCasoModal(true)} className="action-btn">
            <span className="action-icon"><CasosIcon /></span>
            <span>Nuevo Caso</span>
          </button>
          <button onClick={() => setShowDocumentoModal(true)} className="action-btn">
            <span className="action-icon"><DocumentosIcon /></span>
            <span>Subir Documento</span>
          </button>
        </div>
      </div>

      {/* ═══════════ ACTIVIDAD RECIENTE (Colapsable) ═══════════ */}
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
            <>
              {actividadVisible.map((registro) => (
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
              ))}

              {/* Botón colapsable */}
              {actividadReciente.length > 3 && (
                <button
                  className="activity-toggle-btn"
                  onClick={() => setActividadExpandida(!actividadExpandida)}
                >
                  {actividadExpandida ? (
                    <>▲ Ver menos</>
                  ) : (
                    <>▼ Ver más ({actividadReciente.length - 3} más)</>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══════════ MODALES ═══════════ */}
      {showClienteModal && (
        <ClienteForm onClose={handleCloseCliente} showToast={showToast} />
      )}
      {showConsultaModal && (
        <ConsultaForm onClose={handleCloseConsulta} showToast={showToast} />
      )}
      {showCasoModal && (
        <CasoForm onClose={handleCloseCaso} showToast={showToast} />
      )}
      {showDocModal && (
        <DocumentoUpload onClose={handleCloseDocumento} showToast={showToast} />
      )}
      {showEventoModal && (
        <EventoForm onClose={handleCloseEvento} showToast={showToast} />
      )}
      {showVencimientoModal && (
        <VencimientoForm onClose={handleCloseVencimiento} showToast={showToast} />
      )}

      <DeleteModal
        isOpen={gastoPayConfirm.open}
        onConfirm={handlePayGastoFijo}
        onCancel={() => setGastoPayConfirm({ open: false, id: null, nombre: "", monto: 0 })}
        title="Confirmar pago"
        message={`¿Marcás como pagado "${gastoPayConfirm.nombre}" por ${formatCurrency(gastoPayConfirm.monto)}?`}
        confirmLabel="Confirmar pago"
        confirmVariant="success"
      />

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
