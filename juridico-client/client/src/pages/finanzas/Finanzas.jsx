// src/pages/finanzas/Finanzas.jsx
// LEGACY — Redirige a FinanzasDashboard
// Este archivo se mantiene por compatibilidad, pero App.jsx ya apunta a FinanzasDashboard
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import finanzasService from "../../services/finanzas.service";
import BackButton from "../../components/common/BackButton";
import { SpinnerIcon } from "../../components/common/Icons";
import "./Finanzas.css";

const Finanzas = () => {
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const response = await finanzasService.getDashboard();
            // response = { success, data: { caja, cartera, indicadores } }
            console.log("📊 Finanzas.jsx — response:", response);
            setDatos(response.data);
        } catch (err) {
            console.error("Error al cargar finanzas:", err);
            setError("No se pudieron cargar los datos financieros");
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

    // Correct mapping: datos = { caja: { percibido, egresos, neto }, cartera: { total_pendiente_actualizado, pendiente_jus }, indicadores: { ratio_cobrabilidad, valor_jus_actual } }
    const ratioCobrabilidad = datos?.indicadores?.ratio_cobrabilidad || 0;

    if (loading) {
        return (
            <div className="finanzas-container">
                <div className="finanzas-loading">
                    <SpinnerIcon />
                    <span>Cargando datos financieros...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="finanzas-container">
                <div className="finanzas-error">
                    <span>⚠️ {error}</span>
                    <button onClick={cargarDatos}>Reintentar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="finanzas-container">
            <BackButton />
            <div className="finanzas-header">
                <h1>💰 Finanzas</h1>
                <p>Resumen financiero del estudio - Datos confidenciales</p>
            </div>

            {/* Métricas Principales */}
            <div className="finanzas-grid">
                <div className="finanzas-card caja">
                    <div className="finanzas-card-icon">💵</div>
                    <div className="finanzas-card-content">
                        <span className="finanzas-card-label">Caja Actual</span>
                        <span className="finanzas-card-value">{formatCurrency(datos?.caja?.neto)}</span>
                        <span className="finanzas-card-hint">Ingresos pagados - Egresos</span>
                    </div>
                </div>

                <div className="finanzas-card cartera">
                    <div className="finanzas-card-icon">🛡️</div>
                    <div className="finanzas-card-content">
                        <span className="finanzas-card-label">Cartera Protegida</span>
                        <span className="finanzas-card-value">{formatCurrency(datos?.cartera?.total_pendiente_actualizado)}</span>
                        <span className="finanzas-card-hint">Deuda actualizada al JUS de hoy</span>
                    </div>
                </div>

                <div className="finanzas-card jus">
                    <div className="finanzas-card-icon">⚖️</div>
                    <div className="finanzas-card-content">
                        <span className="finanzas-card-label">JUS Pendientes</span>
                        <span className="finanzas-card-value">{datos?.cartera?.pendiente_jus || 0} JUS</span>
                        <span className="finanzas-card-hint">Valor actual: {formatCurrency(datos?.indicadores?.valor_jus_actual)}</span>
                    </div>
                </div>

                <div className="finanzas-card ratio">
                    <div className="finanzas-card-icon">📊</div>
                    <div className="finanzas-card-content">
                        <span className="finanzas-card-label">Ratio de Cobrabilidad</span>
                        <span className="finanzas-card-value">{ratioCobrabilidad}%</span>
                        <div className="ratio-bar">
                            <div className="ratio-fill" style={{ width: `${Math.min(ratioCobrabilidad, 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="finanzas-actions">
                <Link to="/dashboard/configuracion" className="finanzas-action-btn">
                    ⚙️ Configurar valores JUS
                </Link>
            </div>

            {/* Info */}
            <div className="finanzas-info">
                <h4>ℹ️ Acerca de estos datos</h4>
                <p>
                    La <strong>Caja Actual</strong> representa los ingresos efectivamente cobrados menos los egresos registrados.
                </p>
                <p>
                    La <strong>Cartera Protegida</strong> son los honorarios pendientes de cobro, actualizados automáticamente con el valor del JUS.
                    Esto protege tus honorarios de la inflación.
                </p>
                <p>
                    El <strong>Ratio de Cobrabilidad</strong> indica qué porcentaje de tu cartera está actualmente convertido en efectivo.
                </p>
            </div>
        </div>
    );
};

export default Finanzas;
