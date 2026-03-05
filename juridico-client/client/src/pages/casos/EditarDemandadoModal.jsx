import { useState, useEffect } from "react";
import api from "../../services/api";
import ModalFrame from "../../components/common/ModalFrame";

const EditarDemandadoModal = ({ caso, onClose, showToast, onGuardado }) => {
    const [formData, setFormData] = useState({
        demandado_tipo: "persona_fisica",
        demandado_nombre: "",
        demandado_dni_cuit: "",
        demandado_domicilio: "",
        objeto_del_juicio: "",
        monto_reclamado: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (caso) {
            setFormData({
                demandado_tipo: caso.demandado_tipo || "persona_fisica",
                demandado_nombre: caso.demandado_nombre || "",
                demandado_dni_cuit: caso.demandado_dni_cuit || "",
                demandado_domicilio: caso.demandado_domicilio || "",
                objeto_del_juicio: caso.objeto_del_juicio || "",
                monto_reclamado: caso.monto_reclamado || "",
            });
        }
    }, [caso]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.demandado_nombre.trim()) {
            showToast("El nombre del demandado es obligatorio", "error");
            return;
        }
        setLoading(true);
        try {
            await api.put(`/casos/${caso.id_caso}`, {
                demandado_nombre: formData.demandado_nombre,
                demandado_tipo: formData.demandado_tipo,
                demandado_dni_cuit: formData.demandado_dni_cuit || null,
                demandado_domicilio: formData.demandado_domicilio || null,
                objeto_del_juicio: formData.objeto_del_juicio || null,
                monto_reclamado: formData.monto_reclamado ? parseFloat(formData.monto_reclamado) : null,
            });

            // Registrar en historial (silencioso si falla)
            try {
                await api.post(`/casos/${caso.id_caso}/historial`, {
                    tipo_evento: "CAMBIO_ESTADO",
                    descripcion: `Se cargaron datos del demandado: ${formData.demandado_nombre}`,
                });
            } catch {
                // No frenar el guardado si falla el historial
            }

            showToast("Datos del demandado guardados", "success");
            onGuardado?.();
            onClose();
        } catch (err) {
            showToast(err.response?.data?.error || "Error al guardar", "error");
        } finally {
            setLoading(false);
        }
    };

    const esFisica = formData.demandado_tipo === "persona_fisica";

    return (
        <ModalFrame
            title={caso?.demandado_nombre ? "Editar Demandado" : "Agregar Demandado"}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit}>
                <div className="form-body">
                    <div className="form-group">
                        <label>Tipo</label>
                        <div className="tipo-persona-radios">
                            <label className={`tipo-radio-btn ${esFisica ? "active" : ""}`}>
                                <input type="radio" name="demandado_tipo" value="persona_fisica"
                                    checked={esFisica} onChange={handleChange} />
                                Persona Física
                            </label>
                            <label className={`tipo-radio-btn ${!esFisica ? "active" : ""}`}>
                                <input type="radio" name="demandado_tipo" value="persona_juridica"
                                    checked={!esFisica} onChange={handleChange} />
                                Persona Jurídica
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            {esFisica ? "Nombre completo" : "Razón Social"}{" "}
                            <span className="required">*</span>
                        </label>
                        <input type="text" name="demandado_nombre" value={formData.demandado_nombre}
                            onChange={handleChange} disabled={loading}
                            placeholder={esFisica ? "Juan García" : "Empresa SA"} />
                    </div>

                    <div className="form-group">
                        <label>{esFisica ? "DNI" : "CUIT"}</label>
                        <input type="text" name="demandado_dni_cuit" value={formData.demandado_dni_cuit}
                            onChange={handleChange} disabled={loading}
                            placeholder={esFisica ? "28123456" : "30-12345678-9"} />
                    </div>

                    <div className="form-group">
                        <label>Domicilio para notificaciones</label>
                        <input type="text" name="demandado_domicilio" value={formData.demandado_domicilio}
                            onChange={handleChange} disabled={loading}
                            placeholder="Calle Falsa 123, Neuquén" />
                    </div>

                    <div className="seccion-sub-label" style={{ marginTop: 16 }}>Datos del conflicto</div>

                    <div className="form-group">
                        <label>Objeto del Juicio</label>
                        <input type="text" name="objeto_del_juicio" value={formData.objeto_del_juicio}
                            onChange={handleChange} disabled={loading}
                            placeholder="Daños y perjuicios por accidente laboral" />
                    </div>

                    <div className="form-group">
                        <label>Monto Reclamado (ARS)</label>
                        <input type="number" name="monto_reclamado" value={formData.monto_reclamado}
                            onChange={handleChange} disabled={loading}
                            placeholder="500000" min="0" />
                    </div>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={() => onClose()} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? "Guardando..." : "Guardar Demandado"}
                    </button>
                </div>
            </form>
        </ModalFrame>
    );
};

export default EditarDemandadoModal;
