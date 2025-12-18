import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import ClienteForm from "./ClienteForm";
import Toast from "../../components/common/Toast";
import "./ClienteDetail.css";

const ClienteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarCliente();
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarCliente = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clientes/${id}`);
      setCliente(response.data.data);
    } catch (err) {
      console.error("Error al cargar cliente:", err);
      showToast("Error al cargar el cliente", "error");
      navigate("/dashboard/clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar a ${cliente.nombre} ${cliente.apellido}?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/clientes/${id}`);
      showToast("Cliente eliminado exitosamente", "warning");
      setTimeout(() => {
        navigate("/dashboard/clientes");
      }, 1500);
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar el cliente",
        "error"
      );
    }
  };

  const handleCloseModal = (reload = false) => {
    setShowEditModal(false);
    if (reload) {
      cargarCliente();
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR");
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

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="detail-container">
        <div className="error-message">Cliente no encontrado</div>
      </div>
    );
  }

  return (
    <div className="detail-container">
      {/* Header con botones de acción */}
      <div className="detail-header">
        <div>
          <Link to="/dashboard/clientes" className="back-link">
            ← Volver a Clientes
          </Link>
          <h1>
            👤 {cliente.nombre} {cliente.apellido}
          </h1>
          <p>Información completa del cliente</p>
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

      {/* Grid principal */}
      <div className="detail-grid">
        {/* Sección: Datos del Cliente */}
        <div className="detail-card">
          <div className="card-header">
            <h2>📋 Datos del Cliente</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">ID:</span>
              <span className="info-value">{cliente.id_cliente}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nombre:</span>
              <span className="info-value">{cliente.nombre}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Apellido:</span>
              <span className="info-value">{cliente.apellido}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">
                <a href={`mailto:${cliente.email}`}>{cliente.email}</a>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Teléfono:</span>
              <span className="info-value">
                {cliente.telefono ? (
                  <a href={`tel:${cliente.telefono}`}>{cliente.telefono}</a>
                ) : (
                  "-"
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Fecha Registro:</span>
              <span className="info-value">
                {formatearFecha(cliente.fecha_registro)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Consentimiento:</span>
              <span className="info-value">
                {cliente.consentimiento_datos
                  ? "✅ Otorgado"
                  : "❌ No otorgado"}
              </span>
            </div>
          </div>
        </div>

        {/* Sección: Consultas */}
        <div className="detail-card">
          <div className="card-header">
            <h2>💬 Consultas ({cliente.consultas?.length || 0})</h2>
            <button className="btn-small btn-primary">➕ Nueva Consulta</button>
          </div>
          <div className="card-body">
            {cliente.consultas && cliente.consultas.length > 0 ? (
              <div className="list-items">
                {cliente.consultas.map((consulta) => {
                  const badge = getEstadoBadge(consulta.estado);
                  return (
                    <div key={consulta.id_consulta} className="list-item">
                      <div className="item-content">
                        <span className="item-id">#{consulta.id_consulta}</span>
                        <span
                          className="item-badge"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <div className="item-info">
                        <p className="item-message">
                          {consulta.mensaje?.substring(0, 100)}...
                        </p>
                        <small className="item-date">
                          {formatearFecha(consulta.fecha_envio)}
                        </small>
                      </div>
                      <Link
                        to={`/dashboard/consultas/${consulta.id_consulta}`}
                        className="item-link"
                      >
                        Ver →
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-small">
                <p>No hay consultas registradas</p>
              </div>
            )}
          </div>
        </div>

        {/* Sección: Casos */}
        <div className="detail-card">
          <div className="card-header">
            <h2>📂 Casos ({cliente.casos?.length || 0})</h2>
            <button className="btn-small btn-primary">➕ Nuevo Caso</button>
          </div>
          <div className="card-body">
            {cliente.casos && cliente.casos.length > 0 ? (
              <div className="list-items">
                {cliente.casos.map((caso) => {
                  const badge = getEstadoBadge(caso.estado);
                  return (
                    <div key={caso.id_caso} className="list-item">
                      <div className="item-content">
                        <span className="item-id">#{caso.id_caso}</span>
                        <span
                          className="item-badge"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <div className="item-info">
                        <p className="item-message">
                          {caso.descripcion?.substring(0, 100)}...
                        </p>
                        <small className="item-date">
                          Inicio: {formatearFecha(caso.fecha_inicio)}
                        </small>
                      </div>
                      <Link
                        to={`/dashboard/casos/${caso.id_caso}`}
                        className="item-link"
                      >
                        Ver →
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-small">
                <p>No hay casos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <ClienteForm
          cliente={cliente}
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

export default ClienteDetail;
