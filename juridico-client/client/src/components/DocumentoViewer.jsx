import { useState } from "react";
import api from "../services/api";
import "./DocumentoViewer.css";

const DocumentoViewer = ({ documento, onClose, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getFileExtension = (filename) => {
    return filename?.split(".").pop().toLowerCase();
  };

  const extension = getFileExtension(documento.nombre_archivo);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
  const isPDF = extension === "pdf";
  const canPreview = isImage || isPDF;

  // URL para preview
  const previewUrl = `${api.defaults.baseURL}/documentos/${documento.id_documento}/descargar`;

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <div className="viewer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="viewer-header">
          <div className="viewer-title">
            <h2>{documento.nombre_archivo}</h2>
            <p>ID: {documento.id_documento}</p>
          </div>
          <div className="viewer-actions">
            <button
              className="viewer-btn viewer-btn-download"
              onClick={onDownload}
              title="Descargar"
            >
              ⬇️ Descargar
            </button>
            <button
              className="viewer-btn viewer-btn-close"
              onClick={onClose}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="viewer-content">
          {canPreview ? (
            <>
              {loading && (
                <div className="viewer-loading">
                  <div className="spinner"></div>
                  <p>Cargando documento...</p>
                </div>
              )}

              {error && (
                <div className="viewer-error">
                  <p>❌ Error al cargar el documento</p>
                  <button
                    className="viewer-btn viewer-btn-download"
                    onClick={onDownload}
                  >
                    Descargar en su lugar
                  </button>
                </div>
              )}

              {isImage && (
                <img
                  src={previewUrl}
                  alt={documento.nombre_archivo}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                  style={{ display: loading || error ? "none" : "block" }}
                />
              )}

              {isPDF && (
                <iframe
                  src={previewUrl}
                  title={documento.nombre_archivo}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                  style={{ display: loading || error ? "none" : "block" }}
                />
              )}
            </>
          ) : (
            <div className="viewer-no-preview">
              <div className="no-preview-icon">📄</div>
              <h3>Vista previa no disponible</h3>
              <p>Este tipo de archivo no se puede visualizar en el navegador</p>
              <p className="file-type">Tipo: {extension.toUpperCase()}</p>
              <button
                className="viewer-btn viewer-btn-download"
                onClick={onDownload}
              >
                ⬇️ Descargar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentoViewer;
