import { useState, useEffect } from "react";
import api from "../../services/api";
import finanzasService from "../../services/finanzas.service";
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

  // Estados para Apertura de Carpeta
  const [registrarApertura, setRegistrarApertura] = useState(false);
  const [cantidadJus, setCantidadJus] = useState("3");
  const [valorJusActual, setValorJusActual] = useState(0);
  const [usarMontoFijo, setUsarMontoFijo] = useState(false);
  const [montoFijo, setMontoFijo] = useState("");

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

      // Cargar valor JUS por separado para manejar error
      try {
        const jusRes = await finanzasService.getValoresJus();
        setValorJusActual(jusRes.data?.valor_jus_nqn || 15000); // Default fallback
      } catch (jusError) {
        console.warn("No se pudo cargar valor JUS, usando default");
        setValorJusActual(15000); // Fallback value
      }
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
      // Preparar datos con finanzas si corresponde
      const datosEnviar = { ...formData };

      if (!caso && registrarApertura) {
        datosEnviar.finanzas = {
          registrarApertura: true,
          // Backend expects 'montoJus' not 'cantidad_jus'
          montoJus: usarMontoFijo ? 0 : parseFloat(cantidadJus) || 3,
          montoFijo: usarMontoFijo ? parseFloat(montoFijo) || 0 : undefined,
          provincia: "NQN",
        };
      }

      if (caso) {
        await api.put(`/casos/${caso.id_caso}`, formData);
        showToast("Caso actualizado", "success");
      } else {
        await api.post("/casos", datosEnviar);
        showToast("Caso creado" + (registrarApertura ? " con apertura de carpeta" : ""), "success");
      }
      onClose(true);
    } catch (err) {
      console.error("Error al guardar caso:", err);
      showToast(err.response?.data?.error || "Error al guardar", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const totalCalculado = usarMontoFijo
    ? parseFloat(montoFijo) || 0
    : (parseFloat(cantidadJus) || 0) * valorJusActual;

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

            {/* Sección Apertura de Carpeta - Solo para nuevos casos */}
            {!caso && (
              <div className="apertura-section">
                <div className="apertura-header">
                  <h4>⚖️ Honorarios de Apertura</h4>
                  <span className="apertura-ref">Ref: Ley 1594 Neuquén</span>
                </div>

                <div className="apertura-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={registrarApertura}
                      onChange={(e) => setRegistrarApertura(e.target.checked)}
                      disabled={loading}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">
                    ¿Registrar honorarios de apertura de carpeta?
                  </span>
                </div>

                {registrarApertura && (
                  <div className="apertura-form">
                    <div className="apertura-mode-toggle">
                      <button
                        type="button"
                        className={!usarMontoFijo ? "active" : ""}
                        onClick={() => setUsarMontoFijo(false)}
                      >
                        En JUS
                      </button>
                      <button
                        type="button"
                        className={usarMontoFijo ? "active" : ""}
                        onClick={() => setUsarMontoFijo(true)}
                      >
                        En Pesos
                      </button>
                    </div>

                    {!usarMontoFijo ? (
                      <div className="form-group">
                        <label>Cantidad de JUS</label>
                        <input
                          type="number"
                          value={cantidadJus}
                          onChange={(e) => setCantidadJus(e.target.value)}
                          min="0"
                          step="0.5"
                          disabled={loading}
                          placeholder="3"
                        />
                        {/* ═══ DISPLAY DUAL JUS / PESOS ═══ */}
                        <div className="apertura-dual-display">
                          <div className="apertura-jus-big">
                            <span className="apertura-jus-number">{cantidadJus || 0}</span>
                            <span className="apertura-jus-unit">JUS</span>
                          </div>
                          <div className="apertura-equals">=</div>
                          <div className="apertura-pesos-big">
                            <span className="apertura-pesos-value">{formatCurrency(totalCalculado)}</span>
                            <span className="apertura-pesos-label">al valor de hoy</span>
                          </div>
                        </div>
                        <div className="apertura-jus-info">
                          Valor JUS actual: <strong>{formatCurrency(valorJusActual)}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Monto en Pesos ($)</label>
                        <input
                          type="number"
                          value={montoFijo}
                          onChange={(e) => setMontoFijo(e.target.value)}
                          min="0"
                          disabled={loading}
                          placeholder="Ej: 45000"
                        />
                        {montoFijo && (
                          <div className="apertura-dual-display apertura-dual-pesos">
                            <div className="apertura-pesos-big">
                              <span className="apertura-pesos-value">{formatCurrency(parseFloat(montoFijo) || 0)}</span>
                              <span className="apertura-pesos-label">monto fijo en pesos</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="apertura-info">
                      <span>📋</span>
                      <span>Se registrará como ingreso pendiente asociado a este caso</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
