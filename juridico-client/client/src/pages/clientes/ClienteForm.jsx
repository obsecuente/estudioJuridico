import { useState, useEffect } from "react";
import api from "../../services/api";
import "./ClienteForm.css";

const ClienteForm = ({ cliente, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    consentimiento_datos: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Si estamos editando, cargar datos del cliente
  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || "",
        apellido: cliente.apellido || "",
        email: cliente.email || "",
        telefono: cliente.telefono || "",
        consentimiento_datos: cliente.consentimiento_datos || false,
      });
    }
  }, [cliente]);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpiar error del campo cuando el usuario escribe
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    // Validar apellido
    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es obligatorio";
    } else if (formData.apellido.length < 2) {
      newErrors.apellido = "El apellido debe tener al menos 2 caracteres";
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El formato del email no es válido";
    }

    // Validar teléfono (opcional, pero si lo pone debe ser válido)
    if (formData.telefono && !/^\+[1-9]\d{1,14}$/.test(formData.telefono)) {
      newErrors.telefono =
        "Formato: +54 (código de área sin 0) número. Ej: +5492995123456";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar antes de enviar
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      if (cliente) {
        // Preparar datos para enviar
        const datosAEnviar = {
          ...formData,
          // Asegurar que consentimiento sea explícitamente true o false
          consentimiento_datos: formData.consentimiento_datos === true,
        };

        // Estamos editando
        await api.put(`/clientes/${cliente.id_cliente}`, formData);
        showToast("Cliente actualizado exitosamente", "success");
      } else {
        // Estamos creando
        await api.post("/clientes", formData);
        showToast("Cliente creado exitosamente", "success");
      }

      onClose(true); // Cerrar modal y recargar lista
    } catch (err) {
      console.error("Error al guardar cliente:", err);

      // Mostrar error específico del backend
      if (err.response?.data?.error) {
        showToast(err.response.data.error);
      } else {
        showToast("Error al guardar el cliente", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header del modal */}
        <div className="modal-header">
          <h2>{cliente ? "Editar Cliente" : "Nuevo Cliente"}</h2>
          <button
            className="btn-close-modal"
            onClick={() => onClose(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="form-body">
            {/* Nombre */}
            <div className="form-group">
              <label htmlFor="nombre">
                Nombre <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={errors.nombre ? "input-error" : ""}
                disabled={loading}
                placeholder="Juan"
              />
              {errors.nombre && (
                <span className="error-text">{errors.nombre}</span>
              )}
            </div>

            {/* Apellido */}
            <div className="form-group">
              <label htmlFor="apellido">
                Apellido <span className="required">*</span>
              </label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className={errors.apellido ? "input-error" : ""}
                disabled={loading}
                placeholder="Pérez"
              />
              {errors.apellido && (
                <span className="error-text">{errors.apellido}</span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
                disabled={loading}
                placeholder="juan.perez@email.com"
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            {/* Teléfono */}
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={errors.telefono ? "input-error" : ""}
                disabled={loading}
                placeholder="+5492995123456"
              />
              {errors.telefono && (
                <span className="error-text">{errors.telefono}</span>
              )}
              <span className="help-text">
                Formato internacional: +54 (código de área) número
              </span>
            </div>

            {/* Consentimiento */}
            <div className="form-group-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="consentimiento_datos"
                  checked={formData.consentimiento_datos}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>
                  El cliente otorga consentimiento para el uso de sus datos
                </span>
              </label>
            </div>
          </div>

          {/* Footer con botones */}
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
      </div>
    </div>
  );
};

export default ClienteForm;
