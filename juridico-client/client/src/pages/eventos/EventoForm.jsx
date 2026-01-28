import { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import eventosService from "../../services/eventos.service";
import ModalFrame from "../../components/common/ModalFrame";
import { AuthContext } from "../../context/AuthContext";
import "./EventoForm.css";

const EventoForm = ({ evento, onClose, showToast }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    hora: "",
    tipo: "TAREA",
    id_caso: "",
    id_cliente: "",
    ubicacion: "",
    recordatorio_dias: 0
  });

  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    cargarSelects();
    if (evento) {
        // Aseguramos formato de fecha y hora para inputs
        const fecha = new Date(evento.fecha_inicio);
        const fechaStr = fecha.toISOString().split('T')[0];
        // Extraer hora HH:MM de la fecha ISO o usar la hora guardada
        const horaStr = fecha.toTimeString().split(' ')[0].substring(0,5);

      setFormData({
        titulo: evento.titulo || "",
        descripcion: evento.descripcion || "",
        fecha_inicio: fechaStr,
        hora: horaStr,
        tipo: evento.tipo || "TAREA",
        id_caso: evento.id_caso || "",
        id_cliente: evento.id_cliente || "",
        ubicacion: evento.ubicacion || "",
        recordatorio_dias: evento.recordatorio_dias || 0
      });
    }
  }, [evento]);

  const cargarSelects = async () => {
      try {
          const [casosRes, clientesRes] = await Promise.all([
              api.get('/casos?limit=100'), // limit alto para select
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
    if (!formData.fecha_inicio) newErrors.fecha_inicio = "La fecha es obligatoria";
    if (!formData.hora) newErrors.hora = "La hora es obligatoria";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // Combinar fecha y hora
      const fechaCompleta = new Date(`${formData.fecha_inicio}T${formData.hora}:00`);
      
      const payload = {
          ...formData,
          fecha_inicio: fechaCompleta.toISOString(),
          // Limpiar strings vacíos
          id_caso: formData.id_caso || null,
          id_cliente: formData.id_cliente || null,
          // Si no hay id_abogado, el backend usa el del usuario (ver controlador)
      };

      if (evento) {
        await eventosService.update(evento.id_evento, payload);
        showToast("Evento actualizado exitosamente", "success");
      } else {
        await eventosService.create(payload);
        showToast("Evento creado exitosamente", "success");
      }

      onClose(true);
    } catch (err) {
      console.error("Error al guardar evento:", err);
      showToast(err.response?.data?.error || "Error al guardar el evento", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame
      title={evento ? "Editar Evento" : "Nuevo Evento"}
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
              placeholder="Ej: Audiencia Preliminar"
            />
            {errors.titulo && <span className="error-text">{errors.titulo}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
                <label>Fecha <span className="required">*</span></label>
                <input
                type="date"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                className={errors.fecha_inicio ? "input-error" : ""}
                />
                 {errors.fecha_inicio && <span className="error-text">{errors.fecha_inicio}</span>}
            </div>
            <div className="form-group">
                <label>Hora <span className="required">*</span></label>
                <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className={errors.hora ? "input-error" : ""}
                />
                 {errors.hora && <span className="error-text">{errors.hora}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <select name="tipo" value={formData.tipo} onChange={handleChange}>
                <option value="AUDIENCIA">Audiencia</option>
                <option value="REUNION">Reunión</option>
                <option value="TAREA">Tarea</option>
                <option value="CITA">Cita</option>
                <option value="OTRO">Otro</option>
            </select>
          </div>

          <div className="form-row">
             <div className="form-group">
                <label>Caso (Opcional)</label>
                <select name="id_caso" value={formData.id_caso} onChange={handleChange}>
                    <option value="">-- Seleccionar Caso --</option>
                    {casos.map(c => (
                        <option key={c.id_caso} value={c.id_caso}>{c.caratula} {c.numero_expediente ? `(${c.numero_expediente})` : ''}</option>
                    ))}
                </select>
             </div>
             <div className="form-group">
                <label>Cliente (Opcional)</label>
                <select name="id_cliente" value={formData.id_cliente} onChange={handleChange}>
                    <option value="">-- Seleccionar Cliente --</option>
                    {clientes.map(c => (
                        <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido}</option>
                    ))}
                </select>
             </div>
          </div>

          <div className="form-group">
            <label>Ubicación / Juzgado</label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Juzgado Civil Nº 3"
            />
          </div>

           <div className="form-group">
            <label>Recordatorio (Días antes)</label>
            <input
              type="number"
              name="recordatorio_dias"
              value={formData.recordatorio_dias}
              onChange={handleChange}
              min="0"
              max="30"
            />
          </div>

          <div className="form-group">
            <label>Notas / Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Detalles adicionales..."
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

export default EventoForm;
