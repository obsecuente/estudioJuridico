// src/pages/finanzas/EstadisticasFinanzas.jsx
import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import finanzasService from "../../services/finanzas.service";
import BackButton from "../../components/common/BackButton";
import DeleteModal from "../../components/common/DeleteModal";
import { SpinnerIcon } from "../../components/common/Icons";
import "./EstadisticasFinanzas.css";

const formatCurrency = (val) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(val || 0);

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const EstadisticasFinanzas = () => {
    const { user } = useContext(AuthContext);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [cierres, setCierres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await finanzasService.getCierres(anio);
            setCierres(res.data || []);
        } catch (err) {
            console.error("Error cargando estadísticas:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [anio]);

    const handleGenerarManualClick = () => {
        setShowConfirmModal(true);
    };

    const executeGenerarManual = async () => {
        setShowConfirmModal(false);
        setRegenerating(true);
        try {
            // Generar del mes anterior al actual
            const hoy = new Date();
            let mes = hoy.getMonth();
            let anioTarget = hoy.getFullYear();
            if (mes === 0) {
                mes = 12;
                anioTarget -= 1;
            }

            await finanzasService.generarCierreManual(mes, anioTarget);
            await loadData();
            // alert("Cierre generado/actualizado exitosamente."); 
            // Podríamos usar un toast aquí, pero por ahora quitamos el alert molesto o lo dejamos si el usuario quiere confirmación de éxito.
            // El usuario pidió quitar el window.alert de confirmación, el de éxito es aceptable o mejor un toast. 
            // Asumiremos que el cambio de estado en la UI es suficiente feedback o dejaremos un log.
        } catch (err) {
            console.error(err);
            alert("Error al generar cierre.");
        } finally {
            setRegenerating(false);
        }
    };

    // Agrupar o completar meses faltantes
    const getCierreMes = (mesIndex) => { // 1-12
        return cierres.find(c => c.mes === mesIndex) || null;
    };

    return (
        <div className="estadisticas-container">
            <div className="estadisticas-header">
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <BackButton to="/dashboard/finanzas" />
                    <h1>Estadísticas Históricas</h1>
                </div>

                <div className="year-selector">
                    <button className="year-btn" onClick={() => setAnio(anio - 1)}>←</button>
                    <div className="year-display">{anio}</div>
                    <button className="year-btn" onClick={() => setAnio(anio + 1)}>→</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}><SpinnerIcon /></div>
            ) : (
                <>
                    <div className="stats-grid">
                        {MESES.map((nombreMes, index) => {
                            const mesNum = index + 1;
                            // Mostrar solo hasta mes actual si es este año
                            const esFuturo = anio === new Date().getFullYear() && mesNum > new Date().getMonth() + 1;
                            if (esFuturo) return null;

                            const cierre = getCierreMes(mesNum);
                            const balance = cierre ? parseFloat(cierre.balance) : 0;
                            const ing = cierre ? parseFloat(cierre.total_ingresos) : 0;
                            const egr = cierre ? parseFloat(cierre.total_egresos) : 0;
                            const totalVol = ing + egr;
                            const pctIng = totalVol > 0 ? (ing / totalVol) * 100 : 0;

                            return (
                                <div key={mesNum} className={`stat-card monthly${cierre?.es_provisional ? ' stat-card-actual' : ''}`}>
                                    <div className="stat-card-header">
                                        <div className="stat-month">
                                            {nombreMes}
                                            {cierre?.es_provisional && (
                                                <span style={{
                                                    marginLeft: 8,
                                                    fontSize: '0.65rem',
                                                    background: 'rgba(212,175,55,0.2)',
                                                    color: '#d4af37',
                                                    padding: '2px 6px',
                                                    borderRadius: 4,
                                                    fontWeight: 700,
                                                    letterSpacing: '0.5px',
                                                }}>EN CURSO</span>
                                            )}
                                        </div>
                                        <div className={`stat-balance-tag ${balance >= 0 ? 'positive' : 'negative'}`}>
                                            {formatCurrency(balance)}
                                        </div>
                                    </div>

                                    <div className="stat-row">
                                        <span className="stat-label">Ingresos</span>
                                        <span className="stat-value ingreso">+{formatCurrency(ing)}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Egresos</span>
                                        <span className="stat-value egreso">-{formatCurrency(egr)}</span>
                                    </div>

                                    {/* Mini chart */}
                                    <div className="bar-chart">
                                        <div className="bar-segment ingreso" style={{ width: `${pctIng}%` }}></div>
                                        <div className="bar-segment egreso" style={{ flex: 1 }}></div>
                                    </div>

                                    {cierre && (
                                        <div className="stat-cases">
                                            <span>+{cierre.cantidad_casos_nuevos} casos nuevos</span>
                                            <span>•</span>
                                            <span>{cierre.cantidad_casos_cerrados} cerrados</span>
                                        </div>
                                    )}
                                    {!cierre && <div className="stat-cases">Sin datos registrados</div>}
                                </div>
                            );
                        })}
                    </div>

                    {user?.rol === "admin" && (
                        <div className="manual-close-section">
                            <div>
                                <h3>🛠️ Herramientas de Admin</h3>
                                <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                                    El cierre mensual se ejecuta automáticamente el día 1 de cada mes a las 02:00 hs.
                                    Podés forzar una actualización del mes pasado si hubo cambios recientes.
                                </p>
                            </div>
                            <button className="close-btn" onClick={handleGenerarManualClick} disabled={regenerating}>
                                {regenerating ? "Procesando..." : "Regenerar Cierre Mes Anterior"}
                            </button>
                        </div>
                    )}
                </>
            )}

            <DeleteModal
                isOpen={showConfirmModal}
                onConfirm={executeGenerarManual}
                onCancel={() => setShowConfirmModal(false)}
                title="¿Regenerar Cierre?"
                message="Esto recalculará el balance del mes pasado basándose en los movimientos actuales. Si editaste movimientos antiguos, esto actualizará el historial."
                confirmLabel="Sí, Regenerar"
                confirmVariant="warning"
            />
        </div>
    );
};

export default EstadisticasFinanzas;
