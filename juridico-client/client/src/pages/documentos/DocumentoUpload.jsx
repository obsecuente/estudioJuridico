import { useState, useEffect } from "react";
import api from "../../services/api";
import ModalFrame from "../../components/common/ModalFrame";
import CustomSelect from "../../components/common/CustomSelect";
import "./DocumentoUpload.css";
import { DocumentosIcon, UploadIcon } from "../../components/common/Icons";

const DocumentoUpload = ({ onClose, showToast, idCasoPredefinido = null }) => {
  const [archivo, setArchivo] = useState(null);
  const [casos, setCasos] = useState([]);
  const [idCaso, setIdCaso] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCasos, setLoadingCasos] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarCasos();
    if (idCasoPredefinido) {
      setIdCaso(idCasoPredefinido.toString());
    }
  }, [idCasoPredefinido]);

  const cargarCasos = async () => {
    try {
      setLoadingCasos(true);
      const response = await api.get("/casos?limit=1000&estado=abierto");
      setCasos(response.data.data || []);
    } catch (err) {
      console.error("Error al cargar casos:", err);
      showToast("Error al cargar los casos", "error");
    } finally {
      setLoadingCasos(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    setError("");
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleFileChange = (file) => {
    // Validar tamaño (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("El archivo es muy grande. Máximo 10MB.");
      return;
    }

    // Validar tipo de archivo
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de archivo no permitido.");
      return;
    }

    setArchivo(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!archivo) {
      setError("Debe seleccionar un archivo");
      return;
    }

    if (!idCaso) {
      setError("Debe seleccionar un caso");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("id_caso", idCaso);

      await api.post("/documentos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showToast("Documento subido exitosamente", "success");
      onClose(true);
    } catch (err) {
      console.error("Error al subir documento:", err);

      if (err.response?.data?.error) {
        showToast(err.response.data.error, "error");
      } else {
        showToast("Error al subir el documento", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame
      title={`${(<UploadIcon />)} Subir Documento`}
      onClose={onClose}
      className={"upload-modal"}
    >
      {loadingCasos ? (
        <div className="loading-form">
          <div className="spinner"></div>
          <p>Cargando casos...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-body">
            {/* Drop zone */}
            <div
              className={`drop-zone ${dragActive ? "active" : ""} ${
                archivo ? "has-file" : ""
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {archivo ? (
                <div className="file-preview">
                  <div className="file-icon">
                    <DocumentosIcon />
                  </div>
                  <div className="file-info">
                    <p className="file-name">{archivo.name}</p>
                    <p className="file-size">
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-remove-file"
                    onClick={() => setArchivo(null)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div className="drop-icon">
                    <DocumentosIcon />
                  </div>
                  <p className="drop-text">
                    Arrastrá el archivo acá o hacé click para seleccionar
                  </p>
                  <p className="drop-hint">
                    PDF, Word, Excel, Imágenes (Máx. 10MB)
                  </p>
                  <input
                    type="file"
                    id="file-input"
                    className="file-input"
                    onChange={handleFileInput}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  <label htmlFor="file-input" className="btn-select-file">
                    Seleccionar archivo
                  </label>
                </>
              )}
            </div>

            {error && <div className="error-message-upload">{error}</div>}

            {/* Caso */}
            <div className="form-group">
              <label htmlFor="id_caso">
                Caso asociado <span className="required">*</span>
              </label>
              <CustomSelect
                name="id_caso"
                options={[
                  { value: "", label: "Seleccionar caso..." },
                  ...casos.map((c) => ({
                    value: String(c.id_caso),
                    label: `#${c.id_caso} - ${c.cliente?.nombre || ""} ${
                      c.cliente?.apellido || ""
                    }`,
                  })),
                ]}
                value={idCaso ? String(idCaso) : ""}
                onChange={(val) => setIdCaso(val)}
                disabled={loading || idCasoPredefinido}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => onClose(false)}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !archivo || !idCaso}
            >
              {loading ? "Subiendo..." : "Subir Documento"}
            </button>
          </div>
        </form>
      )}
    </ModalFrame>
  );
};

export default DocumentoUpload;
