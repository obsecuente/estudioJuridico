import { useState, useEffect } from "react";
import api from "../../services/api";
import "./ConsultaForm.css";

const ConsultaForm = ({ consulta, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    mensaje: "",
    estado: "pendiente",
    id_cliente: "",
    id_abogado_asignado: "",
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
    if (consulta) {
      setFormData({
        mensaje: consulta.mensaje || "",
        estado: consulta.estado || "pendiente",
        id_cliente: consulta.id_cliente || "",
        id_abogado_asignado: consulta.id_abogado_asignado || "",
      });
    }
  }, [consulta]);

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

    if (!formData.mensaje.trim()) {
      newErrors.mensaje = "El mensaje es obligatorio";
    } else if (formData.mensaje.length < 10) {
      newErrors.mensaje = "El mensaje debe tener al menos 10 caracteres";
    }

    if (!formData.id_cliente) {
      newErrors.id_cliente = "Debe seleccionar un cliente";
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
      const datosAEnviar = {
        ...formData,
        id_abogado_asignado: formData.id_abogado_asignado || null,
      };

      if (consulta) {
        await api.put(`/consultas/${consulta.id_consulta}`, datosAEnviar);
        showToast("Consulta actualizada exitosamente", "success");
      } else {
        await api.post("/consultas", datosAEnviar);
        showToast("Consulta creada exitosamente", "success");
      }

      onClose(true);
    } catch (err) {
      console.error("Error al guardar consulta:", err);

      if (err.response?.data?.error) {
        showToast(err.response.data.error, "error");
      } else {
        showToast("Error al guardar la consulta", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{consulta ? "Editar Consulta" : "Nueva Consulta"}</h2>
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
                      {cliente.nombre} {cliente.apellido}
                    </option>
                  ))}
                </select>
                {errors.id_cliente && (
                  <span className="error-text">{errors.id_cliente}</span>
                )}
              </div>

              {/* Mensaje */}
              <div className="form-group">
                <label htmlFor="mensaje">
                  Mensaje <span className="required">*</span>
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  className={errors.mensaje ? "input-error" : ""}
                  disabled={loading}
                  placeholder="Describa la consulta del cliente..."
                  rows="5"
                />
                {errors.mensaje && (
                  <span className="error-text">{errors.mensaje}</span>
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
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="resuelta">Resuelta</option>
                </select>
              </div>

              {/* Abogado */}
              <div className="form-group">
                <label htmlFor="id_abogado_asignado">Abogado Asignado</label>
                <select
                  id="id_abogado_asignado"
                  name="id_abogado_asignado"
                  value={formData.id_abogado_asignado}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Sin asignar</option>
                  {abogados.map((abogado) => (
                    <option key={abogado.id_abogado} value={abogado.id_abogado}>
                      {abogado.nombre} {abogado.apellido} -{" "}
                      {abogado.especialidad}
                    </option>
                  ))}
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

export default ConsultaForm;
