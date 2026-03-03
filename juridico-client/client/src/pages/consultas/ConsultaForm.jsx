import React, { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import ModalFrame from "../../components/common/ModalFrame";
import CustomSelect from "../../components/common/CustomSelect";
import "./ConsultaForm.css";

const ConsultaForm = ({ consulta, clienteId, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    mensaje: "",
    estado: "pendiente",
    id_cliente: "",
    id_abogado_asignado: "",
    nombre_contacto: "",
    telefono_contacto: "",
  });

  // Toggle: true = seleccionar cliente existente, false = posible cliente nuevo
  const [esClienteExistente, setEsClienteExistente] = useState(true);

  const [clientes, setClientes] = useState([]);
  const [abogados, setAbogados] = useState([]);
  const [loading, setLoading] = useState(false);

  // ═══ MODAL DE COBRO SUGERIDO (Ley 1594) ═══
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [valorJus, setValorJus] = useState(0);
  const [loadingJus, setLoadingJus] = useState(false);
  const [registrandoCobro, setRegistrandoCobro] = useState(false);
  const [consultaCreada, setConsultaCreada] = useState(null);
  // Cobro form state
  const [cobroMode, setCobroMode] = useState("jus"); // "jus" | "pesos"
  const [cobroJusCantidad, setCobroJusCantidad] = useState(1);
  const [cobroPesos, setCobroPesos] = useState("");
  const [cobroCobrada, setCobroCobrada] = useState(true); // true = pagado, false = pendiente

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [clRes, abRes] = await Promise.all([
          api.get("/clientes?limit=1000"),
          api.get("/abogados?limit=1000"),
        ]);
        setClientes(clRes.data.data || []);
        setAbogados(abRes.data.data || []);
      } catch (err) {
        showToast("Error al cargar datos", "error");
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    if (consulta) {
      setFormData({
        mensaje: consulta.mensaje || "",
        estado: consulta.estado || "pendiente",
        id_cliente: String(consulta.id_cliente || ""),
        id_abogado_asignado: String(consulta.id_abogado_asignado || ""),
        nombre_contacto: consulta.nombre_contacto || "",
        telefono_contacto: consulta.telefono_contacto || "",
      });
      setEsClienteExistente(!!consulta.id_cliente);
    } else if (clienteId) {
      setFormData((prev) => ({ ...prev, id_cliente: String(clienteId) }));
      setEsClienteExistente(true);
    }
  }, [consulta, clienteId]);

  const opcionesClientes = useMemo(
    () =>
      clientes.map((c) => ({
        value: String(c.id_cliente),
        label: `${c.nombre} ${c.apellido}`,
      })),
    [clientes]
  );

  const opcionesAbogados = useMemo(
    () =>
      abogados.map((a) => ({
        value: String(a.id_abogado),
        label: `${a.nombre} ${a.apellido}`,
      })),
    [abogados]
  );

  const opcionesEstado = useMemo(
    () => [
      { value: "pendiente", label: "PENDIENTE" },
      { value: "en_progreso", label: "EN PROGRESO" },
      { value: "resuelta", label: "RESUELTA" },
    ],
    []
  );

  // Cargar valor JUS cuando se abre el modal de cobro
  const cargarValorJus = async () => {
    setLoadingJus(true);
    try {
      const res = await api.get("/configuracion/jus");
      const valores = res.data.data || {};
      setValorJus(valores.NQN || 0);
    } catch (err) {
      console.error("Error al cargar JUS:", err);
      setValorJus(0);
    } finally {
      setLoadingJus(false);
    }
  };

  const handleRegistrarCobro = async () => {
    setRegistrandoCobro(true);
    try {
      const datos = {
        tipo: "ingreso",
        categoria: "consulta",
        estado: cobroCobrada ? "pagado" : "pendiente",
      };

      if (cobroCobrada) {
        datos.fecha_cobro = new Date().toISOString().split("T")[0];
      }

      if (cobroMode === "jus") {
        const cantJus = parseFloat(cobroJusCantidad) || 1;
        datos.monto_jus = cantJus;
        datos.monto_ars = cantJus * valorJus;
        datos.provincia = "NQN";
        datos.descripcion = `Consulta - ${cantJus} JUS (Art. 9 Ley 1594)`;
      } else {
        const montoPesos = parseFloat(cobroPesos) || 0;
        if (montoPesos <= 0) {
          showToast("Ingresá un monto válido en pesos", "error");
          setRegistrandoCobro(false);
          return;
        }
        datos.monto_ars = montoPesos;
        datos.descripcion = `Consulta - Monto fijo en pesos`;
      }

      // Vincular con cliente si hay uno
      if (consultaCreada?.id_cliente) {
        datos.id_cliente = consultaCreada.id_cliente;
      }

      await api.post("/finanzas", datos);
      showToast(
        cobroCobrada
          ? "Ingreso por consulta registrado como cobrado"
          : "Ingreso por consulta registrado como pendiente"
      );
    } catch (err) {
      console.error("Error al registrar cobro:", err);
      showToast(err.response?.data?.error || "Error al registrar el cobro", "error");
    } finally {
      setRegistrandoCobro(false);
      setShowCobroModal(false);
      onClose(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        mensaje: formData.mensaje,
        estado: formData.estado,
        id_abogado_asignado: formData.id_abogado_asignado || null,
      };

      if (esClienteExistente) {
        data.id_cliente = formData.id_cliente;
      } else {
        data.nombre_contacto = formData.nombre_contacto;
        data.telefono_contacto = formData.telefono_contacto;
      }

      if (consulta) {
        await api.put(`/consultas/${consulta.id_consulta}`, data);
        showToast("Consulta actualizada");
        onClose(true);
      } else {
        const res = await api.post("/consultas", data);
        showToast("Consulta creada");
        setConsultaCreada(res.data.data || null);
        setCobroJusCantidad(1);
        setCobroPesos("");
        setCobroMode("jus");
        setCobroCobrada(true);
        await cargarValorJus();
        setShowCobroModal(true);
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar", "error");
    } finally {
      setLoading(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (v) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

  // ═══ MODAL DE COBRO SUGERIDO ═══
  if (showCobroModal) {
    const montoEnPesos = cobroMode === "jus"
      ? (parseFloat(cobroJusCantidad) || 0) * valorJus
      : parseFloat(cobroPesos) || 0;

    return (
      <ModalFrame
        title="Cobro por Consulta – Ley 1594"
        onClose={() => { setShowCobroModal(false); onClose(true); }}
      >
        <div style={{ padding: '24px' }}>
          {/* Info legal */}
          <div style={{
            background: 'rgba(129, 140, 248, 0.1)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '20px',
          }}>
            <p style={{ color: 'var(--color-texto-secundario)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              📜 <strong style={{ color: 'var(--color-texto-principal)' }}>Art. 9 – Ley 1594</strong>: La consulta verbal se tasa en <strong style={{ color: '#818cf8' }}>1 JUS</strong>.
              {valorJus > 0 && (<> Valor actual del JUS: <strong style={{ color: '#10b981' }}>{formatCurrency(valorJus)}</strong></>)}
            </p>
          </div>

          {loadingJus ? (
            <p style={{ textAlign: 'center', color: 'var(--color-texto-secundario)' }}>Cargando valor JUS...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Toggle JUS / Pesos */}
              <div className="lead-toggle" style={{ marginBottom: 0 }}>
                <button type="button" className={cobroMode === "jus" ? "active" : ""} onClick={() => setCobroMode("jus")}>
                  En JUS
                </button>
                <button type="button" className={cobroMode === "pesos" ? "active" : ""} onClick={() => setCobroMode("pesos")}>
                  En Pesos
                </button>
              </div>

              {/* Input de monto */}
              {cobroMode === "jus" ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    CANTIDAD DE JUS
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cobroJusCantidad}
                    onChange={(e) => setCobroJusCantidad(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'var(--color-texto-principal)', fontSize: '1.1rem', fontFamily: 'monospace' }}
                  />
                  {valorJus > 0 && (
                    <p style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--color-texto-secundario)' }}>
                      Equivale a <strong className="mono" style={{ color: '#10b981' }}>{formatCurrency(montoEnPesos)}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-texto-secundario)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    MONTO EN PESOS
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={cobroPesos}
                    onChange={(e) => setCobroPesos(e.target.value)}
                    placeholder="Ej: 30000"
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'var(--color-texto-principal)', fontSize: '1.1rem', fontFamily: 'monospace' }}
                  />
                </div>
              )}

              {/* Toggle cobrada */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', background: cobroCobrada ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${cobroCobrada ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, borderRadius: '8px', transition: 'all 0.2s' }}>
                <input
                  type="checkbox"
                  checked={cobroCobrada}
                  onChange={(e) => setCobroCobrada(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#10b981' }}
                />
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--color-texto-principal)', fontSize: '0.9rem' }}>
                    {cobroCobrada ? " Marcar como cobrada" : "Pendiente de cobro"}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-texto-secundario)', marginTop: '2px' }}>
                    {cobroCobrada ? "Se registra como ingreso cobrado hoy" : "Aparecerá en Finanzas como cobro pendiente"}
                  </span>
                </div>
              </label>

              {/* Botones */}
              <button
                className="btn-submit"
                onClick={handleRegistrarCobro}
                disabled={registrandoCobro || (cobroMode === "jus" ? (!cobroJusCantidad || cobroJusCantidad <= 0) : (!cobroPesos || cobroPesos <= 0))}
                style={{ padding: '12px', fontSize: '0.95rem' }}
              >
                {registrandoCobro ? "Registrando..." : `Registrar ${cobroMode === "jus" ? `${cobroJusCantidad} JUS (${formatCurrency(montoEnPesos)})` : formatCurrency(montoEnPesos)}`}
              </button>
              <button
                className="btn-cancel"
                onClick={() => { setShowCobroModal(false); onClose(true); }}
                style={{ padding: '10px' }}
              >
                Omitir
              </button>
            </div>
          )}
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      title={consulta ? "Editar Consulta" : "Nueva Consulta"}
      onClose={() => onClose(false)}
    >
      <form onSubmit={handleSubmit} className="premium-form-content">
        <div className="form-body">

          {/* Toggle: Cliente existente o Posible Cliente */}
          {!consulta && !clienteId && (
            <div className="form-group">
              <label>TIPO DE CONTACTO</label>
              <div className="lead-toggle">
                <button
                  type="button"
                  className={esClienteExistente ? "active" : ""}
                  onClick={() => setEsClienteExistente(true)}
                >
                  Cliente existente
                </button>
                <button
                  type="button"
                  className={!esClienteExistente ? "active" : ""}
                  onClick={() => setEsClienteExistente(false)}
                >
                  Nuevo contacto (Posible Cliente)
                </button>
              </div>
            </div>
          )}

          {esClienteExistente ? (
            <div className="form-group">
              <label>CLIENTE</label>
              <CustomSelect
                options={opcionesClientes}
                value={formData.id_cliente}
                onChange={(val) =>
                  setFormData((p) => ({ ...p, id_cliente: val }))
                }
                placeholder="Seleccionar cliente..."
                disabled={!!clienteId}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>NOMBRE DEL CONTACTO</label>
                <input
                  type="text"
                  value={formData.nombre_contacto}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nombre_contacto: e.target.value }))
                  }
                  placeholder="Nombre completo del interesado"
                  required
                />
              </div>
              <div className="form-group">
                <label>TELÉFONO</label>
                <input
                  type="tel"
                  value={formData.telefono_contacto}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, telefono_contacto: e.target.value }))
                  }
                  placeholder="Ej: +5492994123456"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>ABOGADO ASIGNADO</label>
            <CustomSelect
              options={opcionesAbogados}
              value={formData.id_abogado_asignado}
              onChange={(val) =>
                setFormData((p) => ({ ...p, id_abogado_asignado: val }))
              }
              placeholder="Sin asignar..."
            />
          </div>

          <div className="form-group">
            <label>MENSAJE</label>
            <textarea
              className="premium-textarea"
              value={formData.mensaje}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, mensaje: e.target.value }))
              }
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>ESTADO</label>
            <CustomSelect
              options={opcionesEstado}
              value={formData.estado}
              onChange={(val) => setFormData((p) => ({ ...p, estado: val }))}
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
            {loading ? "Guardando..." : "Guardar Consulta"}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
};

export default ConsultaForm;
