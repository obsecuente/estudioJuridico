// src/pages/finanzas/EstadisticasFinanzas.jsx
import { useState, useEffect } from "react";
import finanzasService from "../../services/finanzas.service";
import BackButton from "../../components/common/BackButton";

import ModalFrame from "../../components/common/ModalFrame";
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

const CAT_LABELS = {
    alquiler: "Alquiler",
    servicios: "Servicios",
    caja_forense: "Caja Forense",
    apertura_carpeta: "Apertura Carpeta",
    honorarios: "Honorarios",
    consulta: "Consulta",
    impuestos: "Impuestos",
    insumos: "Insumos",
    aportes: "Aportes",
    libreria: "Librería",
    otros: "Otros",
};

const EstadisticasFinanzas = () => {
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);


    // Detail modal state
    const [detailModal, setDetailModal] = useState({ open: false, mes: null, nombre: "" });
    const [detailData, setDetailData] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailFilter, setDetailFilter] = useState("todos"); // todos | ingreso | egreso

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await finanzasService.getEstadisticas(anio);
            setStats(res.data || null);
        } catch (err) {
            console.error("Error cargando estadísticas:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [anio]);



    // Open monthly detail modal
    const openDetailModal = async (mesNum) => {
        const nombreMes = MESES[mesNum - 1];
        setDetailModal({ open: true, mes: mesNum, nombre: nombreMes });
        setDetailFilter("todos");
        setDetailLoading(true);

        try {
            const inicioMes = new Date(anio, mesNum - 1, 1).toISOString();
            const finMes = new Date(anio, mesNum, 0, 23, 59, 59).toISOString();

            const res = await finanzasService.getMovimientos({
                fecha_desde: inicioMes,
                fecha_hasta: finMes,
                limit: 200,
            });
            setDetailData(res.data || []);
        } catch (err) {
            console.error("Error cargando detalle:", err);
            setDetailData([]);
        } finally {
            setDetailLoading(false);
        }
    };

    const filteredDetail = detailFilter === "todos"
        ? detailData
        : detailData.filter(m => m.tipo === detailFilter);

    const maxVolumen = stats?.meses?.reduce((mx, m) => Math.max(mx, m.ingresos + m.egresos), 0) || 1;

    return (
        <div className="est-terminal">
            {/* ═══ HEADER ═══ */}
            <div className="est-header">
                <div className="est-header-left">
                    <BackButton to="/dashboard/finanzas" />
                    <h1>Terminal de Estadísticas</h1>
                </div>
                <div className="est-year-nav">
                    <button className="est-year-btn" onClick={() => setAnio(anio - 1)}>‹</button>
                    <span className="est-year-display">{anio}</span>
                    <button className="est-year-btn" onClick={() => setAnio(anio + 1)}>›</button>
                </div>
            </div>

            {loading ? (
                <div className="est-loading"><SpinnerIcon /> Calculando datos en tiempo real...</div>
            ) : stats ? (
                <>
                    {/* ═══ RESUMEN EJECUTIVO ANUAL ═══ */}
                    <div className="est-summary-row">
                        <div className="est-summary-card">
                            <span className="est-summary-label">INGRESOS {anio}</span>
                            <span className="est-summary-value positive">{formatCurrency(stats.total_ingresos)}</span>
                        </div>
                        <div className="est-summary-card">
                            <span className="est-summary-label">EGRESOS {anio}</span>
                            <span className="est-summary-value negative">{formatCurrency(stats.total_egresos)}</span>
                        </div>
                        <div className="est-summary-card est-summary-neto">
                            <span className="est-summary-label">RESULTADO NETO</span>
                            <span className={`est-summary-value ${stats.resultado_neto >= 0 ? 'positive' : 'negative'}`}>
                                {stats.resultado_neto >= 0 ? '+' : ''}{formatCurrency(stats.resultado_neto)}
                            </span>
                        </div>
                    </div>

                    {/* ═══ GRID DE MESES ═══ */}
                    <div className="est-grid">
                        {stats.meses.map((mesData) => {
                            const nombreMes = MESES[mesData.mes - 1];
                            const totalVol = mesData.ingresos + mesData.egresos;
                            const pctIng = totalVol > 0 ? (mesData.ingresos / totalVol) * 100 : 50;
                            const barWidth = maxVolumen > 0 ? ((totalVol / maxVolumen) * 100) : 0;

                            return (
                                <div
                                    key={mesData.mes}
                                    className={`est-card${mesData.es_actual ? ' est-card-actual' : ''}`}
                                    onClick={() => openDetailModal(mesData.mes)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && openDetailModal(mesData.mes)}
                                >
                                    {/* Header */}
                                    <div className="est-card-head">
                                        <span className="est-card-month">
                                            {nombreMes}
                                            {mesData.es_actual && <span className="est-live-badge">EN CURSO</span>}
                                        </span>
                                        <span className={`est-card-balance ${mesData.balance >= 0 ? 'positive' : 'negative'}`}>
                                            {mesData.balance >= 0 ? '+' : ''}{formatCurrency(mesData.balance)}
                                        </span>
                                    </div>

                                    {/* Ingresos / Egresos */}
                                    <div className="est-card-rows">
                                        <div className="est-card-row">
                                            <span className="est-row-label">Ingresos</span>
                                            <span className="est-row-val positive">{formatCurrency(mesData.ingresos)}</span>
                                        </div>
                                        <div className="est-card-row">
                                            <span className="est-row-label">Egresos</span>
                                            <span className="est-row-val negative">{formatCurrency(mesData.egresos)}</span>
                                        </div>
                                    </div>

                                    {/* Mini bar */}
                                    <div className="est-bar-container">
                                        <div className="est-bar-track" style={{ width: `${Math.max(barWidth, 8)}%` }}>
                                            <div className="est-bar-ing" style={{ width: `${pctIng}%` }} />
                                            <div className="est-bar-egr" style={{ width: `${100 - pctIng}%` }} />
                                        </div>
                                    </div>

                                    {/* Top categorías egreso */}
                                    {mesData.top_categorias?.length > 0 && (
                                        <div className="est-card-cats">
                                            <span className="est-cats-title">Top Egresos</span>
                                            {mesData.top_categorias.map((tc, i) => (
                                                <div key={i} className="est-cat-item">
                                                    <span className="est-cat-name">{CAT_LABELS[tc.categoria] || tc.categoria}</span>
                                                    <span className="est-cat-val">{formatCurrency(tc.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Casos + hint */}
                                    <div className="est-card-foot">
                                        <span>+{mesData.casos_nuevos} nuevos</span>
                                        <span>•</span>
                                        <span>{mesData.casos_cerrados} cerrados</span>
                                        <span className="est-detail-hint">Click para ver detalle →</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>


                </>
            ) : (
                <div className="est-loading">No se pudieron cargar las estadísticas</div>
            )}

            {/* ═══ DETAIL MODAL ═══ */}
            {detailModal.open && (
                <ModalFrame
                    title={`Movimientos — ${detailModal.nombre} ${anio}`}
                    onClose={() => setDetailModal({ open: false, mes: null, nombre: "" })}
                >
                    <div className="est-detail-modal">
                        {/* Filter tabs */}
                        <div className="est-detail-filters">
                            {["todos", "ingreso", "egreso"].map(f => (
                                <button
                                    key={f}
                                    className={`est-detail-filter-btn ${detailFilter === f ? 'active' : ''}`}
                                    onClick={() => setDetailFilter(f)}
                                >
                                    {f === "todos" ? "Todos" : f === "ingreso" ? "Ingresos" : "Egresos"}
                                    <span className="est-filter-count">
                                        {f === "todos"
                                            ? detailData.length
                                            : detailData.filter(m => m.tipo === f).length
                                        }
                                    </span>
                                </button>
                            ))}
                        </div>

                        {detailLoading ? (
                            <div className="est-detail-loading"><SpinnerIcon /> Cargando movimientos...</div>
                        ) : filteredDetail.length === 0 ? (
                            <div className="est-detail-empty">No hay movimientos para este período</div>
                        ) : (
                            <div className="est-detail-list">
                                {filteredDetail.map((mov) => (
                                    <div key={mov.id_movimiento} className={`est-detail-item ${mov.tipo}`}>
                                        <div className="est-detail-left">
                                            <span className={`est-detail-tipo-badge ${mov.tipo}`}>
                                                {mov.tipo === "ingreso" ? "▲" : "▼"}
                                            </span>
                                            <div className="est-detail-info">
                                                <span className="est-detail-desc">
                                                    {mov.descripcion || CAT_LABELS[mov.categoria] || mov.categoria}
                                                </span>
                                                <span className="est-detail-meta">
                                                    {CAT_LABELS[mov.categoria] || mov.categoria}
                                                    {mov.cliente && ` • ${mov.cliente.nombre} ${mov.cliente.apellido}`}
                                                    {mov.caso && ` • ${mov.caso.descripcion}`}
                                                </span>
                                                <span className="est-detail-date">
                                                    {new Date(mov.fecha_cobro || mov.fecha_pago || mov.createdAt).toLocaleDateString("es-AR")}
                                                    {mov.estado && mov.estado !== "pagado" && (
                                                        <span className="est-detail-estado">{mov.estado}</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`est-detail-monto ${mov.tipo}`}>
                                            {mov.tipo === "ingreso" ? "+" : "-"}{formatCurrency(mov.monto_ars)}
                                        </span>
                                    </div>
                                ))}

                                {/* Summary */}
                                <div className="est-detail-summary">
                                    <div className="est-detail-summary-row">
                                        <span>Total Ingresos ({detailData.filter(m => m.tipo === "ingreso").length})</span>
                                        <span className="positive">
                                            {formatCurrency(detailData.filter(m => m.tipo === "ingreso").reduce((s, m) => s + parseFloat(m.monto_ars || 0), 0))}
                                        </span>
                                    </div>
                                    <div className="est-detail-summary-row">
                                        <span>Total Egresos ({detailData.filter(m => m.tipo === "egreso").length})</span>
                                        <span className="negative">
                                            {formatCurrency(detailData.filter(m => m.tipo === "egreso").reduce((s, m) => s + parseFloat(m.monto_ars || 0), 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalFrame>
            )}


        </div>
    );
};

export default EstadisticasFinanzas;
