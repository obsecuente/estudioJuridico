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
    tipo_vencimiento: "traslado",
    prioridad: "media",
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
        // Usar fecha_limite (backend) o fecha_vencimiento (legacy/frontend state)
        const fechaRaw = vencimiento.fecha_limite || vencimiento.fecha_vencimiento;
        
        let fechaStr = "";
        let horaStr = "09:00";

        if (fechaRaw) {
              // Asumimos que viene en ISO string Z (UTC)
              // Usamos split directamente para tomar los valores "visuales" que guardamos
              // fechaRaw ejemplo: "2026-01-30T09:00:00.000Z"
              try {
                const parts = fechaRaw.split('T');
                fechaStr = parts[0]; // 2026-01-30
                if (parts[1]) {
                    horaStr = parts[1].substring(0, 5); // 09:00, ignoramos segundos/milis
                }
              } catch (e) {
                  // Fallback por si no es ISO
                  const fecha = new Date(fechaRaw);
                  if (!isNaN(fecha)) {
                      fechaStr = fecha.toISOString().split('T')[0];
                      horaStr = fecha.toTimeString().substring(0, 5);
                  }
              }
        }

      setFormData({
        titulo: vencimiento.titulo || "",
        descripcion: vencimiento.descripcion || "",
        fecha_vencimiento: fechaStr,
        hora: horaStr,
        tipo_vencimiento: vencimiento.tipo_vencimiento || "traslado",
        prioridad: vencimiento.prioridad || "media",
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
    if (!formData.id_caso) newErrors.id_caso = "Debe seleccionar un caso";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // "UTC as Local" strategy: Construimos la fecha nosotros mismos como si fuera UTC
      // para que "09:00" en el form se guarde como "...T09:00:00.000Z" en la DB
      // y al leerlo de vuelta (UTC) obtengamos "09:00".
      const fechaLimiteISO = `${formData.fecha_vencimiento}T${formData.hora || "00:00"}:00.000Z`;

      const payload = {
          ...formData,
          fecha_limite: fechaLimiteISO,
          id_caso: formData.id_caso || null,
          id_cliente: formData.id_cliente || null,
          id_abogado: user?.id_abogado, // Agregar id_abogado del usuario logueado
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
    { value: "contestacion_demanda", label: "Contestación de Demanda" },
    { value: "apelacion", label: "Apelación" },
    { value: "recurso", label: "Recurso" },
    { value: "traslado", label: "Traslado" },
    { value: "ofrecimiento_prueba", label: "Ofrecimiento de Prueba " },
    { value: "alegato", label: "Alegato " },
    { value: "expresion_agravios", label: "Expresión de Agravios " },
    { value: "prescripcion", label: "Prescripción / Caducidad " },
    { value: "otro", label: "Otro" }
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
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>
            </div>
          </div>

          <div className="form-row">
             <div className="form-group">
                <label>Caso <span className="required">*</span></label>
                <select 
                  name="id_caso" 
                  value={formData.id_caso} 
                  onChange={handleChange}
                  className={errors.id_caso ? "input-error" : ""}
                >
                    <option value="">-- Seleccionar Caso --</option>
                    {casos.map(c => (
                        <option key={c.id_caso} value={c.id_caso}>{c.descripcion}</option>
                    ))}
                </select>
                {errors.id_caso && <span className="error-text">{errors.id_caso}</span>}
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
