import { useState, useEffect } from "react";
import api from "../../services/api";
import "./AbogadoForm.css";

const AbogadoForm = ({ abogado, onClose, showToast }) => {
  // CORREGIDO: showTotast -> showToast
  const isEditing = !!abogado;

  const [formData, setFormData] = useState({
    dni: "",
    telefono: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    especialidad: "",
    rol: "abogado", // Default para nuevos
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      setFormData({
        dni: abogado.dni || "", // <-- Cargar DNI si existe
        telefono: abogado.telefono || "",
        nombre: abogado.nombre || "",
        apellido: abogado.apellido || "",
        email: abogado.email || "",
        password: "", // NUNCA cargar la contraseña existente
        especialidad: abogado.especialidad || "",
        rol: abogado.rol || "abogado",
      });
    }
  }, [abogado, isEditing]);

  // 1. Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error al escribir
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // 2. Validar formulario
  const validarFormulario = () => {
    const newErrors = {};

    if (!formData.nombre.trim() || formData.nombre.length < 2)
      newErrors.nombre = "Nombre inválido";

    if (!formData.apellido.trim() || formData.apellido.length < 2)
      newErrors.apellido = "Apellido inválido";

    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    )
      newErrors.email = "Email inválido";

    if (!formData.dni.trim() || !/^\d{7,8}$/.test(formData.dni))
      newErrors.dni = "DNI debe tener 7 u 8 dígitos."; // Validación DNI

    // Contraseña: Solo obligatoria en creación
    if (!isEditing && !formData.password.trim())
      newErrors.password = "La contraseña es obligatoria";
    // Opcional: Validación de longitud de contraseña
    if (formData.password.trim() && formData.password.length < 6)
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 3. Manejar Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setLoading(true);

    try {
      if (isEditing) {
        // En edición, filtramos el password si está vacío para no cambiarlo
        const dataToUpdate = Object.fromEntries(
          Object.entries(formData).filter(
            ([key, value]) => key !== "password" || value !== ""
          )
        );
        await api.put(`/abogados/${abogado.id_abogado}`, dataToUpdate);
        showToast("Abogado actualizado exitosamente", "success");
      } else {
        // En creación
        await api.post("/abogados", formData);
        showToast("Abogado creado exitosamente", "success");
      }
      onClose(true); // Cerrar y recargar lista
    } catch (err) {
      console.error("Error al guardar abogado:", err);
      showToast(
        err.response?.data?.error || "Error al guardar el abogado",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // 4. Renderizado (JSX)
  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Editar Abogado" : "Nuevo Abogado"}</h2>
          <button
            className="btn-close-modal"
            onClick={() => onClose(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-body">
            {/* Campo DNI */}           
            <div className="form-group">
              <label htmlFor="dni">DNI</label>          
              <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                disabled={loading}
                className={errors.dni ? "input-error" : ""}
              />
              {errors.dni && <span className="error-text">{errors.dni}</span>}  
                     
            </div>
                                   
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>      
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={loading}
                className={errors.nombre ? "input-error" : ""}
              />
                     
              {errors.nombre && (
                <span className="error-text">{errors.nombre}</span>
              )}
                         
            </div>
                             
            <div className="form-group">
              <label htmlFor="apellido">Apellido</label>        
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                disabled={loading}
                className={errors.apellido ? "input-error" : ""}
              />
                         
              {errors.apellido && (
                <span className="error-text">{errors.apellido}</span>
              )}
                       
            </div>
                             
            <div className="form-group">
              <label htmlFor="email">Email</label>       
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={errors.email ? "input-error" : ""}
              />{" "}
                     
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
                       
            </div>{" "}
                               
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>         
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled={loading}
                className={errors.telefono ? "input-error" : ""}
              />{" "}
                       
              {errors.telefono && (
                <span className="error-text">{errors.telefono}</span>
              )}
                       
            </div>
            <div className="form-group">
              <label htmlFor="especialidad">Especialidad</label>
              <input
                type="text"
                id="especialidad"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="rol">Rol</label>
              <select
                id="rol"
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="abogado">Abogado</option>
                <option value="admin">Administrador</option>
                <option value="asistente">Asistente</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="password">
                Contraseña {isEditing && "(Dejar vacío para no cambiar)"}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>
          </div>
          {/* Footer con botones (similar a ClienteForm) */}
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

export default AbogadoForm;
