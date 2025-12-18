import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import CasoForm from "./CasoForm";
import DocumentoUpload from "../documentos/DocumentoUpload";
import DocumentoViewer from "../../components/DocumentoViewer";
import Toast from "../../components/common/Toast";
import "./CasoDetail.css";

const CasoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caso, setCaso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [documentoActual, setDocumentoActual] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarCaso();
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarCaso = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/casos/${id}`);
      setCaso(response.data.data);
    } catch (err) {
      console.error("Error al cargar caso:", err);
      showToast("Error al cargar el caso", "error");
      navigate("/dashboard/casos");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm("¿Estás seguro de eliminar este caso?")) {
      return;
    }

    try {
      await api.delete(`/casos/${id}`);
      showToast("Caso eliminado exitosamente", "warning");
      setTimeout(() => {
        navigate("/dashboard/casos");
      }, 1500);
    } catch (err) {
      console.error("Error al eliminar caso:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar el caso",
        "error"
      );
    }
  };

  const handleCerrarCaso = async () => {
    if (!window.confirm("¿Estás seguro de cerrar este caso?")) {
      return;
    }

    try {
      await api.put(`/casos/${id}`, {
        descripcion: caso.descripcion,
        estado: "cerrado",
        fecha_inicio: caso.fecha_inicio,
        id_cliente: caso.id_cliente,
        id_abogado: caso.id_abogado,
      });
      showToast("Caso cerrado exitosamente", "success");
      cargarCaso();
    } catch (err) {
      console.error("Error al cerrar caso:", err);
      showToast("Error al cerrar el caso", "error");
    }
  };

  const handleReabrirCaso = async () => {
    if (!window.confirm("¿Estás seguro de reabrir este caso?")) {
      return;
    }

    try {
      await api.put(`/casos/${id}`, {
        descripcion: caso.descripcion,
        estado: "abierto",
        fecha_inicio: caso.fecha_inicio,
        id_cliente: caso.id_cliente,
        id_abogado: caso.id_abogado,
      });
      showToast("Caso reabierto exitosamente", "success");
      cargarCaso();
    } catch (err) {
      console.error("Error al reabrir caso:", err);
      showToast("Error al reabrir el caso", "error");
    }
  };

  const handleCloseModal = (reload = false) => {
    setShowEditModal(false);
    if (reload) {
      cargarCaso();
    }
  };

  const handleCloseUploadModal = (reload = false) => {
    setShowUploadModal(false);
    if (reload) {
      cargarCaso();
    }
  };

  const getFileIcon = (nombreArchivo) => {
    if (!nombreArchivo) return "📄";
    const extension = nombreArchivo.split(".").pop().toLowerCase();
    const icons = {
      pdf: "📕",
      doc: "📘",
      docx: "📘",
      xls: "📗",
      xlsx: "📗",
      txt: "📄",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      gif: "🖼️",
      zip: "📦",
      rar: "📦",
    };
    return icons[extension] || "📄";
  };

  const handleVerDocumento = (documento) => {
    setDocumentoActual(documento);
    setShowViewerModal(true);
  };

  const handleDescargarDocumento = async (documento) => {
    try {
      const response = await api.get(
        `/documentos/${documento.id_documento}/descargar`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", documento.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast("Documento descargado exitosamente", "success");
    } catch (err) {
      console.error("Error al descargar documento:", err);
      showToast("Error al descargar el documento", "error");
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      abierto: { text: "Abierto", color: "#10b981", icon: "🟢" },
      cerrado: { text: "Cerrado", color: "#6b7280", icon: "⚫" },
    };
    return badges[estado] || { text: estado, color: "#6b7280", icon: "⚪" };
  };

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando caso...</p>
        </div>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="detail-container">
        <div className="error-message">Caso no encontrado</div>
      </div>
    );
  }

  const estadoBadge = getEstadoBadge(caso.estado);

  return (
    <div className="detail-container">
      {/* Header */}
      <div className="detail-header">
        <div>
          <Link to="/dashboard/casos" className="back-link">
            ← Volver a Casos
          </Link>
          <h1>📂 Caso #{caso.id_caso}</h1>
          <div className="header-info">
            <span
              className="estado-badge-large"
              style={{ backgroundColor: estadoBadge.color }}
            >
              {estadoBadge.icon} {estadoBadge.text}
            </span>
            <span className="fecha-envio">
              📅 Inicio: {formatearFecha(caso.fecha_inicio)}
            </span>
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

      {/* Botones de cambio de estado */}
      <div className="estado-actions">
        <h3>Acciones del Caso:</h3>
        <div className="estado-buttons">
          {caso.estado === "abierto" ? (
            <button
              className="btn-estado btn-cerrar"
              onClick={handleCerrarCaso}
            >
              🔒 Cerrar Caso
            </button>
          ) : (
            <button
              className="btn-estado btn-reabrir"
              onClick={handleReabrirCaso}
            >
              🔓 Reabrir Caso
            </button>
          )}
        </div>
      </div>

      {/* Grid principal */}
      <div className="detail-grid">
        {/* Descripción del caso */}
        <div className="detail-card full-width">
          <div className="card-header">
            <h2>📋 Descripción del Caso</h2>
          </div>
          <div className="card-body">
            <p className="descripcion-completa">{caso.descripcion}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className="detail-card">
          <div className="card-header">
            <h2>👤 Cliente</h2>
            {caso.cliente && (
              <Link
                to={`/dashboard/clientes/${caso.cliente.id_cliente}`}
                className="btn-small btn-primary"
              >
                Ver Perfil →
              </Link>
            )}
          </div>
          <div className="card-body">
            {caso.cliente ? (
              <>
                <div className="info-row">
                  <span className="info-label">Nombre:</span>
                  <span className="info-value">
                    {caso.cliente.nombre} {caso.cliente.apellido}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">
                    <a href={`mailto:${caso.cliente.email}`}>
                      {caso.cliente.email}
                    </a>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Teléfono:</span>
                  <span className="info-value">
                    {caso.cliente.telefono ? (
                      <a href={`tel:${caso.cliente.telefono}`}>
                        {caso.cliente.telefono}
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
            <h2>👨‍⚖️ Abogado Asignado</h2>
          </div>
          <div className="card-body">
            {caso.abogado ? (
              <>
                <div className="info-row">
                  <span className="info-label">Nombre:</span>
                  <span className="info-value">
                    {caso.abogado.nombre} {caso.abogado.apellido}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">
                    <a href={`mailto:${caso.abogado.email}`}>
                      {caso.abogado.email}
                    </a>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Especialidad:</span>
                  <span className="info-value">
                    {caso.abogado.especialidad || "-"}
                  </span>
                </div>
              </>
            ) : (
              <p className="no-data">Sin abogado asignado</p>
            )}
          </div>
        </div>

        {/* Documentos */}
        <div className="detail-card full-width">
          <div className="card-header">
            <h2>📄 Documentos ({caso.documentos?.length || 0})</h2>
            <button
              className="btn-small btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              ➕ Subir Documento
            </button>
          </div>
          <div className="card-body">
            {caso.documentos && caso.documentos.length > 0 ? (
              <div className="list-items">
                {caso.documentos.map((documento) => (
                  <div
                    key={documento.id_documento}
                    className="list-item documento-item"
                  >
                    <div
                      className="item-content clickable"
                      onClick={() => handleVerDocumento(documento)}
                    >
                      <span className="item-icon">
                        {getFileIcon(documento.nombre_archivo)}
                      </span>
                      <span className="item-name">
                        {documento.nombre_archivo}
                      </span>
                    </div>
                    <div className="documento-actions">
                      <button
                        className="item-action-btn btn-view"
                        onClick={() => handleVerDocumento(documento)}
                        title="Ver documento"
                      >
                        👁️
                      </button>
                      <button
                        className="item-action-btn btn-download"
                        onClick={() => handleDescargarDocumento(documento)}
                        title="Descargar"
                      >
                        ⬇️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-small">
                <p>No hay documentos asociados a este caso</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <CasoForm
          caso={caso}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}

      {/* Modal de upload de documentos */}
      {showUploadModal && (
        <DocumentoUpload
          idCasoPredefinido={caso.id_caso}
          onClose={handleCloseUploadModal}
          showToast={showToast}
        />
      )}

      {/* Modal visor de documentos */}
      {showViewerModal && documentoActual && (
        <DocumentoViewer
          documento={documentoActual}
          onClose={() => {
            setShowViewerModal(false);
            setDocumentoActual(null);
          }}
          onDownload={() => handleDescargarDocumento(documentoActual)}
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

export default CasoDetail;
