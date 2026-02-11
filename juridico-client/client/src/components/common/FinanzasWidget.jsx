// src/components/common/FinanzasWidget.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import finanzasService from "../../services/finanzas.service";
import { SpinnerIcon } from "./Icons";
import "./FinanzasWidget.css";

const FinanzasWidget = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarDashboard();
    }, []);

    const cargarDashboard = async () => {
        try {
            setLoading(true);
            const response = await finanzasService.getDashboard("NQN");
            setDashboard(response.data);
        } catch (err) {
            console.error("Error al cargar dashboard financiero:", err);
            setError("No se pudo cargar");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    const getCobrabilidadClass = (ratio) => {
        if (ratio >= 70) return "high";
        if (ratio >= 40) return "medium";
        return "low";
    };

    if (loading) {
        return (
            <div className="finanzas-widget">
                <div className="finanzas-widget-header">
                    <h3>💰 Salud del Estudio</h3>
                </div>
                <div className="finanzas-loading">
                    <SpinnerIcon />
                    <span>Calculando métricas...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="finanzas-widget">
                <div className="finanzas-widget-header">
                    <h3>💰 Salud del Estudio</h3>
                </div>
                <div className="finanzas-loading">
                    <span>{error}</span>
                    <Link to="/dashboard/configuracion" style={{ color: "#f1c40f" }}>
                        Configurar JUS →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="finanzas-widget">
            <div className="finanzas-widget-header">
                <h3>💰 Salud del Estudio</h3>
                <Link to="/dashboard/configuracion">Configurar JUS</Link>
            </div>

            <div className="finanzas-widget-body">
                {/* Métricas principales */}
                <div className="finanzas-metrics">
                    <div className="finanzas-metric">
                        <div className="finanzas-metric-label">Caja Actual</div>
                        <div className={`finanzas-metric-value ${dashboard?.caja?.neto >= 0 ? "positive" : "danger"}`}>
                            {formatCurrency(dashboard?.caja?.neto)}
                        </div>
                    </div>

                    <div className="finanzas-metric">
                        <div className="finanzas-metric-label">Cartera Protegida</div>
                        <div className="finanzas-metric-value warning">
                            {formatCurrency(dashboard?.cartera?.total_pendiente_actualizado)}
                        </div>
                    </div>
                </div>

                {/* Ratio de Cobrabilidad */}
                <div className="cobrabilidad-section">
                    <div className="cobrabilidad-header">
                        <span className="cobrabilidad-label">Ratio de Cobrabilidad</span>
                        <span className="cobrabilidad-value">
                            {dashboard?.indicadores?.ratio_cobrabilidad || 0}%
                        </span>
                    </div>
                    <div className="cobrabilidad-bar">
                        <div
                            className={`cobrabilidad-fill ${getCobrabilidadClass(dashboard?.indicadores?.ratio_cobrabilidad)}`}
                            style={{ width: `${Math.min(dashboard?.indicadores?.ratio_cobrabilidad || 0, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Info JUS */}
                <div className="jus-info">
                    <span>
                        Valor JUS ({dashboard?.indicadores?.provincia}):
                        <span className="jus-value"> {formatCurrency(dashboard?.indicadores?.valor_jus_actual)}</span>
                    </span>
                    <span>
                        {dashboard?.cartera?.pendiente_jus || 0} JUS pendientes
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FinanzasWidget;
