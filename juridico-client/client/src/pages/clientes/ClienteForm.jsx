import { useState, useEffect } from "react";
import api from "../../services/api";
import ModalFrame from "../../components/common/ModalFrame";
import "./ClienteForm.css";

const ClienteForm = ({ cliente, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    tipo_persona: "fisica",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    consentimiento_datos: false,
    // Persona fisica
    dni: "",
    fecha_nacimiento: "",
    estado_civil: "",
    profesion: "",
    domicilio_real: "",
    localidad: "",
    provincia: "Neuquén",
    // Persona juridica
    cuit: "",
    razon_social: "",
    domicilio_sede: "",
    // Contacto alternativo
    contacto_alternativo_nombre: "",
    contacto_alternativo_telefono: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [datosLegalesAbiertos, setDatosLegalesAbiertos] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData({
        tipo_persona: cliente.tipo_persona || "fisica",
        nombre: cliente.nombre || "",
        apellido: cliente.apellido || "",
        email: cliente.email || "",
        telefono: cliente.telefono || "",
        consentimiento_datos: cliente.consentimiento_datos || false,
        dni: cliente.dni || "",
        fecha_nacimiento: cliente.fecha_nacimiento || "",
        estado_civil: cliente.estado_civil || "",
        profesion: cliente.profesion || "",
        domicilio_real: cliente.domicilio_real || "",
        localidad: cliente.localidad || "",
        provincia: cliente.provincia || "Neuquén",
        cuit: cliente.cuit || "",
        razon_social: cliente.razon_social || "",
        domicilio_sede: cliente.domicilio_sede || "",
        contacto_alternativo_nombre: cliente.contacto_alternativo_nombre || "",
        contacto_alternativo_telefono: cliente.contacto_alternativo_telefono || "",
      });
      // Si está editando y tiene datos legales, abrir la sección
      if (cliente.dni || cliente.cuit || cliente.domicilio_real) {
        setDatosLegalesAbiertos(true);
      }
    }
  }, [cliente]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const esFisica = formData.tipo_persona === "fisica";

  const validarFormulario = () => {
    const e = {};
    if (!formData.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!esFisica && !formData.razon_social?.trim()) e.razon_social = "La razón social es obligatoria";
    if (!formData.telefono) e.telefono = "El teléfono es obligatorio";
    if (formData.telefono && !/^\+[1-9]\d{7,14}$/.test(formData.telefono))
      e.telefono = "Formato: +5492995123456";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = "Email inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validarFormulario()) return;
    setLoading(true);

    // Limpiar campos del tipo que NO se usa para no enviar datos basura
    const payload = { ...formData };
    if (!esFisica) {
      payload.dni = null; payload.fecha_nacimiento = null;
      payload.estado_civil = null; payload.profesion = null;
      payload.domicilio_real = null;
    } else {
      payload.cuit = null; payload.razon_social = null; payload.domicilio_sede = null;
    }

    try {
      if (cliente) {
        await api.put(`/clientes/${cliente.id_cliente}`, payload);
        showToast("Cliente actualizado exitosamente", "success");
      } else {
        await api.post("/clientes", payload);
        showToast("Cliente creado exitosamente", "success");
      }
      onClose(true);
    } catch (err) {
      showToast(err.response?.data?.error || "Error al guardar el cliente", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame title={cliente ? "Editar Cliente" : "Nuevo Cliente"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-body">

          {/* Seccion 1: Tipo de persona */}
          <div className="form-group">
            <label>Tipo de persona</label>
            <div className="tipo-persona-radios">
              <label className={`tipo-radio-btn ${esFisica ? "active" : ""}`}>
                <input type="radio" name="tipo_persona" value="fisica"
                  checked={esFisica} onChange={handleChange} />
                Persona Física
              </label>
              <label className={`tipo-radio-btn ${!esFisica ? "active" : ""}`}>
                <input type="radio" name="tipo_persona" value="juridica"
                  checked={!esFisica} onChange={handleChange} />
                Empresa / Org. Jurídica
              </label>
            </div>
          </div>

          {/* Nombre o Razon Social */}
          {esFisica ? (
            <div className="form-row-2">
              <div className="form-group">
                <label>Nombre <span className="required">*</span></label>
                <input type="text" name="nombre" value={formData.nombre}
                  onChange={handleChange} className={errors.nombre ? "input-error" : ""}
                  placeholder="Juan" disabled={loading} />
                {errors.nombre && <span className="error-text">{errors.nombre}</span>}
              </div>
              <div className="form-group">
                <label>Apellido <span className="required">*</span></label>
                <input type="text" name="apellido" value={formData.apellido}
                  onChange={handleChange} disabled={loading} placeholder="Pérez" />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Razón Social <span className="required">*</span></label>
              <input type="text" name="razon_social" value={formData.razon_social}
                onChange={handleChange} className={errors.razon_social ? "input-error" : ""}
                placeholder="Empresa SA" disabled={loading} />
              {errors.razon_social && <span className="error-text">{errors.razon_social}</span>}
            </div>
          )}

          {/* Telefono y Email */}
          <div className="form-row-2">
            <div className="form-group">
              <label>Teléfono <span className="required">*</span></label>
              <input type="tel" name="telefono" value={formData.telefono}
                onChange={handleChange} className={errors.telefono ? "input-error" : ""}
                placeholder="+5492995123456" disabled={loading} />
              {errors.telefono && <span className="error-text">{errors.telefono}</span>}
            </div>
            <div className="form-group">
              <label>Email <span className="opcional-tag">opcional</span></label>
              <input type="email" name="email" value={formData.email}
                onChange={handleChange} className={errors.email ? "input-error" : ""}
                placeholder="juan@email.com" disabled={loading} />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>

          {/* Seccion 2: Datos legales (colapsable) */}
          <div className="datos-legales-accordion">
            <button type="button" className="datos-legales-toggle"
              onClick={() => setDatosLegalesAbiertos(!datosLegalesAbiertos)}>
              <span>{datosLegalesAbiertos ? "▲" : "▼"} Datos para expediente judicial</span>
              <span className="opcional-tag">opcional</span>
            </button>

            {datosLegalesAbiertos && (
              <div className="datos-legales-body">
                {esFisica ? (
                  <>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>DNI</label>
                        <input type="text" name="dni" value={formData.dni}
                          onChange={handleChange} placeholder="28123456" disabled={loading} />
                      </div>
                      <div className="form-group">
                        <label>Fecha de Nacimiento</label>
                        <input type="date" name="fecha_nacimiento"
                          value={formData.fecha_nacimiento}
                          onChange={handleChange} disabled={loading} />
                      </div>
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Estado Civil</label>
                        <select name="estado_civil" value={formData.estado_civil}
                          onChange={handleChange} disabled={loading}>
                          <option value="">— Seleccionar —</option>
                          <option value="soltero">Soltero/a</option>
                          <option value="casado">Casado/a</option>
                          <option value="divorciado">Divorciado/a</option>
                          <option value="viudo">Viudo/a</option>
                          <option value="union_convivencial">Unión Convivencial</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Profesión</label>
                        <input type="text" name="profesion" value={formData.profesion}
                          onChange={handleChange} placeholder="Docente" disabled={loading} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Domicilio Real</label>
                      <input type="text" name="domicilio_real" value={formData.domicilio_real}
                        onChange={handleChange} placeholder="Av. Argentina 1234, Neuquén"
                        disabled={loading} />
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Localidad</label>
                        <input type="text" name="localidad" value={formData.localidad}
                          onChange={handleChange} placeholder="Neuquén Capital" disabled={loading} />
                      </div>
                      <div className="form-group">
                        <label>Provincia</label>
                        <input type="text" name="provincia" value={formData.provincia}
                          onChange={handleChange} placeholder="Neuquén" disabled={loading} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>CUIT</label>
                      <input type="text" name="cuit" value={formData.cuit}
                        onChange={handleChange} placeholder="30-12345678-9" disabled={loading} />
                    </div>
                    <div className="form-group">
                      <label>Domicilio de Sede Legal</label>
                      <input type="text" name="domicilio_sede" value={formData.domicilio_sede}
                        onChange={handleChange} placeholder="Calle Falsa 123, Piso 4"
                        disabled={loading} />
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Localidad</label>
                        <input type="text" name="localidad" value={formData.localidad}
                          onChange={handleChange} placeholder="Neuquén Capital" disabled={loading} />
                      </div>
                      <div className="form-group">
                        <label>Provincia</label>
                        <input type="text" name="provincia" value={formData.provincia}
                          onChange={handleChange} placeholder="Neuquén" disabled={loading} />
                      </div>
                    </div>
                  </>
                )}

                {/* Contacto alternativo (siempre) */}
                <div className="seccion-sub-label">Contacto alternativo</div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input type="text" name="contacto_alternativo_nombre"
                      value={formData.contacto_alternativo_nombre}
                      onChange={handleChange} placeholder="María Torres" disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input type="tel" name="contacto_alternativo_telefono"
                      value={formData.contacto_alternativo_telefono}
                      onChange={handleChange} placeholder="+5492995000000" disabled={loading} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Consentimiento */}
          <div className="form-group-checkbox">
            <label className="checkbox-label">
              <input type="checkbox" name="consentimiento_datos"
                checked={formData.consentimiento_datos}
                onChange={handleChange} disabled={loading} />
              <span>El cliente otorga consentimiento para el uso de sus datos</span>
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel"
            onClick={() => onClose(false)} disabled={loading}>
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

export default ClienteForm;
