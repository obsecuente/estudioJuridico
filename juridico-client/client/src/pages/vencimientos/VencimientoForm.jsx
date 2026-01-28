import { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import vencimientosService from "../../services/vencimientos.service";
import ModalFrame from "../../components/common/ModalFrame";
import { AuthContext } from "../../context/AuthContext";
import "./VencimientoForm.css";

const VencimientoForm = ({ vencimiento, onClose, showToast }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_vencimiento: "",
    hora: "09:00", // Hora default
    tipo_vencimiento: "TRASLADO",
    prioridad: "MEDIA",
    id_caso: "",
    id_cliente: ""
  });

  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarSelects();
    if (vencimiento) {
        const fecha = new Date(vencimiento.fecha_vencimiento);
        const fechaStr = fecha.toISOString().split('T')[0];
        const horaStr = fecha.toTimeString().split(' ')[0].substring(0,5);

      setFormData({
        titulo: vencimiento.titulo || "",
        descripcion: vencimiento.descripcion || "",
        fecha_vencimiento: fechaStr,
        hora: horaStr,
        tipo_vencimiento: vencimiento.tipo_vencimiento || "TRASLADO",
        prioridad: vencimiento.prioridad || "MEDIA",
        id_caso: vencimiento.id_caso || "",
        id_cliente: vencimiento.id_cliente || ""
      });
    }
  }, [vencimiento]);

  const cargarSelects = async () => {
      try {
          const [casosRes, clientesRes] = await Promise.all([
              api.get('/casos?limit=100'),
              api.get('/clientes?limit=100')
          ]);
          setCasos(casosRes.data.data || []);
          setClientes(clientesRes.data.data || []);
      } catch (error) {
          console.error("Error cargando selects", error);
      }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validarFormulario = () => {
    const newErrors = {};
    if (!formData.titulo.trim()) newErrors.titulo = "El título es obligatorio";
    if (!formData.fecha_vencimiento) newErrors.fecha_vencimiento = "La fecha es obligatoria";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // Combinar fecha y hora
      const fechaCompleta = new Date(`${formData.fecha_vencimiento}T${formData.hora}:00`);
      
      const payload = {
          ...formData,
          fecha_vencimiento: fechaCompleta.toISOString(),
          id_caso: formData.id_caso || null,
          id_cliente: formData.id_cliente || null,
      };

      if (vencimiento) {
        await vencimientosService.update(vencimiento.id_vencimiento, payload);
        showToast("Vencimiento actualizado exitosamente", "success");
      } else {
        await vencimientosService.create(payload);
        showToast("Vencimiento creado exitosamente", "success");
      }

      onClose(true);
    } catch (err) {
      console.error("Error al guardar vencimiento:", err);
      showToast(err.response?.data?.error || "Error al guardar el vencimiento", "error");
    } finally {
      setLoading(false);
    }
  };

  const tiposVencimiento = [
    { value: "CONTESTACION_DEMANDA", label: "Contestación de Demanda (15 días)" },
    { value: "APELACION", label: "Apelación (5 días)" },
    { value: "RECURSO", label: "Recurso (5 días)" },
    { value: "TRASLADO", label: "Traslado (5 días)" },
    { value: "OFRECIMIENTO_PRUEBA", label: "Ofrecimiento de Prueba (10 días)" },
    { value: "ALEGATO", label: "Alegato (6 días)" },
    { value: "EXPRESION_AGRAVIOS", label: "Expresión de Agravios (10 días)" },
    { value: "PRESCRIPCION", label: "Prescripción / Caducidad (30 días)" },
    { value: "OTRO", label: "Otro" }
  ];

  return (
    <ModalFrame
      title={vencimiento ? "Editar Vencimiento" : "Nuevo Vencimiento"}
      onClose={() => onClose(false)}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-body">
          <div className="form-group">
            <label>Título <span className="required">*</span></label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className={errors.titulo ? "input-error" : ""}
              placeholder="Ej: Vencimiento Contestación"
            />
            {errors.titulo && <span className="error-text">{errors.titulo}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
                <label>Fecha Vencimiento <span className="required">*</span></label>
                <input
                type="date"
                name="fecha_vencimiento"
                value={formData.fecha_vencimiento}
                onChange={handleChange}
                className={errors.fecha_vencimiento ? "input-error" : ""}
                />
                 {errors.fecha_vencimiento && <span className="error-text">{errors.fecha_vencimiento}</span>}
            </div>
            <div className="form-group">
                <label>Hora Vencimiento</label>
                <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
                <label>Tipo Procesal</label>
                <select name="tipo_vencimiento" value={formData.tipo_vencimiento} onChange={handleChange}>
                    {tiposVencimiento.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Prioridad</label>
                <select name="prioridad" value={formData.prioridad} onChange={handleChange}>
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                </select>
            </div>
          </div>

          <div className="form-row">
             <div className="form-group">
                <label>Caso (Recomendado)</label>
                <select name="id_caso" value={formData.id_caso} onChange={handleChange}>
                    <option value="">-- Seleccionar Caso --</option>
                    {casos.map(c => (
                        <option key={c.id_caso} value={c.id_caso}>{c.caratula}</option>
                    ))}
                </select>
             </div>
             <div className="form-group">
                <label>Cliente</label>
                <select name="id_cliente" value={formData.id_cliente} onChange={handleChange}>
                    <option value="">-- Seleccionar Cliente --</option>
                    {clientes.map(c => (
                        <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>
                    ))}
                </select>
             </div>
          </div>

          <div className="form-group">
            <label>Notas Adicionales</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Detalles sobre el plazo procesal..."
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
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
};

export default VencimientoForm;
