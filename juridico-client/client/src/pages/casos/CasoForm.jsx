import { useState, useEffect } from "react";
import api from "../../services/api";
import "./CasoForm.css";

const CasoForm = ({ caso, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    descripcion: "",
    estado: "abierto",
    fecha_inicio: "",
    id_cliente: "",
    id_abogado: "",
  });
  const [clientes, setClientes] = useState([]);
  const [abogados, setAbogados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (caso) {
      setFormData({
        descripcion: caso.descripcion || "",
        estado: caso.estado || "abierto",
        fecha_inicio: caso.fecha_inicio || "",
        id_cliente: caso.id_cliente || "",
        id_abogado: caso.id_abogado || "",
      });
    } else {
      // Para casos nuevos, establecer fecha de hoy
      const hoy = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({
        ...prev,
        fecha_inicio: hoy,
      }));
    }
  }, [caso]);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);

      const [clientesRes, abogadosRes] = await Promise.all([
        api.get("/clientes?limit=1000"),
        api.get("/abogados?limit=1000"),
      ]);

      setClientes(clientesRes.data.data || []);
      setAbogados(abogadosRes.data.data || []);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      showToast("Error al cargar clientes y abogados", "error");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    } else if (formData.descripcion.length < 20) {
      newErrors.descripcion =
        "La descripción debe tener al menos 20 caracteres";
    }

    if (!formData.id_cliente) {
      newErrors.id_cliente = "Debe seleccionar un cliente";
    }

    if (!formData.id_abogado) {
      newErrors.id_abogado = "Debe asignar un abogado al caso";
    }

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = "La fecha de inicio es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      if (caso) {
        await api.put(`/casos/${caso.id_caso}`, formData);
        showToast("Caso actualizado exitosamente", "success");
      } else {
        await api.post("/casos", formData);
        showToast("Caso creado exitosamente", "success");
      }

      onClose(true);
    } catch (err) {
      console.error("Error al guardar caso:", err);

      if (err.response?.data?.error) {
        showToast(err.response.data.error, "error");
      } else {
        showToast("Error al guardar el caso", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{caso ? "Editar Caso" : "Nuevo Caso"}</h2>
          <button
            className="btn-close-modal"
            onClick={() => onClose(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        {loadingData ? (
          <div className="loading-form">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-body">
              {/* Cliente */}
              <div className="form-group">
                <label htmlFor="id_cliente">
                  Cliente <span className="required">*</span>
                </label>
                <select
                  id="id_cliente"
                  name="id_cliente"
                  value={formData.id_cliente}
                  onChange={handleChange}
                  className={errors.id_cliente ? "input-error" : ""}
                  disabled={loading}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                      {cliente.nombre} {cliente.apellido} - {cliente.email}
                    </option>
                  ))}
                </select>
                {errors.id_cliente && (
                  <span className="error-text">{errors.id_cliente}</span>
                )}
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label htmlFor="descripcion">
                  Descripción del Caso <span className="required">*</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className={errors.descripcion ? "input-error" : ""}
                  disabled={loading}
                  placeholder="Describa el caso legal..."
                  rows="6"
                />
                {errors.descripcion && (
                  <span className="error-text">{errors.descripcion}</span>
                )}
              </div>

              {/* Abogado */}
              <div className="form-group">
                <label htmlFor="id_abogado">
                  Abogado Asignado <span className="required">*</span>
                </label>
                <select
                  id="id_abogado"
                  name="id_abogado"
                  value={formData.id_abogado}
                  onChange={handleChange}
                  className={errors.id_abogado ? "input-error" : ""}
                  disabled={loading}
                >
                  <option value="">Seleccionar abogado...</option>
                  {abogados.map((abogado) => (
                    <option key={abogado.id_abogado} value={abogado.id_abogado}>
                      {abogado.nombre} {abogado.apellido} -{" "}
                      {abogado.especialidad}
                    </option>
                  ))}
                </select>
                {errors.id_abogado && (
                  <span className="error-text">{errors.id_abogado}</span>
                )}
              </div>

              {/* Fecha Inicio */}
              <div className="form-group">
                <label htmlFor="fecha_inicio">
                  Fecha de Inicio <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="fecha_inicio"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className={errors.fecha_inicio ? "input-error" : ""}
                  disabled={loading}
                />
                {errors.fecha_inicio && (
                  <span className="error-text">{errors.fecha_inicio}</span>
                )}
              </div>

              {/* Estado */}
              <div className="form-group">
                <label htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="abierto">Abierto</option>
                  <option value="cerrado">Cerrado</option>
                </select>
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
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CasoForm;
