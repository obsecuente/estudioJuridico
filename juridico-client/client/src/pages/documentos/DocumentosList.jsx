import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import DocumentoUpload from "./DocumentoUpload";
import Toast from "../../components/common/Toast";
import "./DocumentosList.css";
import {
  CasosIcon,
  DownLoadIcon,
  excelIcon,
  EyeIcon,
  pdfIcon,
  PencilIcon,
  photoIcon,
  TrashICon,
  txtIcon,
  UploadIcon,
  wordIcon,
  zipIcon,
} from "../../components/common/Icons";

const DocumentosList = () => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    cargarDocumentos();
  }, [pagination.page, searchTerm]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarDocumentos = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };

      const response = await api.get("/documentos", { params });
      console.log("Response completa:", response.data);
      // Manejar si data es array directo o está dentro de data
      const documentosData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      setDocumentos(documentosData);

      // Manejar si viene paginación o no
      if (response.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination.total || documentosData.length,
          totalPages: response.data.pagination.totalPages || 1,
        }));
      } else {
        // Si no hay paginación, usar los datos directos
        setPagination((prev) => ({
          ...prev,
          total: documentosData.length,
          totalPages: 1,
        }));
      }
    } catch (err) {
      console.error("Error al cargar documentos:", err);
      setError("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  };
  const handleEditClick = (doc) => {
    setEditingDoc(doc);
    setNewName(doc.nombre_archivo);
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleNuevoDocumento = () => {
    setShowUploadModal(true);
  };
  const handleUpdateNombre = async () => {
    try {
      await api.put(`/documentos/${editingDoc.id_documento}`, {
        nombre_archivo: newName,
      });
      showToast("Nombre actualizado", "success");
      setEditingDoc(null);
      cargarDocumentos(); // Recarga la lista
    } catch (err) {
      showToast("Error al actualizar", "error");
    }
  };
  const handleEliminarDocumento = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
      return;
    }

    try {
      await api.delete(`/documentos/${id}`);
      cargarDocumentos();
      showToast("Documento eliminado exitosamente", "warning");
    } catch (err) {
      console.error("Error al eliminar documento:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar el documento",
        "error"
      );
    }
  };

  const handleDescargar = async (id, nombreArchivo) => {
    try {
      const response = await api.get(`/documentos/${id}/descargar`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", nombreArchivo);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast("Documento descargado exitosamente", "success");
    } catch (err) {
      console.error("Error al descargar documento:", err);
      showToast("Error al descargar el documento", "error");
    }
  };

  const handleCloseModal = (reload = false) => {
    setShowUploadModal(false);
    if (reload) {
      cargarDocumentos();
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const getFileIcon = (nombreArchivo) => {
    if (!nombreArchivo) return <txtIcon />;
    const extension = nombreArchivo.split(".").pop().toLowerCase();

    // Mapeamos la extensión a la VARIABLE del componente importado
    // Pero para que React lo entienda, asignamos el componente a una variable con Mayúscula
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

    // Obtenemos el componente (la referencia, no el JSX todavía)
    const IconComponent = icons[extension] || txtIcon;

    // Devolvemos el componente bien renderizado con Mayúscula
    return <IconComponent />;
  };

  const getFileSize = (bytes) => {
    if (!bytes) return "-";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="documentos-container">
      {/* Header */}
      <div className="documentos-header">
        <div>
          <h1>Gestión de Documentos</h1>
          <p>Administrá los archivos del estudio</p>
        </div>
        <button className="btn-nuevo" onClick={handleNuevoDocumento}>
          <UploadIcon /> Subir Documento
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre de archivo..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando documentos...</p>
        </div>
      ) : (
        <>
          {/* Grid de documentos */}
          <div className="documentos-grid">
            {documentos.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron documentos</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="btn-clear"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              documentos.map((doc) => (
                <div key={doc.id_documento} className="documento-card">
                  <div className="documento-icon">
                    {getFileIcon(doc.nombre_archivo)}
                  </div>
                  <div className="documento-info">
                    <h3 className="documento-nombre" title={doc.nombre_archivo}>
                      {doc.nombre_archivo}
                    </h3>
                    <p className="documento-caso">
                      {doc.caso ? (
                        <Link to={`/dashboard/casos/${doc.caso.id_caso}`}>
                          <CasosIcon /> Caso #{doc.caso.id_caso}
                        </Link>
                      ) : (
                        <span className="sin-caso">Sin caso asignado</span>
                      )}
                    </p>
                  </div>
                  <div className="documento-actions">
                    <button
                      className="btn-action btn-download"
                      onClick={() =>
                        handleDescargar(doc.id_documento, doc.nombre_archivo)
                      }
                      title="Descargar"
                    >
                      <DownLoadIcon />
                    </button>
                    <Link
                      to={`/dashboard/documentos/${doc.id_documento}`}
                      className="btn-action btn-view"
                      title="Ver detalles"
                    >
                      <EyeIcon />
                    </Link>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEditClick(doc)}
                      title="Editar nombre"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() =>
                        handleEliminarDocumento(
                          doc.id_documento,
                          doc.nombre_archivo
                        )
                      }
                      title="Eliminar"
                    >
                      <TrashICon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-page"
              >
                ← Anterior
              </button>

              <div className="page-numbers">
                {[...Array(pagination.totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`btn-page-number ${
                      pagination.page === index + 1 ? "active" : ""
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-page"
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* Info de paginación */}
          <div className="pagination-info">
            Mostrando {documentos.length} de {pagination.total} documentos
          </div>
        </>
      )}

      {/* Modal de upload */}
      {showUploadModal && (
        <DocumentoUpload onClose={handleCloseModal} showToast={showToast} />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {editingDoc && (
        <div className="modal-overlay">
          <div className="modal-edit-card">
            <h2>Editar nombre del archivo</h2>
            <p
              style={{
                fontSize: "12px",
                color: "#64748b",
                marginBottom: "10px",
              }}
            >
              Archivo original: {editingDoc.nombre_archivo}
            </p>
            <input
              type="text"
              className="edit-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleUpdateNombre()}
            />
            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setEditingDoc(null)}
              >
                Cancelar
              </button>
              <button className="btn-save" onClick={handleUpdateNombre}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosList;
