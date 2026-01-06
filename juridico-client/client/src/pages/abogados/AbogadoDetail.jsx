import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import AbogadoForm from "./AbogadoForm";
import Toast from "../../components/common/Toast";
import DeleteModal from "../../components/common/DeleteModal";
import {
  AbogadosIcon,
  MessageIcon,
  CasosIcon,
  GreenState,
  BlueState,
  PencilIcon,
  TrashICon,
  DocumentosIcon,
  ConsultasIcon,
  CalendarIcon,
  RightIcon,
} from "../../components/common/Icons";
import "./AbogadoDetail.css";
import BackButton from "../../components/common/BackButton";

const AbogadoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [abogado, setAbogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarAbogado();
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarAbogado = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/abogados/${id}`);
      setAbogado(response.data.data);
    } catch (err) {
      console.error("Error al cargar abogado:", err);
      showToast("Error al cargar el abogado", "error");
      navigate("/dashboard/abogados");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/abogados/${id}`);
      showToast("Abogado eliminado exitosamente", "warning");
      setTimeout(() => {
        navigate("/dashboard/abogados");
      }, 1500);
    } catch (err) {
      console.error("Error al eliminar abogado:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar el abogado",
        "error"
      );
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleCloseModal = (reload = false) => {
    setShowEditModal(false);
    if (reload) {
      cargarAbogado();
    }
  };

  const getRolBadge = (rol) => {
    const badges = {
      admin: {
        text: "ADMINISTRADOR",
        color: "#ef4444",
        icon: <AbogadosIcon />,
      },
      abogado: { text: "ABOGADO", color: "#3b82f6", icon: <AbogadosIcon /> },
      asistente: { text: "ASISTENTE", color: "#10b981", icon: <MessageIcon /> },
    };
    return (
      badges[rol] || {
        text: rol.toUpperCase(),
        color: "#6b7280",
        icon: <AbogadosIcon />,
      }
    );
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { text: "Pendiente", color: "#f59e0b" },
      en_progreso: { text: "En Progreso", color: "#3b82f6" },
      resuelta: { text: "Resuelta", color: "#10b981" },
      abierto: { text: "Abierto", color: "#10b981" },
      cerrado: { text: "Cerrado", color: "#6b7280" },
    };
    return badges[estado] || { text: estado, color: "#6b7280" };
  };

  const calcularEstadisticas = () => {
    const totalConsultas = abogado?.consultas?.length || 0;
    const consultasResueltas =
      abogado?.consultas?.filter((c) => c.estado === "resuelta").length || 0;
    const totalCasos = abogado?.casos?.length || 0;
    const casosCerrados =
      abogado?.casos?.filter((c) => c.estado === "cerrado").length || 0;

    return {
      totalConsultas,
      consultasResueltas,
      consultasPendientes: totalConsultas - consultasResueltas,
      totalCasos,
      casosCerrados,
      casosAbiertos: totalCasos - casosCerrados,
    };
  };

  if (loading)
    return (
      <div className="detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando abogado...</p>
        </div>
      </div>
    );

  if (!abogado)
    return (
      <div className="detail-container">
        <div className="error-message">Abogado no encontrado</div>
      </div>
    );

  const rolBadge = getRolBadge(abogado.rol);
  const stats = calcularEstadisticas();

  return (
    <div className="lawyer-detail-wrapper">
      {" "}
      {/* Clase raíz única para aislamiento */}
      <div className="detail-header">
        <div className="header-left">
          <BackButton to="/dashboard/abogados" text="VOLVER" />
          <div className="name-with-icon">
            <span className="main-icon-title">
              <AbogadosIcon />
            </span>
            <h1>
              {abogado.nombre} {abogado.apellido}
            </h1>
          </div>
          <div className="header-info">
            <span
              className="rol-badge-main"
              style={{ backgroundColor: rolBadge.color }}
            >
              {rolBadge.text}
            </span>
            {abogado.especialidad && (
              <span className="especialidad-tag-header">
                <CasosIcon /> {abogado.especialidad}
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-action-header btn-edit"
            onClick={() => setShowEditModal(true)}
          >
            <PencilIcon /> Editar
          </button>
          <button
            className="btn-action-header btn-delete"
            onClick={handleEliminar}
          >
            <TrashICon /> Eliminar
          </button>
        </div>
      </div>
      <div className="lawyer-stats-grid">
        {" "}
        {/* Clase renombrada */}
        <div className="lawyer-stat-card">
          {" "}
          {/* Clase renombrada */}
          <div className="stat-icon-circle">
            <MessageIcon />
          </div>
          <div className="stat-content">
            <h3>{stats.totalConsultas}</h3>
            <p>Consultas Totales</p>
            <small>{stats.consultasResueltas} resueltas</small>
          </div>
        </div>
        <div className="lawyer-stat-card">
          <div className="stat-icon-circle">
            <CasosIcon />
          </div>
          <div className="stat-content">
            <h3>{stats.totalCasos}</h3>
            <p>Casos Totales</p>
            <small>{stats.casosAbiertos} abiertos</small>
          </div>
        </div>
        <div className="lawyer-stat-card resueltas">
          <div className="stat-icon-circle status-green">
            <GreenState />
          </div>
          <div className="stat-content">
            <h3>{stats.consultasResueltas}</h3>
            <p>Consultas Resueltas</p>
            <small>{stats.consultasPendientes} pendientes</small>
          </div>
        </div>
        <div className="lawyer-stat-card cerrados">
          <div className="stat-icon-circle status-blue">
            <BlueState />
          </div>
          <div className="stat-content">
            <h3>{stats.casosCerrados}</h3>
            <p>Casos Cerrados</p>
            <small>
              {((stats.casosCerrados / stats.totalCasos) * 100 || 0).toFixed(0)}
              % de éxito
            </small>
          </div>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-card">
          <div className="card-header-dark">
            <h2>
              <DocumentosIcon /> INFORMACIÓN PERSONAL
            </h2>
          </div>
          <div className="card-body">
            {[
              { label: "ID:", value: abogado.id_abogado },
              { label: "NOMBRE:", value: abogado.nombre },
              { label: "APELLIDO:", value: abogado.apellido },
              { label: "EMAIL:", value: abogado.email, isEmail: true },
              { label: "ESPECIALIDAD:", value: abogado.especialidad || "-" },
            ].map((item, idx) => (
              <div className="info-row" key={idx}>
                <span className="info-label">{item.label}</span>
                <span
                  className={`info-value ${item.isEmail ? "email-link" : ""}`}
                >
                  {item.isEmail ? (
                    <a href={`mailto:${item.value}`}>{item.value}</a>
                  ) : (
                    item.value
                  )}
                </span>
              </div>
            ))}
            <div className="info-row">
              <span className="info-label">ROL:</span>
              <span className="info-value">
                <span
                  className="rol-badge-small"
                  style={{ backgroundColor: rolBadge.color }}
                >
                  {rolBadge.text}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Consultas y Casos usan la misma estructura de card-header-dark */}
        <div className="detail-card full-width">
          <div className="card-header-dark">
            <h2>
              <ConsultasIcon /> CONSULTAS ASIGNADAS ({stats.totalConsultas})
            </h2>
          </div>
          <div className="card-body">
            {abogado.casos?.length > 0 ? (
              <div className="list-container">
                {abogado.casos.map((caso) => {
                  const badge = getEstadoBadge(caso.estado);
                  return (
                    <div key={caso.id_caso} className="list-item-row">
                      <div className="item-main-info">
                        <span className="item-id-tag blue">
                          Caso N°{caso.id_caso}
                        </span>
                        <span
                          className="item-status-pill"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.text}
                        </span>
                        <p className="item-text-preview">
                          {caso.descripcion?.substring(0, 80)}...
                        </p>
                      </div>
                      <div className="item-side-info">
                        <span className="item-date-text">
                          <CalendarIcon /> Inicio:{" "}
                          {new Date(caso.fecha_inicio).toLocaleDateString(
                            "es-AR"
                          )}
                        </span>
                        <Link
                          to={`/dashboard/casos/${caso.id_caso}`}
                          className="btn-view-item"
                        >
                          Ver Caso <RightIcon />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-small">
                <p>No tiene casos asignados</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showEditModal && (
        <AbogadoForm
          abogado={abogado}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}
      <DeleteModal
        isOpen={showDeleteModal}
        title={"¿Eliminar Abogado?"}
        message={"Esta acción eliminará al abogado y no se puede deshacer."}
        confirmLabel={"Eliminar Abogado"}
        confirmVariant={"danger"}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
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

export default AbogadoDetail;
