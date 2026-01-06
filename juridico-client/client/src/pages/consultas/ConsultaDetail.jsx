import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import ConsultaForm from "./ConsultaForm";
import Toast from "../../components/common/Toast";
import DeleteModal from "../../components/common/DeleteModal";
import "./ConsultaDetail.css";
import {
  AbogadosIcon,
  ArrowLeftIcon,
  BlueState,
  CalendarIcon,
  ClientIcon,
  DocumentosIcon,
  GreenState,
  MessageIcon,
  PencilIcon,
  TrashICon,
  YellowState,
} from "../../components/common/Icons";
import BackButton from "../../components/common/BackButton";

const ConsultaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [consulta, setConsulta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarConsulta();
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarConsulta = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/consultas/${id}`);
      setConsulta(response.data.data);
    } catch (err) {
      console.error("Error al cargar consulta:", err);
      showToast("Error al cargar la consulta", "error");
      navigate("/dashboard/consultas");
    } finally {
      setLoading(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({});

  const handleEliminar = () => {
    // Abrir modal configurado
    setDeleteConfig({ type: "DELETE_CONSULTA", id });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/consultas/${deleteConfig.id}`);
      showToast("Consulta eliminada exitosamente", "warning");
      setTimeout(() => {
        navigate("/dashboard/consultas");
      }, 1500);
    } catch (err) {
      console.error("Error al eliminar consulta:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar la consulta",
        "error"
      );
    } finally {
      setShowDeleteModal(false);
      setDeleteConfig({});
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      await api.put(`/consultas/${id}`, {
        mensaje: consulta.mensaje,
        estado: nuevoEstado,
        id_cliente: consulta.id_cliente,
        id_abogado_asignado: consulta.id_abogado_asignado,
      });
      showToast("Estado actualizado exitosamente", "success");
      cargarConsulta();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      showToast("Error al cambiar el estado", "error");
    }
  };

  const handleCloseModal = (reload = false) => {
    setShowEditModal(false);
    if (reload) {
      cargarConsulta();
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { text: "Pendiente", color: "#f59e0b" },
      en_progreso: { text: "En Progreso", color: "#3b82f6" },
      resuelta: { text: "Resuelta", color: "#10b981" },
    };
    return badges[estado] || { text: estado, color: "#6b7280", icon: "⚪" };
  };

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="detail-container">
        <div className="error-message">Consulta no encontrada</div>
      </div>
    );
  }

  const estadoBadge = getEstadoBadge(consulta.estado);

  return (
    <div className="detail-container">
      {/* Header */}
      <div className="detail-header">
        <div>
          <BackButton to="/dashboard/consultas" text="Volver a Consultas" />
          <h1>
            <DocumentosIcon /> Consulta #{consulta.id_consulta}
          </h1>
          <div className="header-info">
            <span
              className="estado-badge-large"
              style={{ backgroundColor: estadoBadge.color }}
            >
              {estadoBadge.icon} {estadoBadge.text}
            </span>
            <span className="fecha-envio">
              <CalendarIcon /> {formatearFecha(consulta.fecha_envio)}
            </span>
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

      {/* Botones de cambio de estado */}
      <div className="estado-actions">
        <h3>Cambiar Estado:</h3>
        <div className="estado-buttons">
          <button
            className={`btn-estado ${
              consulta.estado === "pendiente" ? "active" : ""
            }`}
            onClick={() => handleCambiarEstado("pendiente")}
            disabled={consulta.estado === "pendiente"}
          >
            <YellowState />
            Pendiente
          </button>
          <button
            className={`btn-estado ${
              consulta.estado === "en_progreso" ? "active" : ""
            }`}
            onClick={() => handleCambiarEstado("en_progreso")}
            disabled={consulta.estado === "en_progreso"}
          >
            <BlueState /> En Progreso
          </button>
          <button
            className={`btn-estado ${
              consulta.estado === "resuelta" ? "active" : ""
            }`}
            onClick={() => handleCambiarEstado("resuelta")}
            disabled={consulta.estado === "resuelta"}
          >
            <GreenState /> Resuelta
          </button>
        </div>
      </div>

      {/* Grid principal */}
      <div className="detail-grid">
        {/* Mensaje de la consulta */}
        <div className="detail-card full-width">
          <div className="card-header">
            <h2>
              <MessageIcon /> Mensaje de la Consulta
            </h2>
          </div>
          <div className="card-body">
            <p className="mensaje-completo">{consulta.mensaje}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className="detail-card">
          <div className="card-header">
            <h2>
              <ClientIcon /> Cliente
            </h2>
            {consulta.cliente && (
              <Link
                to={`/dashboard/clientes/${consulta.cliente.id_cliente}`}
                className="btn-small btn-primary"
              >
                Ver Perfil →
              </Link>
            )}
          </div>
          <div className="card-body">
            {consulta.cliente ? (
              <>
                <div className="info-row">
                  <span className="info-label">Nombre:</span>
                  <span className="info-value">
                    {consulta.cliente.nombre} {consulta.cliente.apellido}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">
                    <a href={`mailto:${consulta.cliente.email}`}>
                      {consulta.cliente.email}
                    </a>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Teléfono:</span>
                  <span className="info-value">
                    {consulta.cliente.telefono ? (
                      <a href={`tel:${consulta.cliente.telefono}`}>
                        {consulta.cliente.telefono}
                      </a>
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </>
            ) : (
              <p className="no-data">Cliente no disponible</p>
            )}
          </div>
        </div>

        {/* Abogado Asignado */}
        <div className="detail-card">
          <div className="card-header">
            <h2>
              <AbogadosIcon /> Abogado Asignado
            </h2>
          </div>
          <div className="card-body">
            {consulta.abogado ? (
              <>
                <div className="info-row">
                  <span className="info-label">Nombre:</span>
                  <span className="info-value">
                    {consulta.abogado.nombre} {consulta.abogado.apellido}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">
                    <a href={`mailto:${consulta.abogado.email}`}>
                      {consulta.abogado.email}
                    </a>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Especialidad:</span>
                  <span className="info-value">
                    {consulta.abogado.especialidad || "-"}
                  </span>
                </div>
              </>
            ) : (
              <div className="no-data">
                <p>Sin abogado asignado</p>
                <button
                  className="btn-small btn-primary"
                  onClick={() => setShowEditModal(true)}
                  style={{ marginTop: "10px" }}
                >
                  Asignar Abogado
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <ConsultaForm
          consulta={consulta}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <DeleteModal
        isOpen={showDeleteModal}
        title={"¿Eliminar Consulta?"}
        message={
          "La consulta será eliminada permanentemente. ¿Desea continuar?"
        }
        confirmLabel={"Eliminar Consulta"}
        confirmVariant={"danger"}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
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

export default ConsultaDetail;
