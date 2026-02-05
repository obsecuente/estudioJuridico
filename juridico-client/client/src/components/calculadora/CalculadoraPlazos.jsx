import { useState } from "react";
import calculadoraService from "../../services/calculadora.service";
import ResultadoCalculadora from "./ResultadoCalculadora";
import CustomSelect from "../common/CustomSelect";
import "./CalculadoraPlazos.css";

const CalculadoraPlazos = ({ onResultado }) => {
  const [formData, setFormData] = useState({
    fecha_notificacion: "",
    fuero: "civil",
    tipo_plazo: "contestacion_demanda_civil",
    dias_plazo: 15,
    jurisdiccion: "neuquen",
    incluir_plazo_gracia: false,
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tiposPlazo = {
    civil: [
      { codigo: "contestacion_demanda_civil", nombre: "Contestación de Demanda", dias: 15, legal: "Art. 338 CPCCN" },
      { codigo: "apelacion_civil", nombre: "Apelación (sentencia definitiva)", dias: 5, legal: "Art. 244 CPCCN" },
      { codigo: "expresion_agravios_civil", nombre: "Expresión de Agravios", dias: 10, legal: "Art. 259 CPCCN" },
      { codigo: "replica_agravios_civil", nombre: "Réplica Expresión de Agravios", dias: 10, legal: "Art. 259 CPCCN" },
      { codigo: "alegatos_civil", nombre: "Alegatos", dias: 6, legal: "Art. 482 CPCCN" },
      { codigo: "traslado_generico_civil", nombre: "Traslado Genérico", dias: 5, legal: "Art. 138 CPCCN" },
      { codigo: "recurso_extraordinario", nombre: "Recurso Extraordinario Federal", dias: 10, legal: "Ley 48" },
      { codigo: "revocatoria", nombre: "Recurso de Revocatoria", dias: 3, legal: "Art. 238 CPCCN" },
      { codigo: "reposicion", nombre: "Recurso de Reposición", dias: 3, legal: "Art. 239 CPCCN" },
      { codigo: "nulidad", nombre: "Recurso de Nulidad", dias: 5, legal: "Art. 253 CPCCN" },
      { codigo: "aclaratoria", nombre: "Aclaratoria de Sentencia", dias: 3, legal: "Art. 166 CPCCN" },
      { codigo: "ofrecimiento_prueba", nombre: "Ofrecimiento de Prueba", dias: 10, legal: "Art. 367 CPCCN" },
      { codigo: "oposicion_prueba", nombre: "Oposición a la Prueba", dias: 5, legal: "Art. 373 CPCCN" },
      { codigo: "oposicion_embargo", nombre: "Oposición al Embargo", dias: 5, legal: "Art. 198 CPCCN" },
      { codigo: "levantamiento_embargo", nombre: "Levantamiento de Embargo", dias: 5, legal: "Art. 206 CPCCN" },
      { codigo: "excepciones_previas", nombre: "Excepciones Previas", dias: 10, legal: "Art. 346 CPCCN" },
      { codigo: "contestacion_excepciones", nombre: "Contestación Excepciones", dias: 5, legal: "Art. 350 CPCCN" },
      { codigo: "oposicion_ejecucion", nombre: "Oposición de Excepciones (Ejecutivo)", dias: 5, legal: "Art. 544 CPCCN" },
      { codigo: "demanda_sumario", nombre: "Contestación Demanda (Juicio Sumario)", dias: 5, legal: "Art. 498 CPCCN" },
      { codigo: "demanda_sumarisimo", nombre: "Contestación Demanda (Sumarísimo)", dias: 3, legal: "Art. 498 CPCCN" },
    ],
    laboral: [
      { codigo: "contestacion_demanda_laboral", nombre: "Contestación de Demanda", dias: 10, legal: "Ley 18.345" },
      { codigo: "apelacion_laboral", nombre: "Apelación", dias: 5, legal: "Ley 18.345" },
      { codigo: "expresion_agravios_laboral", nombre: "Expresión de Agravios", dias: 10, legal: "Ley 18.345" },
      { codigo: "prueba_laboral", nombre: "Ofrecimiento de Prueba", dias: 10, legal: "Ley 18.345" },
      { codigo: "alegatos_laboral", nombre: "Alegatos", dias: 5, legal: "Ley 18.345" },
    ],
    familia: [
      { codigo: "contestacion_familia", nombre: "Contestación de Demanda", dias: 15, legal: "Según jurisdicción" },
      { codigo: "apelacion_familia", nombre: "Apelación", dias: 5, legal: "Según jurisdicción" },
    ],
    penal: [
      { codigo: "apelacion_penal", nombre: "Apelación", dias: 3, legal: "CPPN" },
      { codigo: "casacion", nombre: "Recurso de Casación", dias: 10, legal: "Art. 459 CPPN" },
    ],
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "fuero") {
      const nuevoFuero = value;
      const primerTipo = tiposPlazo[nuevoFuero][0];
      setFormData({
        ...formData,
        fuero: nuevoFuero,
        tipo_plazo: primerTipo.codigo,
        dias_plazo: primerTipo.dias,
      });
    } else if (name === "tipo_plazo") {
      const tipoSeleccionado = tiposPlazo[formData.fuero].find(t => t.codigo === value);
      setFormData({
        ...formData,
        tipo_plazo: value,
        dias_plazo: tipoSeleccionado.dias,
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }

    setResultado(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fecha_notificacion) {
      setError("Debes ingresar la fecha de notificación");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await calculadoraService.calcularPlazo({
        fecha_notificacion: formData.fecha_notificacion,
        dias_plazo: formData.dias_plazo,
        jurisdiccion: formData.jurisdiccion,
        incluir_plazo_gracia: formData.incluir_plazo_gracia,
      });

      setResultado(data);
    } catch (err) {
      console.error("Error al calcular plazo:", err);
      setError(err.response?.data?.error || "Error al calcular el plazo");
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoCalculo = () => {
    setResultado(null);
    setFormData({
      fecha_notificacion: "",
      fuero: "civil",
      tipo_plazo: "contestacion_demanda_civil",
      dias_plazo: 15,
      jurisdiccion: "neuquen",
      incluir_plazo_gracia: false,
    });
  };

  const tipoActual = tiposPlazo[formData.fuero].find(t => t.codigo === formData.tipo_plazo);

  if (resultado) {
    return (
      <ResultadoCalculadora
        resultado={resultado}
        onNuevoCalculo={handleNuevoCalculo}
        onResultado={onResultado}
      />
    );
  }

  return (
    <div className="calculadora-container glass-card">
      <div className="calculadora-header">
        <h1>⚖️ Calculadora de Plazos</h1>
        <p>Determinación automática de vencimientos judiciales</p>
      </div>

      <form onSubmit={handleSubmit} className="calculadora-form-premium">
        <div className="paso-card">
          <div className="paso-header">
            <span className="paso-badge">PASO 1</span>
            <h3>Notificación</h3>
          </div>
          <div className="form-group">
            <label>Fecha de notificación</label>
            <input
              type="date"
              name="fecha_notificacion"
              value={formData.fecha_notificacion}
              onChange={handleChange}
              required
              className="premium-input"
            />
            <small className="help-text">El plazo computa a partir del día hábil siguiente</small>
          </div>
        </div>

        <div className="paso-card">
          <div className="paso-header">
            <span className="paso-badge">PASO 2</span>
            <h3>Parámetros Procesales</h3>
          </div>
          <div className="form-group">
            <label>Fuero</label>
            <div className="radio-group-premium">
              {["civil", "laboral", "familia", "penal"].map(f => (
                <label key={f} className={`radio-item ${formData.fuero === f ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="fuero"
                    value={f}
                    checked={formData.fuero === f}
                    onChange={handleChange}
                  />
                  <span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Tipo de plazo</label>
            <CustomSelect
              name="tipo_plazo"
              value={formData.tipo_plazo}
              options={tiposPlazo[formData.fuero].map(t => ({ value: t.codigo, label: t.nombre }))}
              onChange={(val) => handleChange({ target: { name: 'tipo_plazo', value: val } })}
            />
            {tipoActual && (
              <div className="plazo-legal-info">
                <span><span className="gold-text">{tipoActual.dias}</span> días hábiles</span>
                <span className="legal-citation">{tipoActual.legal}</span>
              </div>
            )}
          </div>
        </div>

        <div className="paso-card">
          <div className="paso-header">
            <span className="paso-badge">PASO 3</span>
            <h3>Jurisdicción</h3>
          </div>
          <div className="form-group">
            <div className="radio-group-premium">
              {[
                { id: "nacional", label: "Nacional / Fed." },
                { id: "neuquen", label: "Neuquén" },
                { id: "rio_negro", label: "Río Negro" }
              ].map(j => (
                <label key={j.id} className={`radio-item ${formData.jurisdiccion === j.id ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="jurisdiccion"
                    value={j.id}
                    checked={formData.jurisdiccion === j.id}
                    onChange={handleChange}
                  />
                  <span>{j.label}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.jurisdiccion === "nacional" && (
            <div className="form-group checkbox-premium">
              <label className="checkbox-premium-label">
                <input
                  type="checkbox"
                  name="incluir_plazo_gracia"
                  checked={formData.incluir_plazo_gracia}
                  onChange={handleChange}
                  className="premium-checkbox"
                />
                <span className="checkbox-custom"></span>
                <span className="label-text">Habilitar plazo de gracia (2 primeras horas)</span>
              </label>
            </div>
          )}
        </div>

        {error && <div className="error-alert">⚠️ {error}</div>}

        <div className="form-actions-premium">
          <button type="submit" className="btn-nuevo" disabled={loading} style={{ width: '100%', justifyContent: 'center', fontSize: '16px' }}>
            {loading ? "PROCESANDO..." : "CALCULAR VENCIMIENTO"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CalculadoraPlazos;
