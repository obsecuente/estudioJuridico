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
            console.log("📊 FinanzasWidget raw response:", response);
            console.log("📊 FinanzasWidget .data:", response.data);
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

    const getRingClass = (ratio) => {
        if (ratio >= 70) return "ring-high";
        if (ratio >= 40) return "ring-mid";
        return "ring-low";
    };

    const ratio = dashboard?.indicadores?.ratio_cobrabilidad || 0;
    const R = 28;
    const C = 2 * Math.PI * R;
    const offset = C - (ratio / 100) * C;

    if (loading) {
        return (
            <div className="finanzas-widget finw-terminal">
                <div className="finw-header">
                    <h3>Terminal Financiera</h3>
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
            <div className="finanzas-widget finw-terminal">
                <div className="finw-header">
                    <h3>Terminal Financiera</h3>
                </div>
                <div className="finanzas-loading">
                    <span>{error}</span>
                    <Link to="/dashboard/configuracion" style={{ color: "#818cf8" }}>
                        Configurar JUS →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="finanzas-widget finw-terminal">
            <div className="finw-header">
                <h3>Terminal Financiera</h3>
                <Link to="/dashboard/finanzas" className="finw-link">
                    Abrir →
                </Link>
            </div>

            <div className="finw-body">
                {/* Mini KPIs */}
                <div className="finw-kpis">
                    <div className="finw-kpi">
                        <span className="finw-kpi-label">Caja Neta</span>
                        <span className={`finw-kpi-value ${(dashboard?.caja?.neto || 0) >= 0 ? 'pos' : 'neg'}`}>
                            {formatCurrency(dashboard?.caja?.neto)}
                        </span>
                    </div>
                    <div className="finw-kpi">
                        <span className="finw-kpi-label">Cartera</span>
                        <span className="finw-kpi-value warn">
                            {formatCurrency(dashboard?.cartera?.total_pendiente_actualizado)}
                        </span>
                    </div>
                </div>

                {/* Mini Ring + Ratio */}
                <div className="finw-ring-row">
                    <div className="finw-mini-ring">
                        <svg viewBox="0 0 64 64" width="48" height="48">
                            <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(51,65,85,0.6)" strokeWidth="5" />
                            <circle
                                cx="32" cy="32" r={R}
                                fill="none"
                                strokeWidth="5"
                                strokeLinecap="round"
                                className={getRingClass(ratio)}
                                strokeDasharray={C}
                                strokeDashoffset={offset}
                                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease' }}
                            />
                        </svg>
                        <span className="finw-ring-percent">{ratio.toFixed(0)}%</span>
                    </div>
                    <div className="finw-ring-info">
                        <span className="finw-ring-title">Eficiencia de Cobro</span>
                        <span className="finw-ring-sub">
                            {dashboard?.cartera?.pendiente_jus || 0} JUS pendientes
                            <br />
                            JUS: <span className="finw-mono">{formatCurrency(dashboard?.indicadores?.valor_jus_actual)}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanzasWidget;
