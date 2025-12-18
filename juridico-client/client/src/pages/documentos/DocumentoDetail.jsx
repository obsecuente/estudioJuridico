import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import "./DocumentoDetail.css";

const DocumentoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarDocumento();
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarDocumento = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documentos/${id}`);
      setDocumento(response.data.data);
    } catch (err) {
      console.error("Error al cargar documento:", err);
      showToast("Error al cargar el documento", "error");
      navigate("/dashboard/documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar "${documento.nombre_archivo}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/documentos/${id}`);
      showToast("Documento eliminado exitosamente", "warning");
      setTimeout(() => {
        navigate("/dashboard/documentos");
      }, 1500);
    } catch (err) {
      console.error("Error al eliminar documento:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar el documento",
        "error"
      );
    }
  };

  const handleDescargar = async () => {
    try {
      const response = await api.get(`/documentos/${id}/descargar`, {
        responseType: "blob",
      });

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

  const getFileIcon = (nombreArchivo) => {
    const extension = nombreArchivo?.split(".").pop().toLowerCase();
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

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (!documento) {
    return (
      <div className="detail-container">
        <div className="error-message">Documento no encontrado</div>
      </div>
    );
  }

  return (
    <div className="detail-container">
      {/* Header */}
      <div className="detail-header">
        <div>
          <Link to="/dashboard/documentos" className="back-link">
            ← Volver a Documentos
          </Link>
          <h1>
            {getFileIcon(documento.nombre_archivo)} {documento.nombre_archivo}
          </h1>
          <p>Detalles del documento</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-action-header btn-download"
            onClick={handleDescargar}
          >
            ⬇️ Descargar
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
        {/* Información del Documento */}
        <div className="detail-card">
          <div className="card-header">
            <h2>📋 Información del Archivo</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">ID:</span>
              <span className="info-value">{documento.id_documento}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Nombre:</span>
              <span className="info-value">{documento.nombre_archivo}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Ruta:</span>
              <span className="info-value ruta-texto">
                {documento.ruta || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Caso Asociado */}
        <div className="detail-card">
          <div className="card-header">
            <h2>📂 Caso Asociado</h2>
            {documento.caso && (
              <Link
                to={`/dashboard/casos/${documento.caso.id_caso}`}
                className="btn-small btn-primary"
              >
                Ver Caso →
              </Link>
            )}
          </div>
          <div className="card-body">
            {documento.caso ? (
              <>
                <div className="info-row">
                  <span className="info-label">Caso #:</span>
                  <span className="info-value">{documento.caso.id_caso}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Cliente:</span>
                  <span className="info-value">
                    {documento.caso.cliente ? (
                      <Link
                        to={`/dashboard/clientes/${documento.caso.cliente.id_cliente}`}
                      >
                        {documento.caso.cliente.nombre}{" "}
                        {documento.caso.cliente.apellido}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Estado:</span>
                  <span className="info-value">
                    <span
                      className="estado-badge-small"
                      style={{
                        backgroundColor:
                          documento.caso.estado === "abierto"
                            ? "#10b981"
                            : "#6b7280",
                      }}
                    >
                      {documento.caso.estado === "abierto"
                        ? "🟢 Abierto"
                        : "⚫ Cerrado"}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <p className="no-data">Sin caso asociado</p>
            )}
          </div>
        </div>

        {/* Resumen con IA (Preparado para el futuro) */}
        <div className="detail-card full-width">
          <div className="card-header">
            <h2>🤖 Resumen Automático (IA)</h2>
            <button className="btn-small btn-primary" disabled>
              Generar Resumen
            </button>
          </div>
          <div className="card-body">
            <div className="ia-placeholder">
              <div className="ia-icon">🤖</div>
              <p className="ia-text">
                Funcionalidad de IA disponible próximamente
              </p>
              <small className="ia-hint">
                Podrás generar resúmenes automáticos de documentos usando
                inteligencia artificial
              </small>
            </div>
          </div>
        </div>
      </div>

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

export default DocumentoDetail;
