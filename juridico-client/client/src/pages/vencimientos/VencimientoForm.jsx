import { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import vencimientosService from "../../services/vencimientos.service";
import calculadoraService from "../../services/calculadora.service";
import ModalFrame from "../../components/common/ModalFrame";
import CustomSelect from "../../components/common/CustomSelect";
import { AuthContext } from "../../context/AuthContext";
import { AlarmIcon, CalculatorIcon, PencilIcon, CheckIcon, Xicon } from "../../components/common/Icons";
import "./VencimientoForm.css";

const tiposPlazo = {
  civil: [
    { codigo: "contestacion_demanda_civil", nombre: "Contestación de Demanda", backend_slug: "contestacion_demanda", dias: 15, legal: "Art. 338 CPCCN" },
    { codigo: "apelacion_civil", nombre: "Apelación (sentencia definitiva)", backend_slug: "apelacion", dias: 5, legal: "Art. 244 CPCCN" },
    { codigo: "expresion_agravios_civil", nombre: "Expresión de Agravios", backend_slug: "expresion_agravios", dias: 10, legal: "Art. 259 CPCCN" },
    { codigo: "replica_agravios_civil", nombre: "Réplica Expresión de Agravios", backend_slug: "traslado", dias: 10, legal: "Art. 259 CPCCN" },
    { codigo: "alegatos_civil", nombre: "Alegatos", backend_slug: "alegato", dias: 6, legal: "Art. 482 CPCCN" },
    { codigo: "traslado_generico_civil", nombre: "Traslado Genérico", backend_slug: "traslado", dias: 5, legal: "Art. 138 CPCCN" },
    { codigo: "recurso_extraordinario", nombre: "Recurso Extraordinario Federal", backend_slug: "recurso", dias: 10, legal: "Ley 48" },
    { codigo: "revocatoria", nombre: "Recurso de Revocatoria", backend_slug: "recurso", dias: 3, legal: "Art. 238 CPCCN" },
    { codigo: "reposicion", nombre: "Recurso de Reposición", backend_slug: "recurso", dias: 3, legal: "Art. 239 CPCCN" },
    { codigo: "nulidad", nombre: "Recurso de Nulidad", backend_slug: "recurso", dias: 5, legal: "Art. 253 CPCCN" },
    { codigo: "aclaratoria", nombre: "Aclaratoria de Sentencia", backend_slug: "ofrecimiento_prueba", dias: 3, legal: "Art. 166 CPCCN" }, // Mapeado a prueba o recurso segun criterio
    { codigo: "ofrecimiento_prueba", nombre: "Ofrecimiento de Prueba", backend_slug: "ofrecimiento_prueba", dias: 10, legal: "Art. 367 CPCCN" },
    { codigo: "oposicion_prueba", nombre: "Oposición a la Prueba", backend_slug: "traslado", dias: 5, legal: "Art. 373 CPCCN" },
    { codigo: "oposicion_embargo", nombre: "Oposición al Embargo", backend_slug: "recurso", dias: 5, legal: "Art. 198 CPCCN" },
    { codigo: "levantamiento_embargo", nombre: "Levantamiento de Embargo", backend_slug: "otro", dias: 5, legal: "Art. 206 CPCCN" },
    { codigo: "excepciones_previas", nombre: "Excepciones Previas", backend_slug: "contestacion_demanda", dias: 10, legal: "Art. 346 CPCCN" },
    { codigo: "contestacion_excepciones", nombre: "Contestación Excepciones", backend_slug: "contestacion_demanda", dias: 5, legal: "Art. 350 CPCCN" },
    { codigo: "oposicion_ejecucion", nombre: "Oposición de Excepciones (Ejecutivo)", backend_slug: "contestacion_demanda", dias: 5, legal: "Art. 544 CPCCN" },
    { codigo: "demanda_sumario", nombre: "Contestación Demanda (Juicio Sumario)", backend_slug: "contestacion_demanda", dias: 5, legal: "Art. 498 CPCCN" },
    { codigo: "demanda_sumarisimo", nombre: "Contestación Demanda (Sumarísimo)", backend_slug: "contestacion_demanda", dias: 3, legal: "Art. 498 CPCCN" },
  ],
  laboral: [
    { codigo: "contestacion_demanda_laboral", nombre: "Contestación de Demanda", backend_slug: "contestacion_demanda", dias: 10, legal: "Ley 18.345" },
    { codigo: "apelacion_laboral", nombre: "Apelación", backend_slug: "apelacion", dias: 5, legal: "Ley 18.345" },
    { codigo: "expresion_agravios_laboral", nombre: "Expresión de Agravios", backend_slug: "expresion_agravios", dias: 10, legal: "Ley 18.345" },
    { codigo: "prueba_laboral", nombre: "Ofrecimiento de Prueba", backend_slug: "ofrecimiento_prueba", dias: 10, legal: "Ley 18.345" },
    { codigo: "alegatos_laboral", nombre: "Alegatos", backend_slug: "alegato", dias: 5, legal: "Ley 18.345" },
  ],
  familia: [
    { codigo: "contestacion_familia", nombre: "Contestación de Demanda", backend_slug: "contestacion_demanda", dias: 15, legal: "Según jurisdicción" },
    { codigo: "apelacion_familia", nombre: "Apelación", backend_slug: "apelacion", dias: 5, legal: "Según jurisdicción" },
  ],
  penal: [
    { codigo: "apelacion_penal", nombre: "Apelación", backend_slug: "apelacion", dias: 3, legal: "CPPN" },
    { codigo: "casacion", nombre: "Recurso de Casación", backend_slug: "recurso", label: "Art. 459 CPPN", legal: "Art. 459 CPPN" },
  ],
};

const VencimientoForm = ({ vencimiento, onClose, showToast }) => {
  const { user } = useContext(AuthContext);

  // Estado principal del formulario
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_vencimiento: "",
    hora: "09:00",
    tipo_vencimiento: "traslado",
    prioridad: "media",
    id_caso: "",
    id_cliente: "",
    jurisdiccion: "nacional",
    recordatorio_dias: 3
  });

  // Estado del método de ingreso
  const [metodoIngreso, setMetodoIngreso] = useState(vencimiento ? "manual" : "calculadora");

  // Estado para la calculadora interna
  const [calcData, setCalcData] = useState({
    fecha_notificacion: "",
    fuero: "civil",
    tipo_plazo: "contestacion_demanda_civil",
    jurisdiccion: "nacional",
    incluir_plazo_gracia: false,
    localidad: "",
  });

  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Override judicial (Corrección 3)
  const [overrideJuez, setOverrideJuez] = useState(false);
  const [diasOverride, setDiasOverride] = useState("");
  const [diasCustom, setDiasCustom] = useState(null); // override de días por dictatoria en sección calculadora

  // opciones de ciudad por jurisdiccion
  const ciudadesPorJurisdiccion = {
    neuquen: [
      { value: "neuquen_capital", label: "Neuquén Capital" },
      { value: "zapala", label: "Zapala" },
    ],
    rio_negro: [
      { value: "general_roca", label: "General Roca" },
      { value: "viedma", label: "Viedma" },
      { value: "bariloche", label: "Bariloche" },
      { value: "cipolletti", label: "Cipolletti" },
    ],
  };

  const mostrarCiudadCalc = calcData.jurisdiccion === "neuquen" || calcData.jurisdiccion === "rio_negro";

  // Ley 3551 — ocultar plazo de gracia para Neuquen post agosto 2026
  const ocultarPlazoGracia =
    calcData.jurisdiccion === "neuquen" &&
    calcData.fecha_notificacion >= "2026-08-01";

  const mostrarCheckboxGracia =
    (calcData.jurisdiccion === "nacional" || calcData.jurisdiccion === "rio_negro") ||
    (calcData.jurisdiccion === "neuquen" && !ocultarPlazoGracia);

  useEffect(() => {
    cargarSelects();
    if (vencimiento) {
      const fechaRaw = vencimiento.fecha_limite || vencimiento.fecha_vencimiento;
      let fechaStr = "";
      let horaStr = "09:00";

      if (fechaRaw) {
        try {
          const parts = fechaRaw.split('T');
          fechaStr = parts[0];
          if (parts[1]) {
            horaStr = parts[1].substring(0, 5);
          }
        } catch (e) {
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
        id_cliente: vencimiento.id_cliente || "",
        jurisdiccion: vencimiento.jurisdiccion || "nacional",
        recordatorio_dias: vencimiento.recordatorio_dias || 3
      });
    }
  }, [vencimiento]);

  // Efecto para autocalcular cuando cambian los datos de la calculadora
  useEffect(() => {
    if (metodoIngreso === "calculadora" && calcData.fecha_notificacion) {
      ejecutarCalculoInterno();
    }
  }, [calcData, metodoIngreso]);

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
  };

  const ejecutarCalculoInterno = async (diasEspecificos = null) => {
    const tipoActual = tiposPlazo[calcData.fuero].find(t => t.codigo === calcData.tipo_plazo);
    if (!tipoActual) return;

    const diasParaCalcular = diasEspecificos !== null ? diasEspecificos : (diasCustom || tipoActual.dias);

    setCalcLoading(true);
    try {
      const data = await calculadoraService.calcularPlazo({
        fecha_notificacion: calcData.fecha_notificacion,
        dias_plazo: diasParaCalcular,
        jurisdiccion: calcData.jurisdiccion,
        incluir_plazo_gracia: ocultarPlazoGracia ? false : calcData.incluir_plazo_gracia,
        localidad: calcData.localidad || null,
      });

      setCalcResult(data);
      // solo autocompletar fecha si no hay override activo
      if (!overrideJuez) {
        setFormData(prev => ({
          ...prev,
          fecha_vencimiento: data.fecha_vencimiento,
          tipo_vencimiento: tipoActual.backend_slug
        }));
      }
    } catch (err) {
      console.error("Error en calculo interno:", err);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCalcChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "fuero") {
      const primerTipo = tiposPlazo[value][0];
      setCalcData(prev => ({
        ...prev,
        fuero: value,
        tipo_plazo: primerTipo.codigo
      }));
      setDiasCustom(null);
    } else if (name === "jurisdiccion") {
      setCalcData(prev => ({
        ...prev,
        jurisdiccion: value,
        localidad: "",
        incluir_plazo_gracia: false,
      }));
    } else {
      setCalcData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
      if (name === "tipo_plazo") setDiasCustom(null);
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
      const fechaLimiteISO = `${formData.fecha_vencimiento}T${formData.hora || "00:00"}:00.000Z`;

      const payload = {
        ...formData,
        fecha_limite: fechaLimiteISO,
        dias_alerta: parseInt(formData.recordatorio_dias) || 3,
        id_caso: formData.id_caso || null,
        id_cliente: formData.id_cliente || null,
        id_abogado: user?.id_abogado,
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

  return (
    <ModalFrame
      title={vencimiento ? "Editar Vencimiento" : "Nuevo Vencimiento"}
      onClose={() => onClose(false)}
    >
      <form onSubmit={handleSubmit} className="vencimiento-form-premium">
        <div className="form-body">
          {/* Título Principal */}
          <div className="form-group section-divider">
            <label className="premium-label">Título del Vencimiento <span className="required">*</span></label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className={`premium-input ${errors.titulo ? "input-error" : ""}`}
              placeholder="Ej: Contestar demanda Pérez"
            />
            {errors.titulo && <span className="error-text">{errors.titulo}</span>}
          </div>

          <div className="metodo-seleccion-premium">
            <label className="premium-label">¿Cómo querés ingresar la fecha?</label>
            <div className="radio-group-horizontal">
              <label className={`radio-pill ${metodoIngreso === 'calculadora' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="metodoIngreso"
                  value="calculadora"
                  checked={metodoIngreso === 'calculadora'}
                  onChange={() => setMetodoIngreso('calculadora')}
                />
                <span className="dot"></span>
                <span>Calcular desde notificación</span>
              </label>
              <label className={`radio-pill ${metodoIngreso === 'manual' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="metodoIngreso"
                  value="manual"
                  checked={metodoIngreso === 'manual'}
                  onChange={() => setMetodoIngreso('manual')}
                />
                <span className="dot"></span>
                <span>Ya sé la fecha / Manual</span>
              </label>
            </div>
          </div>

          {/* Sección CALCULADORA INLINE */}
          {metodoIngreso === 'calculadora' && (
            <div className="calculadora-inline-card glass-card">
              <div className="calc-inline-grid">
                <div className="form-group">
                  <label>Fecha de notificación</label>
                  <input
                    type="date"
                    name="fecha_notificacion"
                    value={calcData.fecha_notificacion}
                    onChange={handleCalcChange}
                    className="premium-input-small"
                  />
                </div>
                <div className="form-group">
                  <label>Fuero</label>
                  <CustomSelect
                    options={[
                      { value: 'civil', label: 'Civil' },
                      { value: 'laboral', label: 'Laboral' },
                      { value: 'familia', label: 'Familia' },
                      { value: 'penal', label: 'Penal' },
                    ]}
                    value={calcData.fuero}
                    onChange={(val) => handleCalcChange({ target: { name: 'fuero', value: val } })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tipo de Plazo</label>
                <CustomSelect
                  options={tiposPlazo[calcData.fuero].map(t => ({ value: t.codigo, label: t.nombre }))}
                  value={calcData.tipo_plazo}
                  onChange={(val) => handleCalcChange({ target: { name: 'tipo_plazo', value: val } })}
                />

                {(() => {
                  const tipoActual = tiposPlazo[calcData.fuero].find(t => t.codigo === calcData.tipo_plazo);
                  if (!tipoActual) return null;
                  return (
                    <div className="plazo-legal-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '10px', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px', borderLeft: '3px solid #d4af37', color: '#fff', fontSize: '13px' }}>
                      {diasCustom ? (
                        <>
                          <span>
                            <span className="gold-text" style={{ textDecoration: 'line-through', opacity: 0.5, color: '#d4af37', fontWeight: 'bold' }}>{tipoActual.dias}</span>
                            {' \u2192 '}
                            <input
                              type="number"
                              value={diasCustom}
                              onChange={e => setDiasCustom(parseInt(e.target.value) || "")}
                              min="1"
                              style={{ width: '50px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '4px', color: '#f59e0b', textAlign: 'center', padding: '2px 4px', fontWeight: 'bold', fontSize: '0.95em' }}
                            />
                            {' días hábiles (dictatoria)'}
                          </span>
                          <span className="legal-citation" style={{ color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', fontWeight: 500 }}>{tipoActual.legal}</span>
                          <button
                            type="button"
                            onClick={() => ejecutarCalculoInterno(diasCustom)}
                            title="Confirmar y calcular"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', padding: '2px 4px', color: '#10b981' }}
                          >
                            <CheckIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDiasCustom(null); ejecutarCalculoInterno(tipoActual.dias); }}
                            title="Cancelar y volver a días predeterminados"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1em', padding: '2px 4px', color: '#ef4444', opacity: 0.8 }}
                          >
                            <Xicon />
                          </button>
                        </>
                      ) : (
                        <>
                          <span><span className="gold-text" style={{ color: '#d4af37', fontWeight: 'bold' }}>{tipoActual.dias}</span> días hábiles</span>
                          <span className="legal-citation" style={{ color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', fontWeight: 500 }}>{tipoActual.legal}</span>
                          <button
                            type="button"
                            onClick={() => setDiasCustom(tipoActual.dias)}
                            title="Editar días (dictatoria del juez)"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1em', padding: '2px 4px', color: '#64748b', opacity: 0.8 }}
                          >
                            <PencilIcon />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="calc-inline-grid">
                <div className="form-group">
                  <label>Jurisdicción</label>
                  <CustomSelect
                    options={[
                      { value: 'nacional', label: 'Nacional' },
                      { value: 'neuquen', label: 'Neuquén' },
                      { value: 'rio_negro', label: 'Río Negro' },
                    ]}
                    value={calcData.jurisdiccion}
                    onChange={(val) => handleCalcChange({ target: { name: 'jurisdiccion', value: val } })}
                  />
                </div>
                {calcResult && (
                  <div className="calc-inline-result">
                    <div className="result-main">
                      <span className="check-v">✅</span>
                      <div className="result-texts">
                        <span className="vence-label">VENCE EL:</span>
                        <span className="vence-date">{new Date(calcResult.fecha_vencimiento + "T00:00:00").toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                    <div className="result-badge">
                      {calcResult.dias_plazo_solicitado} días hábiles
                    </div>
                  </div>
                )}
              </div>

              {mostrarCiudadCalc && (
                <div className="form-group">
                  <label>Ciudad (opcional — aplica feriados locales)</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "Sin especificar" },
                      ...(ciudadesPorJurisdiccion[calcData.jurisdiccion] || []),
                    ]}
                    value={calcData.localidad}
                    onChange={(val) => setCalcData(prev => ({ ...prev, localidad: val }))}
                  />
                </div>
              )}

              {ocultarPlazoGracia && (
                <p className="nota-ley-3551" style={{ color: '#f59e0b', fontSize: '0.82em', margin: '6px 0 0', fontStyle: 'italic' }}>
                  Neuquén: Nuevo Código Adversarial (Ley 3551) — Plazo de gracia no aplica
                </p>
              )}




            </div>
          )}

          {/* Sección MANUAL */}
          {metodoIngreso === 'manual' && (
            <div className="manual-date-card">
              <div className="form-row">
                <div className="form-group">
                  <label className="premium-label">Fecha Límite <span className="required">*</span></label>
                  <input
                    type="date"
                    name="fecha_vencimiento"
                    value={formData.fecha_vencimiento}
                    onChange={handleChange}
                    className={`premium-input ${errors.fecha_vencimiento ? "input-error" : ""}`}
                  />
                  {errors.fecha_vencimiento && <span className="error-text">{errors.fecha_vencimiento}</span>}
                </div>
                <div className="form-group">
                  <label className="premium-label">Hora</label>
                  <input
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    className="premium-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="premium-label">Tipo de Vencimiento</label>
                <CustomSelect
                  name="tipo_vencimiento"
                  value={formData.tipo_vencimiento}
                  options={[
                    { value: "traslado", label: "Traslado" },
                    { value: "contestacion_demanda", label: "Contestación de Demanda" },
                    { value: "apelacion", label: "Apelación" },
                    { value: "recurso", label: "Recurso" },
                    { value: "ofrecimiento_prueba", label: "Ofrecimiento de Prueba" },
                    { value: "alegato", label: "Alegato" },
                    { value: "expresion_agravios", label: "Expresión de Agravios" },
                    { value: "prescripcion", label: "Prescripción" },
                    { value: "caducidad", label: "Caducidad" },
                    { value: "otro", label: "Otro" }
                  ]}
                  onChange={(val) => handleChange({ target: { name: 'tipo_vencimiento', value: val } })}
                />
              </div>
            </div>
          )}

          {/* Otros campos */}
          <div className="form-row">
            <div className="form-group">
              <label>Caso <span className="required">*</span></label>
              <CustomSelect
                name="id_caso"
                value={formData.id_caso}
                placeholder="-- Seleccionar Caso --"
                options={casos.map(c => ({ value: c.id_caso, label: c.descripcion }))}
                onChange={(val) => handleChange({ target: { name: 'id_caso', value: val } })}
              />
              {errors.id_caso && <span className="error-text">{errors.id_caso}</span>}
            </div>
            <div className="form-group">
              <label>Prioridad</label>
              <CustomSelect
                name="prioridad"
                value={formData.prioridad}
                options={[
                  { value: "alta", label: "Alta" },
                  { value: "media", label: "Media" },
                  { value: "baja", label: "Baja" }
                ]}
                onChange={(val) => handleChange({ target: { name: 'prioridad', value: val } })}
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
          </div>

          <div className="form-group">
            <label>Notas / Recordatorios</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Detalles sobre el vencimiento..."
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer-premium">
          <button
            type="button"
            className="btn-cancel-premium"
            onClick={() => onClose(false)}
            disabled={loading}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-save-premium" disabled={loading}>
            {loading ? "GUARDANDO..." : "GUARDAR VENCIMIENTO"}
          </button>
        </div>
      </form>
    </ModalFrame >
  );
};

export default VencimientoForm;
