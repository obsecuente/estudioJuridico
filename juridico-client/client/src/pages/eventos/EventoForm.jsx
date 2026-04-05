import { useState, useEffect, useContext, useRef } from "react";
import api from "../../services/api";
import eventosService from "../../services/eventos.service";
import calculadoraService from "../../services/calculadora.service";
import ModalFrame from "../../components/common/ModalFrame";
import CustomSelect from "../../components/common/CustomSelect";
import { AuthContext } from "../../context/AuthContext";
import InfoDiasHabiles from "../../components/calculadora/InfoDiasHabiles";
import "./EventoForm.css";

const EventoForm = ({ evento, onClose, showToast }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    hora: "",
    tipo: "tarea",
    id_caso: "",
    id_cliente: "",
    ubicacion: "",
    recordatorio_dias: 0,
    jurisdiccion: "nacional"
  });

  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const debounceRef = useRef(null);

  // Alerta de feriado al seleccionar fecha (Corrección 4)
  useEffect(() => {
    if (!formData.fecha_inicio) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await calculadoraService.verificarFecha(
          formData.fecha_inicio,
          formData.jurisdiccion || "nacional"
        );
        if (!data.es_habil && data.motivo) {
          if (data.es_feria_judicial) {
            showToast(`\u26A0\uFE0F ${data.motivo} \u2014 El tribunal no tiene actividad en este per\u00EDodo`, "warning");
          } else {
            showToast(`\u26A0\uFE0F ${data.motivo} \u2014 Pod\u00E9s igualmente agendar, pero tribunales no funcionan ese d\u00EDa`, "warning");
          }
        }
      } catch (err) {
        // silencioso, no bloquea
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData.fecha_inicio, formData.jurisdiccion]);

  useEffect(() => {
    cargarSelects();
    if (evento) {
      let fechaStr = "";
      let horaStr = "";

      if (evento.fecha_inicio) {
        const fecha = new Date(evento.fecha_inicio);
        // Validar que la fecha sea válida antes de llamar a toISOString
        if (!isNaN(fecha.getTime())) {
          try {
            fechaStr = fecha.toISOString().split("T")[0];
            // Intentar sacar la hora del objeto fecha
            horaStr = fecha.toTimeString().split(" ")[0].substring(0, 5);
          } catch (e) {
            console.error("Error parseando fecha:", e);
          }
        }
      }

      // Si tenemos hora explícita en el objeto (hora_inicio), usamos esa preferentemente
      if (evento.hora_inicio) {
        // Asumiendo formato "HH:MM:SS" o similar
        horaStr = evento.hora_inicio.substring(0, 5);
      }

      setFormData({
        titulo: evento.titulo || "",
        descripcion: evento.descripcion || "",
        fecha_inicio: fechaStr,
        hora: horaStr,
        tipo: evento.tipo || "tarea",
        id_caso: evento.id_caso || "",
        id_cliente: evento.id_cliente || "",
        ubicacion: evento.ubicacion || "",
        recordatorio_dias: evento.recordatorio_dias || 0,
        jurisdiccion: evento.jurisdiccion || "nacional"
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
      const payload = {
        ...formData,
        fecha_inicio: formData.fecha_inicio,
        hora_inicio: formData.hora,
        recordatorio: (parseInt(formData.recordatorio_dias) || 0) * 1440, // De días a minutos para el backend
        id_caso: formData.id_caso ? parseInt(formData.id_caso) : null,
        id_cliente: formData.id_cliente ? parseInt(formData.id_cliente) : null,
        id_abogado: user?.id_abogado || null,
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

              {/* Selector de Jurisdicción */}
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label style={{ fontSize: '0.85em', color: '#94a3b8' }}>Jurisdicción para cálculo</label>
                <CustomSelect
                  name="jurisdiccion"
                  value={formData.jurisdiccion || 'nacional'}
                  options={[
                    { value: "nacional", label: "Fuero Nacional / Federal" },
                    { value: "neuquen", label: "Neuquén" },
                    { value: "rio_negro", label: "Río Negro" }
                  ]}
                  onChange={(val) => handleChange({ target: { name: 'jurisdiccion', value: val } })}
                />
              </div>

              {/* Componente de calculadora de días hábiles */}
              <InfoDiasHabiles
                fechaSeleccionada={formData.fecha_inicio}
                jurisdiccion={formData.jurisdiccion || 'nacional'}
              />
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
            <CustomSelect
              name="tipo"
              value={formData.tipo}
              options={[
                { value: "audiencia", label: "Audiencia" },
                { value: "reunion", label: "Reunión / Cita" },
                { value: "tarea", label: "Tarea" },
                { value: "otro", label: "Otro" }
              ]}
              onChange={(val) => handleChange({ target: { name: 'tipo', value: val } })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Caso (Opcional)</label>
              <CustomSelect
                name="id_caso"
                value={formData.id_caso}
                placeholder="-- Seleccionar Caso --"
                options={casos.map(c => ({
                  value: c.id_caso,
                  label: `${c.descripcion} ${c.numero_expediente ? `(${c.numero_expediente})` : ''}`
                }))}
                onChange={(val) => handleChange({ target: { name: 'id_caso', value: val } })}
              />
            </div>
            <div className="form-group">
              <label>Cliente (Opcional)</label>
              <CustomSelect
                name="id_cliente"
                value={formData.id_cliente}
                placeholder="-- Seleccionar Cliente --"
                options={clientes.map(c => ({
                  value: c.id_cliente,
                  label: `${c.nombre} ${c.apellido}`
                }))}
                onChange={(val) => handleChange({ target: { name: 'id_cliente', value: val } })}
              />
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
            <label>Recordatorio por email</label>
            <CustomSelect
              name="recordatorio_dias"
              value={formData.recordatorio_dias}
              options={[
                { value: 0, label: "Sin recordatorio" },
                { value: 1, label: "1 día antes" },
                { value: 2, label: "2 días antes" },
                { value: 3, label: "3 días antes" },
                { value: 4, label: "4 días antes" },
                { value: 5, label: "5 días antes" },
                { value: 6, label: "6 días antes" },
                { value: 7, label: "7 días antes" },
                { value: 8, label: "8 días antes" },
                { value: 9, label: "9 días antes" },
                { value: 10, label: "10 días antes" }
              ]}
              onChange={(val) => handleChange({ target: { name: 'recordatorio_dias', value: val } })}
            />
            <small style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, display: 'block' }}>
              📧 Recibirás un email de alerta en la fecha seleccionada
            </small>
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
