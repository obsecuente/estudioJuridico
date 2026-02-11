// src/pages/finanzas/FinanzasDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import finanzasService from "../../services/finanzas.service";
import BackButton from "../../components/common/BackButton";
import { SpinnerIcon } from "../../components/common/Icons";
import "./FinanzasDashboard.css";

// ═══ CATEGORÍAS DE EGRESOS PRECARGADAS ═══
const CATEGORIAS_EGRESO = [
    { value: "caja_forense", label: "Caja Forense" },
    { value: "bono_ley", label: "Bono Ley" },
    { value: "alquiler", label: "Alquiler" },
    { value: "matricula", label: "Matrícula Colegio" },
    { value: "libreria", label: "Resmas/Librería" },
    { value: "aportes", label: "Aportes Obligatorios" },
    { value: "internet", label: "Internet/Sistemas" },
    { value: "otros", label: "Otros" },
];

// Gastos fijos mensuales típicos (categorías que se consideran estructura)
const CATEGORIAS_FIJAS = ["alquiler", "matricula", "internet", "aportes"];

const FinanzasDashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtros tabla
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Form egreso
    const [showEgresoForm, setShowEgresoForm] = useState(false);
    const [egresoData, setEgresoData] = useState({
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        categoria: "",
        descripcion: "",
    });
    const [submittingEgreso, setSubmittingEgreso] = useState(false);

    // Gastos fijos del mes (para punto de equilibrio)
    const [gastosFijosMes, setGastosFijosMes] = useState(0);
    const [ingresosPagadosMes, setIngresosPagadosMes] = useState(0);

    // ═══ CARGA DE DATOS ═══
    const cargarTodo = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [dashRes] = await Promise.all([
                finanzasService.getDashboard("NQN"),
            ]);
            setDashboard(dashRes.data || null);

            // Cargar movimientos con filtro
            await cargarMovimientos(1);

            // Estimar gastos fijos e ingresos del mes
            await cargarBreakevenData();
        } catch (err) {
            console.error("Error al cargar dashboard:", err);
            setError("No se pudieron cargar los datos financieros");
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarMovimientos = async (page = 1) => {
        try {
            const params = { page, limit: 10 };
            if (filtroTipo !== "todos") params.tipo = filtroTipo;

            const res = await finanzasService.getMovimientos(params);
            setMovimientos(res.data || []);
            setTotalPaginas(res.pagination?.totalPages || 1);
            setPagina(page);
        } catch (err) {
            console.error("Error al cargar movimientos:", err);
        }
    };

    const cargarBreakevenData = async () => {
        try {
            // Obtener todos los movimientos del mes actual para breakeven
            const mesActual = new Date().toISOString().slice(0, 7); // "2026-02"
            const resEgresos = await finanzasService.getMovimientos({
                tipo: "egreso",
                limit: 200,
            });
            const resIngresos = await finanzasService.getMovimientos({
                tipo: "ingreso",
                estado: "pagado",
                limit: 200,
            });

            const egresosMes = (resEgresos.data || []).filter(m =>
                m.createdAt && m.createdAt.slice(0, 7) === mesActual
            );
            const ingresosMes = (resIngresos.data || []).filter(m =>
                m.createdAt && m.createdAt.slice(0, 7) === mesActual
            );

            // Sumar gastos fijos (categorías de estructura)
            const fijos = egresosMes
                .filter(m => CATEGORIAS_FIJAS.includes(m.categoria))
                .reduce((sum, m) => sum + (parseFloat(m.monto_ars) || 0), 0);

            const ingresosCobrados = ingresosMes
                .reduce((sum, m) => sum + (parseFloat(m.monto_ars) || 0), 0);

            setGastosFijosMes(fijos);
            setIngresosPagadosMes(ingresosCobrados);
        } catch (err) {
            console.error("Error al cargar breakeven:", err);
        }
    };

    useEffect(() => {
        cargarTodo();
    }, [cargarTodo]);

    useEffect(() => {
        cargarMovimientos(1);
    }, [filtroTipo]);

    // ═══ ACCIONES ═══
    const handleEgresoSubmit = async (e) => {
        e.preventDefault();
        if (!egresoData.monto || !egresoData.categoria) return;
        setSubmittingEgreso(true);
        try {
            await finanzasService.crearMovimiento({
                tipo: "egreso",
                categoria: egresoData.categoria,
                descripcion: egresoData.descripcion || `Egreso: ${CATEGORIAS_EGRESO.find(c => c.value === egresoData.categoria)?.label || egresoData.categoria}`,
                monto_ars: parseFloat(egresoData.monto),
                estado: "pagado",
            });
            setShowEgresoForm(false);
            setEgresoData({ monto: "", fecha: new Date().toISOString().split("T")[0], categoria: "", descripcion: "" });
            await cargarTodo(); // Refrescar todo
        } catch (err) {
            console.error("Error al registrar egreso:", err);
        } finally {
            setSubmittingEgreso(false);
        }
    };

    // ═══ HELPERS ═══
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" });
    };

    const getRingClass = (ratio) => {
        if (ratio >= 70) return "ring-high";
        if (ratio >= 40) return "ring-mid";
        return "ring-low";
    };

    // SVG ring calculations
    const RING_RADIUS = 52;
    const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
    const ratioCobrabilidad = dashboard?.indicadores?.ratio_cobrabilidad || 0;
    const ringOffset = RING_CIRCUMFERENCE - (ratioCobrabilidad / 100) * RING_CIRCUMFERENCE;

    // Breakeven calculations
    const breakevenPercent = gastosFijosMes > 0
        ? Math.min((ingresosPagadosMes / gastosFijosMes) * 100, 150)
        : (ingresosPagadosMes > 0 ? 100 : 0);
    const breakevenCubierto = ingresosPagadosMes >= gastosFijosMes;

    // Ganancia por actualización (diferencia entre pendiente en JUS actualizado y pendiente en ARS original)
    const gananciaInflacion = dashboard
        ? (dashboard.cartera?.pendiente_jus_actualizado || 0) - ((dashboard.cartera?.pendiente_jus || 0) * (dashboard.indicadores?.valor_jus_actual || 0) * 0)
        : 0;

    // ═══ RENDER ═══
    if (loading) {
        return (
            <div className="fin-terminal">
                <div className="fin-loading">
                    <SpinnerIcon />
                    <span>Inicializando Terminal Financiera...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fin-terminal">
                <div className="fin-error">
                    <p>{error}</p>
                    <button onClick={cargarTodo}>Reintentar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fin-terminal">
            <BackButton />

            {/* Header */}
            <div className="fin-terminal-header">
                <h1>
                    Terminal Financiera
                    <span>•  Datos en tiempo real</span>
                </h1>
                <div className="fin-header-actions">
                    <Link to="/dashboard/configuracion" className="fin-btn">
                        Configurar JUS
                    </Link>
                    <button
                        className="fin-btn fin-btn-danger"
                        onClick={() => setShowEgresoForm(!showEgresoForm)}
                    >
                        {showEgresoForm ? "✕ Cerrar" : "＋ Registrar Egreso"}
                    </button>
                </div>
            </div>

            {/* JUS Info Bar */}
            <div className="fin-jus-bar">
                <span>
                    Valor JUS ({dashboard?.indicadores?.provincia || "NQN"}):
                    <span className="jus-value"> {formatCurrency(dashboard?.indicadores?.valor_jus_actual)}</span>
                </span>
                <span>
                    {dashboard?.indicadores?.total_movimientos || 0} movimientos registrados
                    {dashboard?.indicadores?.vista === "estudio_completo" ? " • Vista Admin" : ""}
                </span>
            </div>

            {/* ═══ KPI CARDS ═══ */}
            <div className="fin-kpi-grid">
                {/* Caja Neta */}
                <div className="fin-kpi-card kpi-caja">
                    <div className="fin-kpi-label">Caja Neta</div>
                    <div className={`fin-kpi-value ${(dashboard?.caja?.neto || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(dashboard?.caja?.neto)}
                    </div>
                    <div className="fin-kpi-hint">
                        Percibido <span className="gain">{formatCurrency(dashboard?.caja?.percibido)}</span>
                        {" — "}
                        Egresos <span className="loss">{formatCurrency(dashboard?.caja?.egresos)}</span>
                    </div>
                </div>

                {/* Cartera Protegida */}
                <div className="fin-kpi-card kpi-cartera">
                    <div className="fin-kpi-label">Cartera Protegida</div>
                    <div className="fin-kpi-value warning">
                        {formatCurrency(dashboard?.cartera?.total_pendiente_actualizado)}
                    </div>
                    <div className="fin-kpi-hint">
                        Recalculado al JUS de hoy
                        {dashboard?.cartera?.pendiente_jus_actualizado > 0 && (
                            <> • <span className="gain">↑ {formatCurrency(dashboard?.cartera?.pendiente_jus_actualizado)}</span> en JUS</>
                        )}
                    </div>
                </div>

                {/* JUS Pendientes */}
                <div className="fin-kpi-card kpi-jus">
                    <div className="fin-kpi-label">JUS Pendientes</div>
                    <div className="fin-kpi-value accent">
                        {dashboard?.cartera?.pendiente_jus || 0} <small style={{ fontSize: '0.6em', fontWeight: 400 }}>JUS</small>
                    </div>
                    <div className="fin-kpi-hint">
                        Valor unitario: <span className="gain">{formatCurrency(dashboard?.indicadores?.valor_jus_actual)}</span>
                    </div>
                </div>

                {/* Egresos */}
                <div className="fin-kpi-card kpi-egresos">
                    <div className="fin-kpi-label">Egresos Totales</div>
                    <div className="fin-kpi-value negative">
                        {formatCurrency(dashboard?.caja?.egresos)}
                    </div>
                    <div className="fin-kpi-hint">
                        {dashboard?.indicadores?.cuotas_vencidas > 0 && (
                            <span className="loss">⚠ {dashboard.indicadores.cuotas_vencidas} cuotas vencidas</span>
                        )}
                        {(dashboard?.indicadores?.cuotas_vencidas || 0) === 0 && "Sin alertas de cuotas"}
                    </div>
                </div>
            </div>

            {/* ═══ INDICADORES EJECUTIVOS ═══ */}
            <div className="fin-indicators-row">
                {/* Anillo de Cobrabilidad */}
                <div className="fin-ring-card">
                    <div className="fin-ring-container">
                        <svg className="fin-ring-svg" viewBox="0 0 130 130">
                            <circle className="fin-ring-bg" cx="65" cy="65" r={RING_RADIUS} />
                            <circle
                                className={`fin-ring-fill ${getRingClass(ratioCobrabilidad)}`}
                                cx="65"
                                cy="65"
                                r={RING_RADIUS}
                                strokeDasharray={RING_CIRCUMFERENCE}
                                strokeDashoffset={ringOffset}
                            />
                        </svg>
                        <div className="fin-ring-percent">
                            <span className="number">{ratioCobrabilidad.toFixed(0)}</span>
                            <span className="unit">% cobrado</span>
                        </div>
                    </div>
                    <div className="fin-ring-details">
                        <h4>Eficiencia de Cobro</h4>
                        <p>
                            Ratio entre honorarios efectivamente cobrados y el total generado
                            (actualizado al JUS de hoy).
                        </p>
                        <div className="fin-ring-legend">
                            <span>
                                <span className="dot green"></span>
                                Percibido: <span className="mono">{formatCurrency(dashboard?.caja?.percibido)}</span>
                            </span>
                            <span>
                                <span className="dot red"></span>
                                Pendiente: <span className="mono">{formatCurrency(dashboard?.cartera?.total_pendiente_actualizado)}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Punto de Equilibrio */}
                <div className="fin-breakeven-card">
                    <h4>Punto de Equilibrio Mensual</h4>
                    <div className="subtitle">Ingresos cobrados vs Gastos fijos de estructura del mes</div>
                    <div className="fin-breakeven-bar-container">
                        <div
                            className={`fin-breakeven-fill ${breakevenCubierto ? 'over' : 'under'}`}
                            style={{ width: `${Math.min(breakevenPercent, 100)}%` }}
                        />
                        {gastosFijosMes > 0 && (
                            <div
                                className="fin-breakeven-marker"
                                style={{ left: `${Math.min((gastosFijosMes / Math.max(ingresosPagadosMes, gastosFijosMes)) * 100, 100)}%` }}
                                title={`Punto de equilibrio: ${formatCurrency(gastosFijosMes)}`}
                            />
                        )}
                    </div>
                    <div className="fin-breakeven-labels">
                        <span>
                            Cobrado: <span className={`mono ${breakevenCubierto ? 'green' : 'red'}`}>{formatCurrency(ingresosPagadosMes)}</span>
                        </span>
                        <span>
                            Gastos Fijos: <span className="mono">{formatCurrency(gastosFijosMes)}</span>
                        </span>
                    </div>
                    <div className={`fin-breakeven-status ${breakevenCubierto ? 'covered' : 'deficit'}`}>
                        {breakevenCubierto
                            ? `✓ Costos cubiertos • Superávit: ${formatCurrency(ingresosPagadosMes - gastosFijosMes)}`
                            : `⚠ Faltan ${formatCurrency(gastosFijosMes - ingresosPagadosMes)} para cubrir costos fijos`
                        }
                    </div>
                </div>
            </div>

            {/* ═══ FORMULARIO DE EGRESO ═══ */}
            {showEgresoForm && (
                <div className="fin-section">
                    <form className="fin-egreso-form" onSubmit={handleEgresoSubmit}>
                        <div className="fin-form-row">
                            <div className="fin-form-field" style={{ maxWidth: 200 }}>
                                <label>Monto ($)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={egresoData.monto}
                                    onChange={(e) => setEgresoData(prev => ({ ...prev, monto: e.target.value }))}
                                    min="0"
                                    step="0.01"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="fin-form-field" style={{ maxWidth: 180 }}>
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    value={egresoData.fecha}
                                    onChange={(e) => setEgresoData(prev => ({ ...prev, fecha: e.target.value }))}
                                />
                            </div>
                            <div className="fin-form-field">
                                <label>Descripción (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Detalle del egreso..."
                                    value={egresoData.descripcion}
                                    onChange={(e) => setEgresoData(prev => ({ ...prev, descripcion: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="fin-form-row">
                            <div className="fin-form-field">
                                <label>Categoría</label>
                                <div className="fin-cat-chips">
                                    {CATEGORIAS_EGRESO.map((cat) => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            className={`fin-cat-chip ${egresoData.categoria === cat.value ? 'active' : ''}`}
                                            onClick={() => setEgresoData(prev => ({ ...prev, categoria: cat.value }))}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="fin-form-actions">
                            <button
                                type="button"
                                className="fin-btn"
                                onClick={() => setShowEgresoForm(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="fin-btn fin-btn-danger"
                                disabled={submittingEgreso || !egresoData.monto || !egresoData.categoria}
                            >
                                {submittingEgreso ? "Registrando..." : "Registrar Egreso"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ═══ TABLA DE MOVIMIENTOS ═══ */}
            <div className="fin-table-card">
                <div className="fin-table-header">
                    <h3>Movimientos Recientes</h3>
                    <div className="fin-table-filters">
                        {["todos", "ingreso", "egreso"].map((f) => (
                            <button
                                key={f}
                                className={`fin-filter-btn ${filtroTipo === f ? 'active' : ''}`}
                                onClick={() => setFiltroTipo(f)}
                            >
                                {f === "todos" ? "Todos" : f === "ingreso" ? "Ingresos" : "Egresos"}
                            </button>
                        ))}
                    </div>
                </div>
                <table className="fin-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Descripción</th>
                            <th>Monto</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimientos.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="fin-table-empty">
                                    No hay movimientos registrados
                                </td>
                            </tr>
                        ) : (
                            movimientos.map((mov) => (
                                <tr key={mov.id_movimiento || mov.id}>
                                    <td className="mono">{formatDate(mov.createdAt)}</td>
                                    <td>
                                        <span className={`fin-badge tipo-${mov.tipo}`}>
                                            {mov.tipo}
                                        </span>
                                    </td>
                                    <td>
                                        {mov.descripcion?.substring(0, 50)}
                                        {mov.categoria && (
                                            <small style={{ color: 'var(--fin-slate-light)', marginLeft: 6 }}>
                                                {CATEGORIAS_EGRESO.find(c => c.value === mov.categoria)?.label || mov.categoria}
                                            </small>
                                        )}
                                    </td>
                                    <td className={`mono ${mov.tipo}`}>
                                        {mov.tipo === "egreso" ? "−" : "+"}{formatCurrency(mov.monto_ars)}
                                        {mov.monto_jus > 0 && (
                                            <small style={{ color: '#818cf8', marginLeft: 4 }}>
                                                ({mov.monto_jus} JUS)
                                            </small>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`fin-badge estado-${mov.estado}`}>
                                            {mov.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {totalPaginas > 1 && (
                    <div className="fin-table-pagination">
                        <span>Página {pagina} de {totalPaginas}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                className="fin-btn"
                                disabled={pagina <= 1}
                                onClick={() => cargarMovimientos(pagina - 1)}
                            >
                                ← Anterior
                            </button>
                            <button
                                className="fin-btn"
                                disabled={pagina >= totalPaginas}
                                onClick={() => cargarMovimientos(pagina + 1)}
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinanzasDashboard;
