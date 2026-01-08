import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/common/Toast";
import "./DocumentoDetail.css";
import {
  CasosIcon,
  DocumentosIcon,
  DownLoadIcon,
  excelIcon,
  EyeIcon,
  pdfIcon,
  PencilIcon,
  photoIcon,
  RightIcon,
  SaveIcon,
  TrashICon,
  txtIcon,
  wordIcon,
  Xicon,
  zipIcon,
} from "../../components/common/Icons";
import BackButton from "../../components/common/BackButton";
import ResumenIA from "../../components/ia/ResumenIA";

const DocumentoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");

  useEffect(() => {
    cargarDocumento();
  }, [id]);

  useEffect(() => {
    if (documento) {
      setNuevoNombre(documento.nombre_archivo);
    }
  }, [documento]);

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

  const handleRename = async () => {
    if (!nuevoNombre.trim() || nuevoNombre === documento.nombre_archivo) {
      setIsEditing(false);
      setNuevoNombre(documento.nombre_archivo);
      return;
    }

    try {
      const extensionOriginal = documento.nombre_archivo.split(".").pop();
      let nombreFinal = nuevoNombre.trim();

      if (
        !nombreFinal
          .toLowerCase()
          .endsWith(`.${extensionOriginal.toLowerCase()}`)
      ) {
        nombreFinal = `${nombreFinal}.${extensionOriginal}`;
      }

      await api.put(`/documentos/${id}`, { nombre_archivo: nombreFinal });
      showToast("Documento renombrado correctamente");
      setIsEditing(false);
      cargarDocumento();
    } catch (err) {
      showToast("Error al renombrar el archivo", "error");
      setNuevoNombre(documento.nombre_archivo);
    }
  };

  const esVisualizable = (nombreArchivo) => {
    const extension = nombreArchivo.split(".").pop().toLowerCase();
    const visualizables = ["pdf", "jpg", "jpeg", "png", "txt"];
    return visualizables.includes(extension);
  };

  const handleVerDocumento = async () => {
    if (!esVisualizable(documento.nombre_archivo)) {
      showToast("Formato no previsualizable. Descargando...", "info");
      handleDescargar();
      return;
    }

    try {
      const response = await api.get(`/documentos/${id}/descargar`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      showToast("Error al abrir el archivo", "error");
    }
  };

  const handleEliminar = async () => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar "${documento.nombre_archivo}"?`
      )
    )
      return;
    try {
      await api.delete(`/documentos/${id}`);
      showToast("Documento eliminado exitosamente", "warning");
      setTimeout(() => navigate("/dashboard/documentos"), 1500);
    } catch (err) {
      showToast(err.response?.data?.error || "Error al eliminar", "error");
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
      showToast("Descarga iniciada", "success");
    } catch (err) {
      showToast("Error al descargar", "error");
    }
  };

  const getFileIcon = (nombreArchivo) => {
    if (!nombreArchivo) return <txtIcon />;
    const extension = nombreArchivo.split(".").pop().toLowerCase();
    const icons = {
      pdf: pdfIcon,
      doc: wordIcon,
      docx: wordIcon,
      xls: excelIcon,
      xlsx: excelIcon,
      txt: txtIcon,
      jpg: photoIcon,
      jpeg: photoIcon,
      png: photoIcon,
      gif: photoIcon,
      zip: zipIcon,
      rar: zipIcon,
    };
    const IconComponent = icons[extension] || txtIcon;
    return <IconComponent />;
  };

  if (loading)
    return (
      <div className="detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );

  if (!documento)
    return (
      <div className="detail-container">
        <div className="error-message">No encontrado</div>
      </div>
    );

  return (
    <div className="detail-container">
      <div className="detail-header">
        <div className="title-section">
          <BackButton to="/dashboard/documentos" text="Volver" />

          <div className="editable-header">
            <div className="main-file-icon">
              {getFileIcon(documento.nombre_archivo)}
            </div>

            {isEditing ? (
              <div className="edit-input-container">
                <input
                  type="text"
                  className="input-clean-edit"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  autoFocus
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                />
                <button
                  onClick={handleRename}
                  className="btn-mini-save"
                  title="Guardar"
                >
                  <SaveIcon />
                </button>
              </div>
            ) : (
              <h1
                onClick={() => setIsEditing(true)}
                className="h1-text-clickable"
              >
                {documento.nombre_archivo}
                <span className="icon-edit-small">
                  <PencilIcon />
                </span>
              </h1>
            )}
          </div>
          <p className="subtitle-detail">
            Expediente Digital · ID N°{documento.id_documento}
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn-action-header btn-view-file"
            onClick={handleVerDocumento}
          >
            <EyeIcon /> Ver
          </button>
          <button
            className="btn-action-header btn-download"
            onClick={handleDescargar}
          >
            <DownLoadIcon /> Descargar
          </button>
          <button
            className="btn-action-header btn-delete"
            onClick={handleEliminar}
          >
            <TrashICon /> Eliminar
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* TABLA 1: INFORMACIÓN */}
        <div className="detail-card">
          <div className="card-header">
            <h2>
              <DocumentosIcon /> Información del Archivo
            </h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Nombre actual:</span>
              <span className="info-value">{documento.nombre_archivo}</span>
            </div>
            <div className="info-row">
              <span className="info-label">ID Sistema:</span>
              <span className="info-value">{documento.id_documento}</span>
            </div>
          </div>
        </div>

        {/* TABLA 2: CASO ASOCIADO */}
        <div className="detail-card">
          <div className="card-header">
            <h2>
              <CasosIcon /> Caso Asociado
            </h2>
            {documento.caso && (
              <Link
                to={`/dashboard/casos/${documento.caso.id_caso}`}
                className="btn-small btn-primary"
              >
                Ver Caso <RightIcon />
              </Link>
            )}
          </div>
          <div className="card-body">
            {documento.caso ? (
              <>
                <div className="info-row">
                  <span className="info-label">Expediente:</span>
                  <span className="info-value">#{documento.caso.id_caso}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Cliente:</span>
                  <span className="info-value">
                    {documento.caso.cliente
                      ? `${documento.caso.cliente.nombre} ${documento.caso.cliente.apellido}`
                      : "-"}
                  </span>
                </div>
              </>
            ) : (
              <p className="no-data">Sin caso asociado</p>
            )}
          </div>
        </div>

        {/* TABLA 3: RESUMEN IA (OCUPA TODO EL ANCHO) */}
        {/* IMPORTANTE: Un solo div con ambas clases para que el grid lo estire */}
        <div className="detail-card full-width">
          <ResumenIA
            idDocumento={documento.id_documento}
            nombreDocumento={documento.nombre_archivo}
          />
        </div>
      </div>

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
