import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import AbogadoForm from "./AbogadoForm";
import Toast from "../../components/common/Toast";
import "./AbogadoDetail.css";

const AbogadoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [abogado, setAbogado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
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

  const handleEliminar = async () => {
    if (!window.confirm("¿Estás seguro de eliminar este abogado?")) {
      return;
    }

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
      admin: { text: "Administrador", color: "#ef4444", icon: "👑" },
      abogado: { text: "Abogado", color: "#3b82f6", icon: "👨‍⚖️" },
      asistente: { text: "Asistente", color: "#10b981", icon: "👔" },
    };
    return badges[rol] || { text: rol, color: "#6b7280", icon: "👤" };
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

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando abogado...</p>
        </div>
      </div>
    );
  }

  if (!abogado) {
    return (
      <div className="detail-container">
        <div className="error-message">Abogado no encontrado</div>
      </div>
    );
  }

  const rolBadge = getRolBadge(abogado.rol);
  const stats = calcularEstadisticas();

  return (
    <div className="detail-container">
      {/* Header */}
      <div className="detail-header">
        <div>
          <Link to="/dashboard/abogados" className="back-link">
            ← Volver a Abogados
          </Link>
          <h1>
            👨‍⚖️ {abogado.nombre} {abogado.apellido}
          </h1>
          <div className="header-info">
            <span
              className="estado-badge-large"
              style={{ backgroundColor: rolBadge.color }}
            >
              {rolBadge.icon} {rolBadge.text}
            </span>
            {abogado.especialidad && (
              <span className="especialidad-tag">
                📚 {abogado.especialidad}
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-action-header btn-edit"
            onClick={() => setShowEditModal(true)}
          >
            ✏️ Editar
          </button>
          <button
            className="btn-action-header btn-delete"
            onClick={handleEliminar}
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.totalConsultas}</h3>
            <p>Consultas Totales</p>
            <small>{stats.consultasResueltas} resueltas</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📂</div>
          <div className="stat-content">
            <h3>{stats.totalCasos}</h3>
            <p>Casos Totales</p>
            <small>{stats.casosAbiertos} abiertos</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.consultasResueltas}</h3>
            <p>Consultas Resueltas</p>
            <small>{stats.consultasPendientes} pendientes</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔒</div>
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

      {/* Grid principal */}
      <div className="detail-grid">
        {/* Información Personal */}
        <div className="detail-card">
          <div className="card-header">
            <h2>📋 Información Personal</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">ID:</span>
              <span className="info-value">{abogado.id_abogado}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nombre:</span>
              <span className="info-value">{abogado.nombre}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Apellido:</span>
              <span className="info-value">{abogado.apellido}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">
                <a href={`mailto:${abogado.email}`}>{abogado.email}</a>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Especialidad:</span>
              <span className="info-value">{abogado.especialidad || "-"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Rol:</span>
              <span className="info-value">
                <span
                  className="estado-badge-small"
                  style={{ backgroundColor: rolBadge.color }}
                >
                  {rolBadge.icon} {rolBadge.text}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Consultas Asignadas */}
        <div className="detail-card full-width">
          <div className="card-header">
            <h2>💬 Consultas Asignadas ({stats.totalConsultas})</h2>
          </div>
          <div className="card-body">
            {abogado.consultas && abogado.consultas.length > 0 ? (
              <div className="list-items">
                {abogado.consultas.map((consulta) => {
                  const badge = getEstadoBadge(consulta.estado);
                  return (
                    <div key={consulta.id_consulta} className="list-item">
                      <div className="item-header">
                        <span className="item-id">#{consulta.id_consulta}</span>
                        <span
                          className="item-badge"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <p className="item-message">
                        {consulta.mensaje?.substring(0, 100)}...
                      </p>
                      <div className="item-footer">
                        <span className="item-date">
                          📅{" "}
                          {new Date(consulta.fecha_envio).toLocaleDateString(
                            "es-AR"
                          )}
                        </span>
                        <Link
                          to={`/dashboard/consultas/${consulta.id_consulta}`}
                          className="item-link"
                        >
                          Ver Consulta →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-small">
                <p>No tiene consultas asignadas</p>
              </div>
            )}
          </div>
        </div>

        {/* Casos Asignados */}
        <div className="detail-card full-width">
          <div className="card-header">
            <h2>📂 Casos Asignados ({stats.totalCasos})</h2>
          </div>
          <div className="card-body">
            {abogado.casos && abogado.casos.length > 0 ? (
              <div className="list-items">
                {abogado.casos.map((caso) => {
                  const badge = getEstadoBadge(caso.estado);
                  return (
                    <div key={caso.id_caso} className="list-item">
                      <div className="item-header">
                        <span className="item-id">Caso #{caso.id_caso}</span>
                        <span
                          className="item-badge"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <p className="item-message">
                        {caso.descripcion?.substring(0, 100)}...
                      </p>
                      <div className="item-footer">
                        <span className="item-date">
                          📅 Inicio:{" "}
                          {new Date(caso.fecha_inicio).toLocaleDateString(
                            "es-AR"
                          )}
                        </span>
                        <Link
                          to={`/dashboard/casos/${caso.id_caso}`}
                          className="item-link"
                        >
                          Ver Caso →
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

      {/* Modal de edición */}
      {showEditModal && (
        <AbogadoForm
          abogado={abogado}
          onClose={handleCloseModal}
          showToast={showToast}
        />
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

export default AbogadoDetail;
