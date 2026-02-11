// src/pages/configuracion/ConfiguracionJUS.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import finanzasService from "../../services/finanzas.service";
import { SpinnerIcon } from "../../components/common/Icons";
import BackButton from "../../components/common/BackButton";
import "./ConfiguracionJUS.css";

const ConfiguracionJUS = () => {
    const [valores, setValores] = useState({
        NQN: "",
        RN: "",
    });
    const [valoresActuales, setValoresActuales] = useState({
        NQN: 0,
        RN: 0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        cargarValores();
    }, []);

    const cargarValores = async () => {
        try {
            setLoading(true);
            const response = await finanzasService.getValoresJus();
            const data = response.data || {};
            setValoresActuales({
                NQN: data.valor_jus_nqn || 0,
                RN: data.valor_jus_rn || 0,
            });
            setValores({
                NQN: data.valor_jus_nqn || "",
                RN: data.valor_jus_rn || "",
            });
        } catch (err) {
            console.error("Error al cargar valores JUS:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (provincia, value) => {
        // Solo permitir números y punto decimal
        const numericValue = value.replace(/[^0-9.]/g, "");
        setValores((prev) => ({ ...prev, [provincia]: numericValue }));
    };

    const handleGuardar = async (provincia) => {
        const valor = parseFloat(valores[provincia]);
        if (isNaN(valor) || valor <= 0) {
            setMessage({ type: "error", text: "Ingrese un valor válido mayor a 0" });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        try {
            setSaving(true);
            await finanzasService.actualizarValorJus(provincia, valor);
            setValoresActuales((prev) => ({ ...prev, [provincia]: valor }));
            setMessage({ type: "success", text: `Valor JUS ${provincia} actualizado correctamente` });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error("Error al guardar:", err);
            setMessage({ type: "error", text: "Error al actualizar el valor" });
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 2,
        }).format(value || 0);
    };

    if (loading) {
        return (
            <div className="configuracion-container">
                <div className="loading-config">
                    <SpinnerIcon />
                    <span>Cargando configuración...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="configuracion-container">
            <BackButton />
            <div className="configuracion-header">
                <h1>⚖️ Configuración de JUS</h1>
                <p>Actualiza el valor del JUS cuando el Tribunal Superior de Justicia anuncie cambios</p>
            </div>

            {/* Card Neuquén */}
            <div className="config-card">
                <div className="config-card-header">
                    <h2>🏔️ Neuquén (NQN)</h2>
                    <span className="badge">Ley 1594</span>
                </div>
                <div className="config-card-body">
                    <div className="jus-form">
                        <div className="jus-input-group">
                            <label>Valor del JUS en Pesos ($)</label>
                            <input
                                type="text"
                                value={valores.NQN}
                                onChange={(e) => handleChange("NQN", e.target.value)}
                                placeholder="Ej: 15000"
                                disabled={saving}
                            />
                            <div className="current-value">
                                <span>Valor actual guardado:</span>
                                <strong>{formatCurrency(valoresActuales.NQN)}</strong>
                            </div>
                        </div>
                        <div className="config-buttons">
                            <button
                                className="btn-save"
                                onClick={() => handleGuardar("NQN")}
                                disabled={saving}
                            >
                                {saving ? <SpinnerIcon /> : "💾"} Guardar Neuquén
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Río Negro */}
            <div className="config-card">
                <div className="config-card-header">
                    <h2>🌊 Río Negro (RN)</h2>
                    <span className="badge">Ley Provincial</span>
                </div>
                <div className="config-card-body">
                    <div className="jus-form">
                        <div className="jus-input-group">
                            <label>Valor del JUS en Pesos ($)</label>
                            <input
                                type="text"
                                value={valores.RN}
                                onChange={(e) => handleChange("RN", e.target.value)}
                                placeholder="Ej: 14500"
                                disabled={saving}
                            />
                            <div className="current-value">
                                <span>Valor actual guardado:</span>
                                <strong>{formatCurrency(valoresActuales.RN)}</strong>
                            </div>
                        </div>
                        <div className="config-buttons">
                            <button
                                className="btn-save"
                                onClick={() => handleGuardar("RN")}
                                disabled={saving}
                            >
                                {saving ? <SpinnerIcon /> : "💾"} Guardar Río Negro
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="config-card">
                <div className="config-card-body">
                    <div className="info-box">
                        <h4>ℹ️ ¿Qué es el JUS?</h4>
                        <p>
                            El JUS es la unidad de medida arancelaria que utiliza el Poder Judicial para
                            determinar honorarios profesionales. Su valor se actualiza periódicamente por
                            el Tribunal Superior de Justicia de cada provincia. Al registrar tus honorarios
                            en JUS, el sistema los revaloriza automáticamente con cada aumento, protegiendo
                            tu trabajo de la inflación.
                        </p>
                    </div>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`success-toast ${message.type === "error" ? "error" : ""}`}
                    style={message.type === "error" ? { background: "#ef4444" } : {}}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

export default ConfiguracionJUS;
