import { useState, useEffect } from "react";
import api from "../../services/api";
import ModalFrame from "../../components/common/ModalFrame";
import CustomSelect from "../../components/common/CustomSelect";
import "./CasoForm.css";

const CasoForm = ({ caso, clienteId, onClose, showToast }) => {
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
      const hoy = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({
        ...prev,
        fecha_inicio: hoy,
        id_cliente: clienteId ? String(clienteId) : "",
      }));
    }
  }, [caso, clienteId]);

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
      showToast("Error al cargar datos", "error");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    const newErrors = {};
    if (!formData.descripcion.trim()) newErrors.descripcion = "Obligatorio";
    if (!formData.id_cliente) newErrors.id_cliente = "Seleccione cliente";
    if (!formData.id_abogado) newErrors.id_abogado = "Asigne abogado";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setLoading(true);
    try {
      if (caso) {
        await api.put(`/casos/${caso.id_caso}`, formData);
        showToast("Caso actualizado", "success");
      } else {
        await api.post("/casos", formData);
        showToast("Caso creado", "success");
      }
      onClose(true); // Refresca la lista de expedientes
    } catch (err) {
      showToast("Error al guardar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame
      title={caso ? "Editar Caso" : "Nuevo Caso"}
      onClose={() => onClose(false)}
    >
      {loadingData ? (
        <div className="loading-form">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-body">
            <div className="form-group">
              <label>
                Cliente <span className="required">*</span>
              </label>
              <CustomSelect
                name="id_cliente"
                options={[
                  { value: "", label: "Seleccionar..." },
                  ...clientes.map((c) => ({
                    value: String(c.id_cliente),
                    label: `${c.nombre} ${c.apellido}`,
                  })),
                ]}
                value={formData.id_cliente}
                onChange={(val) =>
                  setFormData((p) => ({ ...p, id_cliente: val }))
                }
                disabled={loading || !!clienteId}
              />
            </div>
            <div className="form-group">
              <label>
                Descripción del Caso <span className="required">*</span>
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="5"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>
                Abogado Asignado <span className="required">*</span>
              </label>
              <CustomSelect
                name="id_abogado"
                options={[
                  { value: "", label: "Seleccionar..." },
                  ...abogados.map((a) => ({
                    value: String(a.id_abogado),
                    label: `${a.nombre} ${a.apellido}`,
                  })),
                ]}
                value={formData.id_abogado}
                onChange={(val) =>
                  setFormData((p) => ({ ...p, id_abogado: val }))
                }
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Fecha de Inicio</label>
              <input
                type="date"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => onClose(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              Guardar Caso
            </button>
          </div>
        </form>
      )}
    </ModalFrame>
  );
};

export default CasoForm;
