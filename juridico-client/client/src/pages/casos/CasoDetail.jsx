import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import CasoForm from "./CasoForm";
import DocumentoUpload from "../documentos/DocumentoUpload";
import Toast from "../../components/common/Toast";
import DeleteModal from "../../components/common/DeleteModal";
import "./CasoDetail.css";
import {
  AbogadosIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ClientIcon,
  DocumentosIcon,
  DownLoadIcon,
  excelIcon,
  EyeIcon,
  pdfIcon,
  PencilIcon,
  photoIcon,
  SaveIcon,
  TrashICon,
  txtIcon,
  wordIcon,
  Xicon,
  zipIcon,
} from "../../components/common/Icons";
import BackButton from "../../components/common/BackButton";

const CasoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caso, setCaso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documentoActual, setDocumentoActual] = useState(null);
  const [toast, setToast] = useState(null);
  const [isEditingDescripcion, setIsEditingDescripcion] = useState(false);
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  // Delete/confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({});

  useEffect(() => {
    if (caso) {
      setNuevaDescripcion(caso.descripcion);
    }
  }, [caso]);
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

  const handleEliminar = () => {
    setDeleteConfig({ type: "DELETE_CASE", id });
    setShowDeleteModal(true);
  };

  const handleCerrarCaso = async () => {
    setDeleteConfig({ type: "CLOSE_CASE", id });
    setShowDeleteModal(true);
  };

  const handleReabrirCaso = async () => {
    setDeleteConfig({ type: "REOPEN_CASE", id });
    setShowDeleteModal(true);
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

  const handleConfirmAction = async () => {
    try {
      if (deleteConfig.type === "DELETE_CASE") {
        await api.delete(`/casos/${deleteConfig.id}`);
        showToast("Caso eliminado exitosamente", "warning");
        setTimeout(() => navigate("/dashboard/casos"), 1500);
      } else if (deleteConfig.type === "CLOSE_CASE") {
        await api.put(`/casos/${deleteConfig.id}`, { estado: "cerrado" });
        showToast("Caso cerrado exitosamente", "success");
        cargarCaso();
      } else if (deleteConfig.type === "REOPEN_CASE") {
        await api.put(`/casos/${deleteConfig.id}`, { estado: "abierto" });
        showToast("Caso reabierto exitosamente", "success");
        cargarCaso();
      }
    } catch (err) {
      console.error("Error al ejecutar acción:", err);
      showToast("Error al procesar la acción", "error");
    } finally {
      setShowDeleteModal(false);
      setDeleteConfig({});
    }
  };
  const handleSaveDescripcion = async () => {
    if (!nuevaDescripcion.trim() || nuevaDescripcion === caso.descripcion) {
      setIsEditingDescripcion(false);
      setNuevaDescripcion(caso.descripcion);
      return;
    }

    try {
      await api.put(`/casos/${id}`, { descripcion: nuevaDescripcion.trim() });
      showToast("Descripción actualizada correctamente");
      setIsEditingDescripcion(false);
      cargarCaso(); // Recargar el caso
    } catch (err) {
      showToast("Error al actualizar la descripción", "error");
      setNuevaDescripcion(caso.descripcion);
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

  const handleVerDocumento = async (documento) => {
    try {
      showToast("Generando vista previa...", "info");

      const response = await api.get(
        `/documentos/${documento.id_documento}/descargar`,
        { responseType: "blob" }
      );

      // 1. Forzamos el tipo de contenido basándonos en la extensión si el header falla
      const extension = documento.nombre_archivo.split(".").pop().toLowerCase();
      let mimeType = response.headers["content-type"];

      if (extension === "pdf") mimeType = "application/pdf";
      if (["jpg", "jpeg", "png"].includes(extension))
        mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;

      // 2. Creamos el Blob con el tipo explícito
      const file = new Blob([response.data], { type: mimeType });

      // 3. Creamos la URL
      const fileURL = window.URL.createObjectURL(file);

      // 4. Abrimos la pestaña
      const win = window.open();
      if (win) {
        // Le damos un título a la pestaña y embebemos el archivo
        win.document.title = documento.nombre_archivo;

        // Creamos un elemento iframe que ocupe toda la nueva pestaña
        const iframe = win.document.createElement("iframe");
        iframe.src = fileURL;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.position = "fixed";
        iframe.style.inset = "0";

        win.document.body.style.margin = "0";
        win.document.body.appendChild(iframe);

        // Limpiamos la URL de memoria cuando la pestaña se cierre (opcional pero recomendado)
        win.onbeforeunload = () => window.URL.revokeObjectURL(fileURL);
      } else {
        showToast("El navegador bloqueó la ventana emergente", "error");
      }
    } catch (err) {
      console.error("Error al visualizar:", err);
      showToast("Error de conexión con el servidor", "error");
    }
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
      <div className="detail-header">
        <div className="title-section">
          <BackButton to="/dashboard/casos" text="Volver a casos" />

          <div className="editable-header">
            <div className="main-file-icon">
              <DocumentosIcon />
            </div>

            <div className="title-and-badge">
              <h1>Caso N°{caso.id_caso}</h1>
              <span
                className="estado-badge-large"
                style={{ backgroundColor: estadoBadge.color }}
              >
                {estadoBadge.text}
              </span>
            </div>
          </div>

          <span className="subtitle-detail">
            <CalendarIcon /> Inicio: {formatearFecha(caso.fecha_inicio)}
          </span>
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
        <h3>Acciones del Caso:</h3>
        <div className="estado-buttons">
          {caso.estado === "abierto" ? (
            <button
              className="btn-estado btn-cerrar"
              onClick={handleCerrarCaso}
            >
              Cerrar Caso
            </button>
          ) : (
            <button
              className="btn-estado btn-reabrir"
              onClick={handleReabrirCaso}
            >
              Reabrir Caso
            </button>
          )}
        </div>
      </div>

      {/* Grid principal */}
      <div className="detail-grid">
        {/* Descripción del caso */}
        {/* Descripción del caso - EDITABLE */}
        <div className="detail-card full-width">
          <div className="card-header">
            <h2>
              <DocumentosIcon /> Descripción del Caso
            </h2>
          </div>
          <div className="card-body">
            {isEditingDescripcion ? (
              <div className="edit-descripcion-container">
                <textarea
                  className="textarea-clean-edit"
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  autoFocus
                  rows={6}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsEditingDescripcion(false);
                      setNuevaDescripcion(caso.descripcion);
                    }
                  }}
                />
                <div className="edit-actions">
                  <button
                    onClick={handleSaveDescripcion}
                    className="btn-mini-save"
                    title="Guardar"
                  >
                    <SaveIcon /> Guardar
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingDescripcion(false);
                      setNuevaDescripcion(caso.descripcion);
                    }}
                    className="btn-mini-cancel"
                    title="Cancelar"
                  >
                    <Xicon /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="descripcion-completa descripcion-clickable"
                onClick={() => setIsEditingDescripcion(true)}
              >
                {caso.descripcion}
                <span className="icon-edit-inline">
                  <PencilIcon />
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Cliente */}
        <div className="detail-card">
          <div className="card-header">
            <h2>
              <ClientIcon /> Cliente
            </h2>
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
            <h2>
              <AbogadosIcon /> Abogado Asignado
            </h2>
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
            <h2>
              <DocumentosIcon /> Documentos ({caso.documentos?.length || 0})
            </h2>
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
                        <EyeIcon />
                      </button>
                      <button
                        className="item-action-btn btn-download"
                        onClick={() => handleDescargarDocumento(documento)}
                        title="Descargar"
                      >
                        <DownLoadIcon />
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

      {/* Modal de confirmación (Cerrar / Reabrir / Eliminar caso) */}
      <DeleteModal
        isOpen={showDeleteModal}
        title={
          deleteConfig.type === "DELETE_CASE"
            ? "¿Eliminar Caso?"
            : deleteConfig.type === "CLOSE_CASE"
            ? "¿Cerrar Caso?"
            : "¿Reabrir Caso?"
        }
        message={
          deleteConfig.type === "DELETE_CASE"
            ? "Esto eliminará el caso y sus archivos asociados. ¿Continuar?"
            : deleteConfig.type === "CLOSE_CASE"
            ? "El caso se cerrará y archivará. ¿Desea continuar?"
            : "El caso será reabierto y volverá a estar activo. ¿Desea continuar?"
        }
        confirmLabel={
          deleteConfig.type === "DELETE_CASE"
            ? "Eliminar Caso"
            : deleteConfig.type === "CLOSE_CASE"
            ? "Cerrar Caso"
            : "Reabrir Caso"
        }
        confirmVariant={
          deleteConfig.type === "DELETE_CASE"
            ? "danger"
            : deleteConfig.type === "CLOSE_CASE"
            ? "warning"
            : "success"
        }
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmAction}
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

export default CasoDetail;
