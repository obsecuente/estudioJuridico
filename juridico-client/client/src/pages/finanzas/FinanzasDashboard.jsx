import { useState, useEffect, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api"; // Importar API directa para cargar clientes/casos
import { AuthContext } from "../../context/AuthContext";
import finanzasService from "../../services/finanzas.service";
import abogadosService from "../../services/abogados.service";
import BackButton from "../../components/common/BackButton";
import DeleteModal from "../../components/common/DeleteModal";
import DetalleCuotas from "../../components/common/DetalleCuotas";
import { DineroIcon, SpinnerIcon } from "../../components/common/Icons";
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

const loadCustomCats = () => {
    try {
        return JSON.parse(localStorage.getItem("custom_categorias_egreso") || "[]");
    } catch { return []; }
};
const saveCustomCats = (cats) => localStorage.setItem("custom_categorias_egreso", JSON.stringify(cats));

const getCatLabel = (val) => {
    const found = CATEGORIAS_EGRESO.find(c => c.value === val);
    if (found) return found.label;
    const custom = loadCustomCats().find(c => c.value === val);
    return custom?.label || val;
};

const FinanzasDashboard = () => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.rol === "admin";

    const [dashboard, setDashboard] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Admin: filtro por abogado
    const [abogados, setAbogados] = useState([]);
    const [abogadoFiltro, setAbogadoFiltro] = useState("");

    // Filtros tabla
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Form egreso
    const [showEgresoForm, setShowEgresoForm] = useState(false);
    const [egresoData, setEgresoData] = useState({
        monto: "", fecha: new Date().toISOString().split("T")[0], categoria: "", descripcion: "",
        es_gasto_fijo: false, dia_vencimiento: "", pagado: true,
    });
    // Form ingreso
    const [showIngresoForm, setShowIngresoForm] = useState(false);
    const [ingresoData, setIngresoData] = useState({
        monto: "", fecha: new Date().toISOString().split("T")[0], categoria: "honorarios", descripcion: "",
        id_cliente: "", id_caso: "",
        es_plan_cuotas: false, cantidad_cuotas: 1, fecha_primera_cuota: new Date().toISOString().split("T")[0],
    });
    const [clientes, setClientes] = useState([]);
    const [casosCliente, setCasosCliente] = useState([]);
    const [loadingClientes, setLoadingClientes] = useState(false);

    const [submittingEgreso, setSubmittingEgreso] = useState(false);
    const [submittingIngreso, setSubmittingIngreso] = useState(false);
    const [customCats, setCustomCats] = useState(loadCustomCats);
    const [showNewCatInput, setShowNewCatInput] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const allCategorias = [...CATEGORIAS_EGRESO, ...customCats];

    // Gastos recurrentes
    const [gastosRecurrentes, setGastosRecurrentes] = useState([]);
    const [pendientesMes, setPendientesMes] = useState([]);

    // Pin-as-monthly inline state
    const [pinningId, setPinningId] = useState(null);
    const [pinDay, setPinDay] = useState("");
    const [pinSubmitting, setPinSubmitting] = useState(false);

    // DeleteModal state for payment confirmation
    const [confirmModal, setConfirmModal] = useState({ open: false, id: null, nombre: "", monto: 0 });
    // Undo state
    const [recentlyPaid, setRecentlyPaid] = useState(null);
    const [undoTimer, setUndoTimer] = useState(null);

    // ═══ CARGA DE DATOS ═══
    const cargarTodo = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Admin: cargar lista de abogados
            if (isAdmin && abogados.length === 0) {
                try {
                    const abogadosRes = await abogadosService.getAll();
                    setAbogados(abogadosRes.data || []);
                } catch (e) { console.error("Error cargando abogados:", e); }
            }

            const idAbogadoParam = isAdmin && abogadoFiltro ? abogadoFiltro : null;
            const [dashRes] = await Promise.all([
                finanzasService.getDashboard("NQN", idAbogadoParam),
            ]);
            setDashboard(dashRes.data || null);
            await Promise.all([
                cargarMovimientos(1),
                cargarGastosRecurrentes(),
            ]);
        } catch (err) {
            console.error("Error al cargar dashboard:", err);
            setError("No se pudieron cargar los datos financieros");
        } finally {
            setLoading(false);
        }
    }, [abogadoFiltro]);

    const cargarMovimientos = async (page = 1) => {
        try {
            const params = { page, limit: 10 };
            if (filtroTipo !== "todos") params.tipo = filtroTipo;
            if (isAdmin && abogadoFiltro) params.id_abogado = abogadoFiltro;
            const res = await finanzasService.getMovimientos(params);
            setMovimientos(res.data || []);
            setTotalPaginas(res.pagination?.totalPages || 1);
            setPagina(page);
        } catch (err) {
            console.error("Error al cargar movimientos:", err);
        }
    };

    const cargarGastosRecurrentes = async () => {
        try {
            const [gastosRes, pendientesRes] = await Promise.all([
                finanzasService.getGastosRecurrentes(),
                finanzasService.getPendientesMes(),
            ]);
            setGastosRecurrentes(gastosRes.data || []);
            setPendientesMes(pendientesRes.data || []);
        } catch (err) {
            console.error("Error al cargar gastos recurrentes:", err);
        }
    };

    useEffect(() => { cargarTodo(); }, [cargarTodo]);

    useEffect(() => { cargarMovimientos(1); }, [filtroTipo]);

    // Cargar clientes al abrir form de ingreso
    useEffect(() => {
        if (showIngresoForm && clientes.length === 0) {
            setLoadingClientes(true);
            api.get("/clientes?limit=1000")
                .then(res => setClientes(res.data.data || []))
                .catch(err => console.error(err))
                .finally(() => setLoadingClientes(false));
        }
    }, [showIngresoForm]);

    // Cargar casos al seleccionar cliente
    useEffect(() => {
        if (ingresoData.id_cliente) {
            api.get(`/casos?id_cliente=${ingresoData.id_cliente}`)
                .then(res => setCasosCliente(res.data.data || []))
                .catch(err => console.error(err));
        } else {
            setCasosCliente([]);
        }
    }, [ingresoData.id_cliente]);

    // ═══ ACCIONES ═══
    const addCustomCat = () => {
        const name = newCatName.trim();
        if (!name) return;
        const value = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        if (allCategorias.some(c => c.value === value)) {
            setEgresoData(prev => ({ ...prev, categoria: value }));
            setShowNewCatInput(false); setNewCatName("");
            return;
        }
        const newCat = { value, label: name };
        const updated = [...customCats, newCat];
        setCustomCats(updated);
        saveCustomCats(updated);
        setEgresoData(prev => ({ ...prev, categoria: value }));
        setShowNewCatInput(false); setNewCatName("");
    };

    const handleEgresoSubmit = async (e) => {
        e.preventDefault();
        if (!egresoData.monto || !egresoData.categoria) return;
        setSubmittingEgreso(true);
        try {
            await finanzasService.crearMovimiento({
                tipo: "egreso",
                categoria: egresoData.categoria,
                descripcion: egresoData.descripcion || `Egreso: ${getCatLabel(egresoData.categoria)}`,
                monto_ars: parseFloat(egresoData.monto),
                estado: egresoData.pagado ? "pagado" : "pendiente",
                es_gasto_fijo: egresoData.es_gasto_fijo,
                dia_vencimiento: egresoData.es_gasto_fijo ? parseInt(egresoData.dia_vencimiento) : null,
                fecha_pago: egresoData.fecha // Enviar fecha real
            });
            setShowEgresoForm(false);
            setEgresoData({ monto: "", fecha: new Date().toISOString().split("T")[0], categoria: "", descripcion: "", es_gasto_fijo: false, dia_vencimiento: "", pagado: true });
            await cargarTodo();
        } catch (err) {
            console.error("Error al registrar egreso:", err);
        } finally {
            setSubmittingEgreso(false);
        }
    };

    const handleIngresoSubmit = async (e) => {
        e.preventDefault();
        if (!ingresoData.monto || !ingresoData.categoria) return;
        setSubmittingIngreso(true);
        try {
            const planCuotas = ingresoData.es_plan_cuotas ? {
                cantidad: parseInt(ingresoData.cantidad_cuotas),
                fecha_primera: ingresoData.fecha_primera_cuota
            } : null;

            await finanzasService.crearMovimiento({
                tipo: "ingreso",
                categoria: ingresoData.categoria,
                descripcion: ingresoData.descripcion || "Honorarios profesionales",
                monto_ars: parseFloat(ingresoData.monto),
                estado: ingresoData.es_plan_cuotas ? "parcial" : "pagado", // Si no es cuotas, asumimos cobrado hoy o en fecha
                id_cliente: ingresoData.id_cliente || null,
                id_caso: ingresoData.id_caso || null,
                fecha_cobro: ingresoData.es_plan_cuotas ? null : ingresoData.fecha, // Si es contado, usamos la fecha indicada
                plan_cuotas: planCuotas
            });
            setShowIngresoForm(false);
            setIngresoData({
                monto: "", fecha: new Date().toISOString().split("T")[0], categoria: "honorarios", descripcion: "",
                id_cliente: "", id_caso: "",
                es_plan_cuotas: false, cantidad_cuotas: 1, fecha_primera_cuota: new Date().toISOString().split("T")[0],
            });
            await cargarTodo();
        } catch (err) {
            console.error("Error al registrar ingreso:", err);
            setError("Error al registrar ingreso: " + (err.response?.data?.error || err.message));
        } finally {
            setSubmittingIngreso(false);
        }
    };

    // Pin as monthly
    const handlePinAsMonthly = async (mov) => {
        if (!pinDay || pinDay < 1 || pinDay > 28) return;
        setPinSubmitting(true);
        try {
            await finanzasService.crearGastoRecurrente({
                categoria: mov.categoria,
                descripcion: mov.descripcion || `Gasto fijo: ${getCatLabel(mov.categoria)}`,
                monto_ars: parseFloat(mov.monto_ars),
                dia_vencimiento: parseInt(pinDay),
            });
            setPinningId(null);
            setPinDay("");
            await cargarGastosRecurrentes();
        } catch (err) {
            console.error("Error al fijar como mensual:", err);
        } finally {
            setPinSubmitting(false);
        }
    };

    // Mark as paid (with confirmation modal)
    const openPayConfirm = (mov) => {
        setConfirmModal({
            open: true,
            id: mov.id_movimiento,
            nombre: mov.descripcion || getCatLabel(mov.categoria),
            monto: mov.monto_ars,
        });
    };

    const handleConfirmPay = async () => {
        const { id, nombre } = confirmModal;
        setConfirmModal({ open: false, id: null, nombre: "", monto: 0 });
        try {
            await finanzasService.marcarPagado(id);
            setRecentlyPaid({ id, nombre });
            // Auto-clear undo after 8 seconds
            if (undoTimer) clearTimeout(undoTimer);
            const timer = setTimeout(() => setRecentlyPaid(null), 8000);
            setUndoTimer(timer);
            await cargarGastosRecurrentes();
            await cargarMovimientos(pagina);
            // Refresh dashboard KPIs
            const idAbogadoParam = isAdmin && abogadoFiltro ? abogadoFiltro : null;
            const dashRes = await finanzasService.getDashboard("NQN", idAbogadoParam);
            setDashboard(dashRes.data || null);
        } catch (err) {
            console.error("Error al marcar pagado:", err);
        }
    };

    const handleUndo = async () => {
        if (!recentlyPaid) return;
        try {
            await finanzasService.desmarcarPagado(recentlyPaid.id);
            setRecentlyPaid(null);
            if (undoTimer) clearTimeout(undoTimer);
            await cargarGastosRecurrentes();
            await cargarMovimientos(pagina);
            const idAbogadoParam = isAdmin && abogadoFiltro ? abogadoFiltro : null;
            const dashRes = await finanzasService.getDashboard("NQN", idAbogadoParam);
            setDashboard(dashRes.data || null);
        } catch (err) {
            console.error("Error al deshacer pago:", err);
        }
    };

    // Delete movimiento
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, nombre: "" });

    // Cobrar ingreso modal
    const [cobrarModal, setCobrarModal] = useState({ open: false, id: null, nombre: "", monto: 0 });

    // Detalle cuotas modal
    const [cuotasModal, setCuotasModal] = useState({ open: false, movimiento: null });

    const handleDeleteMovimiento = async () => {
        try {
            await finanzasService.eliminarMovimiento(deleteConfirm.id);
            setDeleteConfirm({ open: false, id: null, nombre: "" });
            await cargarMovimientos(pagina);
            // Si era recurrente y del mes actual, refrescar también recurrentes
            await cargarGastosRecurrentes();
            // Refrescar dashboard por si cambió el saldo
            const idAbogadoParam = isAdmin && abogadoFiltro ? abogadoFiltro : null;
            const dashRes = await finanzasService.getDashboard("NQN", idAbogadoParam);
            setDashboard(dashRes.data || null);
        } catch (err) {
            console.error("Error al eliminar movimiento:", err);
        }
    };

    // Cobrar ingreso
    const handleCobrar = async () => {
        const { id } = cobrarModal;
        setCobrarModal({ open: false, id: null, nombre: "", monto: 0 });
        try {
            await finanzasService.marcarCobrado(id);
            await cargarMovimientos(pagina);
            const idAbogadoParam = isAdmin && abogadoFiltro ? abogadoFiltro : null;
            const dashRes = await finanzasService.getDashboard("NQN", idAbogadoParam);
            setDashboard(dashRes.data || null);
        } catch (err) {
            console.error("Error al marcar cobrado:", err);
            alert(err.response?.data?.error || "Error al marcar como cobrado");
        }
    };

    // ═══ HELPERS ═══
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0,
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

    // SVG ring
    const RING_RADIUS = 52;
    const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
    const ratioCobrabilidad = dashboard?.indicadores?.ratio_cobrabilidad || 0;
    const ringOffset = RING_CIRCUMFERENCE - (ratioCobrabilidad / 100) * RING_CIRCUMFERENCE;

    // Breakeven from actual gastos recurrentes (dynamic!)
    const totalGastosFijosMes = gastosRecurrentes.reduce((sum, g) => sum + parseFloat(g.monto_ars || 0), 0);
    const pendientesPagados = pendientesMes.filter(m => m.estado === "pagado");
    const pendientesSinPagar = pendientesMes.filter(m => m.estado === "pendiente");
    // Ingresos cobrados del mes (from dashboard percibido, or approximate)
    const ingresosMesCobrados = dashboard?.caja?.percibido || 0;
    const breakevenPercent = totalGastosFijosMes > 0
        ? Math.min((ingresosMesCobrados / totalGastosFijosMes) * 100, 150)
        : (ingresosMesCobrados > 0 ? 100 : 0);
    const breakevenCubierto = ingresosMesCobrados >= totalGastosFijosMes;

    // ═══ RENDER ═══
    if (loading) {
        return (
            <div className="fin-terminal">
                <div className="fin-loading"><SpinnerIcon /><span>Inicializando Terminal Financiera...</span></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fin-terminal">
                <div className="fin-error"><p>{error}</p><button onClick={cargarTodo}>Reintentar</button></div>
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
                    {isAdmin && (
                        <select
                            className="fin-btn fin-select-abogado"
                            value={abogadoFiltro}
                            onChange={(e) => setAbogadoFiltro(e.target.value)}
                        >
                            <option value="">Todo el estudio</option>
                            {abogados.map(a => (
                                <option key={a.id_abogado} value={a.id_abogado}>
                                    {a.nombre} {a.apellido}
                                </option>
                            ))}
                        </select>
                    )}
                    <Link to="/dashboard/configuracion" className="fin-btn" style={{ textDecoration: "none" }}>Configurar JUS</Link>
                    <Link to="/dashboard/finanzas/gastos-fijos" className="fin-btn" style={{ textDecoration: "none" }}>Gastos Fijos</Link>
                    <Link to="/dashboard/finanzas/estadisticas" className="fin-btn" style={{ textDecoration: "none" }}>Estadísticas</Link>
                    <button
                        className="fin-btn"
                        style={{ backgroundColor: '#10b981', color: 'white' }}
                        onClick={() => { setShowIngresoForm(!showIngresoForm); setShowEgresoForm(false); }}
                    >
                        {showIngresoForm ? "✕ Cerrar" : "＋ Registrar Ingreso"}
                    </button>
                    <button
                        className="fin-btn fin-btn-danger"
                        onClick={() => { setShowEgresoForm(!showEgresoForm); setShowIngresoForm(false); }}
                    >
                        {showEgresoForm ? "✕ Cerrar" : "－ Registrar Egreso"}
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
                    {dashboard?.indicadores?.vista === "estudio_completo" && " • Vista: Todo el Estudio"}
                    {dashboard?.indicadores?.vista === "filtro_abogado" && ` • Filtro: ${abogados.find(a => String(a.id_abogado) === String(abogadoFiltro))?.nombre || ""} ${abogados.find(a => String(a.id_abogado) === String(abogadoFiltro))?.apellido || ""}`}
                </span>
            </div>

            {/* ═══ KPI CARDS ═══ */}
            <div className="fin-kpi-grid">
                <div className="fin-kpi-card kpi-caja">
                    <div className="fin-kpi-label">Caja Actual</div>
                    <div className={`fin-kpi-value ${(dashboard?.caja?.neto || 0) >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(dashboard?.caja?.neto)}
                    </div>
                    <div className="fin-kpi-hint">
                        Percibido <span className="gain">{formatCurrency(dashboard?.caja?.percibido)}</span>
                        {" — "}
                        Egresos <span className="loss">{formatCurrency(dashboard?.caja?.egresos)}</span>
                    </div>
                </div>

                <div className="fin-kpi-card kpi-cartera">
                    <div className="fin-kpi-label">Deudas a favor</div>
                    <div className="fin-kpi-value warning">
                        {formatCurrency(dashboard?.cartera?.total_pendiente_actualizado)}
                    </div>
                    <div className="fin-kpi-hint" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {(dashboard?.cartera?.pendiente_jus_actualizado || 0) > 0 && (
                            <span><span className="gain">{formatCurrency(dashboard.cartera.pendiente_jus_actualizado)}</span> en JUS</span>
                        )}
                        {(dashboard?.cartera?.pendiente_ars_fijo || 0) > 0 && (
                            <span><span className="gain">{formatCurrency(dashboard.cartera.pendiente_ars_fijo)}</span> en efectivo</span>
                        )}
                    </div>
                </div>

                <div className="fin-kpi-card kpi-egresos">
                    <div className="fin-kpi-label">Egresos Mensuales</div>
                    <div className="fin-kpi-value negative">
                        {formatCurrency(dashboard?.caja?.egresos)}
                    </div>
                    <div className="fin-kpi-hint" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {dashboard?.indicadores?.cuotas_vencidas > 0 && (
                            <span className="loss">⚠ {dashboard.indicadores.cuotas_vencidas} cuota{dashboard.indicadores.cuotas_vencidas > 1 ? 's' : ''} vencida{dashboard.indicadores.cuotas_vencidas > 1 ? 's' : ''}</span>
                        )}
                        {dashboard?.indicadores?.cuotas_proximas > 0 && (
                            <span style={{ color: '#f59e0b' }}>🔔 {dashboard.indicadores.cuotas_proximas} vence{dashboard.indicadores.cuotas_proximas === 1 ? '' : 'n'} en 7 días</span>
                        )}
                        {(dashboard?.indicadores?.cuotas_vencidas || 0) === 0 && (dashboard?.indicadores?.cuotas_proximas || 0) === 0 && "Sin alertas de cuotas"}
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
                                cx="65" cy="65" r={RING_RADIUS}
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
                        <p>Ratio entre honorarios cobrados y el total generado (actualizado al JUS de hoy).</p>
                        <div className="fin-ring-legend">
                            <span><span className="dot green"></span>Percibido: <span className="mono">{formatCurrency(dashboard?.caja?.percibido)}</span></span>
                            <span><span className="dot red"></span>Pendiente: <span className="mono">{formatCurrency(dashboard?.cartera?.total_pendiente_actualizado)}</span></span>
                        </div>
                    </div>
                </div>

                {/* Punto de Equilibrio - Dinámico desde gastos recurrentes */}
                <div className="fin-breakeven-card">
                    <h4>Punto de Equilibrio Mensual</h4>
                    <div className="subtitle">
                        Ingresos cobrados vs {gastosRecurrentes.length} gastos fijos configurados
                    </div>
                    {gastosRecurrentes.length === 0 ? (
                        <div className="fin-breakeven-empty">
                            No tenés gastos fijos configurados. Registrá un egreso y usá "📌 Fijar como mensual".
                        </div>
                    ) : (
                        <>
                            <div className="fin-breakeven-bar-container">
                                <div
                                    className={`fin-breakeven-fill ${breakevenCubierto ? 'over' : 'under'}`}
                                    style={{ width: `${Math.min(breakevenPercent, 100)}%` }}
                                />
                                <div
                                    className="fin-breakeven-marker"
                                    style={{ left: `${Math.min((totalGastosFijosMes / Math.max(ingresosMesCobrados, totalGastosFijosMes)) * 100, 100)}%` }}
                                    title={`Punto de equilibrio: ${formatCurrency(totalGastosFijosMes)}`}
                                />
                            </div>
                            <div className="fin-breakeven-labels">
                                <span>Cobrado: <span className={`mono ${breakevenCubierto ? 'green' : 'red'}`}>{formatCurrency(ingresosMesCobrados)}</span></span>
                                <span>Gastos Fijos: <span className="mono">{formatCurrency(totalGastosFijosMes)}</span></span>
                            </div>
                            <div className={`fin-breakeven-status ${breakevenCubierto ? 'covered' : 'deficit'}`}>
                                {breakevenCubierto
                                    ? `✓ Costos cubiertos • Superávit: ${formatCurrency(ingresosMesCobrados - totalGastosFijosMes)}`
                                    : `⚠ Faltan ${formatCurrency(totalGastosFijosMes - ingresosMesCobrados)} para cubrir costos fijos`
                                }
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* ═══ FORMULARIO DE INGRESO ═══ */}
            {showIngresoForm && (
                <div className="fin-section">
                    <form className="fin-egreso-form" onSubmit={handleIngresoSubmit} style={{ borderLeft: "4px solid #10b981" }}>
                        <h3>Registrar Ingreso</h3>
                        <div className="fin-form-row">
                            <div className="fin-form-field" style={{ maxWidth: 200 }}>
                                <label>Monto ($)</label>
                                <input
                                    type="number" placeholder="0" value={ingresoData.monto}
                                    onChange={(e) => setIngresoData(prev => ({ ...prev, monto: e.target.value }))}
                                    min="0" step="0.01" required autoFocus
                                />
                            </div>
                            <div className="fin-form-field" style={{ maxWidth: 180 }}>
                                <label>{ingresoData.es_plan_cuotas ? "Inicio Pagos" : "Fecha Cobro"}</label>
                                <input
                                    type="date" value={ingresoData.fecha}
                                    onChange={(e) => setIngresoData(prev => ({ ...prev, fecha: e.target.value }))}
                                />
                            </div>
                            <div className="fin-form-field">
                                <label>Descripción</label>
                                <input
                                    type="text" placeholder="Honorarios, Consulta, etc." value={ingresoData.descripcion}
                                    onChange={(e) => setIngresoData(prev => ({ ...prev, descripcion: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="fin-form-row">
                            <div className="fin-form-field" style={{ flex: 1 }}>
                                <label>Cliente</label>
                                <select
                                    className="fin-select"
                                    value={ingresoData.id_cliente}
                                    onChange={(e) => setIngresoData(prev => ({ ...prev, id_cliente: e.target.value, id_caso: "" }))}
                                >
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {clientes.map(c => (
                                        <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} {c.apellido} ({c.dni})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="fin-form-field" style={{ flex: 1 }}>
                                <label>Caso (Opcional)</label>
                                <select
                                    className="fin-select"
                                    value={ingresoData.id_caso}
                                    onChange={(e) => setIngresoData(prev => ({ ...prev, id_caso: e.target.value }))}
                                    disabled={!ingresoData.id_cliente}
                                >
                                    <option value="">-- General / Sin Caso --</option>
                                    {casosCliente.map(c => (
                                        <option key={c.id_caso} value={c.id_caso}>{c.descripcion}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* PLAN DE CUOTAS */}
                        <div className="fin-form-row">
                            <label className="fin-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-texto-principal)", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer", marginTop: "15px" }}>
                                <input
                                    type="checkbox"
                                    className="fin-custom-checkbox"
                                    checked={ingresoData.es_plan_cuotas}
                                    onChange={(e) => setIngresoData(prev => ({ ...prev, es_plan_cuotas: e.target.checked }))}
                                />
                                Generar Plan de Cuotas
                            </label>

                            {ingresoData.es_plan_cuotas && (
                                <div style={{ display: "flex", gap: 15, marginTop: 10, alignItems: "center", marginLeft: "25px" }}>
                                    <div className="fin-form-field" style={{ maxWidth: 120 }}>
                                        <label>Cant. Cuotas</label>
                                        <input
                                            type="number" min="2" max="24"
                                            value={ingresoData.cantidad_cuotas}
                                            onChange={(e) => setIngresoData(prev => ({ ...prev, cantidad_cuotas: e.target.value }))}
                                        />
                                    </div>
                                    <div className="fin-form-field" style={{ maxWidth: 180 }}>
                                        <label>1º Vencimiento</label>
                                        <input
                                            type="date"
                                            value={ingresoData.fecha_primera_cuota}
                                            onChange={(e) => setIngresoData(prev => ({ ...prev, fecha_primera_cuota: e.target.value }))}
                                        />
                                    </div>
                                    <div style={{ fontSize: "0.9em", color: "var(--color-texto-secundario)", paddingTop: 15 }}>
                                        Se generarán {ingresoData.cantidad_cuotas} cuotas de <b>{formatCurrency(ingresoData.monto / (ingresoData.cantidad_cuotas || 1))}</b>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="fin-form-actions">
                            <button type="button" className="fin-btn" onClick={() => setShowIngresoForm(false)}>Cancelar</button>
                            <button
                                type="submit" className="fin-btn"
                                style={{ backgroundColor: '#10b981', color: 'white' }}
                                disabled={submittingIngreso || !ingresoData.monto}
                            >
                                {submittingIngreso ? "Registrando..." : "Confirmar Ingreso"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ═══ FORMULARIO DE EGRESO ═══ */}
            {showEgresoForm && (
                <div className="fin-section">
                    <form className="fin-egreso-form" onSubmit={handleEgresoSubmit}>
                        <div className="fin-form-row">
                            <div className="fin-form-field" style={{ maxWidth: 200 }}>
                                <label>Monto ($)</label>
                                <input
                                    type="number" placeholder="0" value={egresoData.monto}
                                    onChange={(e) => setEgresoData(prev => ({ ...prev, monto: e.target.value }))}
                                    min="0" step="0.01" required autoFocus
                                />
                            </div>
                            <div className="fin-form-field" style={{ maxWidth: 180 }}>
                                <label>Fecha</label>
                                <input
                                    type="date" value={egresoData.fecha}
                                    onChange={(e) => setEgresoData(prev => ({ ...prev, fecha: e.target.value }))}
                                />
                            </div>
                            <div className="fin-form-field">
                                <label>Descripción (opcional)</label>
                                <input
                                    type="text" placeholder="Detalle del egreso..." value={egresoData.descripcion}
                                    onChange={(e) => setEgresoData(prev => ({ ...prev, descripcion: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="fin-form-row">
                            <div className="fin-form-field">
                                <label>Categoría</label>
                                <div className="fin-cat-chips">
                                    {allCategorias.map((cat) => (
                                        <button
                                            key={cat.value} type="button"
                                            className={`fin-cat-chip ${egresoData.categoria === cat.value ? 'active' : ''}`}
                                            onClick={() => setEgresoData(prev => ({ ...prev, categoria: cat.value }))}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                    {showNewCatInput ? (
                                        <span className="fin-cat-inline-add">
                                            <input
                                                type="text" placeholder="Nombre..."
                                                value={newCatName}
                                                onChange={(e) => setNewCatName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") { e.preventDefault(); addCustomCat(); }
                                                    if (e.key === "Escape") { setShowNewCatInput(false); setNewCatName(""); }
                                                }}
                                                autoFocus
                                            />
                                            <button type="button" className="fin-cat-chip active" onClick={addCustomCat}>✓</button>
                                            <button type="button" className="fin-cat-chip" onClick={() => { setShowNewCatInput(false); setNewCatName(""); }}>✕</button>
                                        </span>
                                    ) : (
                                        <button type="button" className="fin-cat-chip fin-cat-add" onClick={() => setShowNewCatInput(true)}>+ Agregar</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Opción de Gasto Fijo */}
                        <div className="fin-form-row">
                            <label className="fin-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-texto-principal)", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer", marginTop: "10px" }}>
                                <input
                                    type="checkbox"
                                    className="fin-custom-checkbox"
                                    checked={egresoData.es_gasto_fijo}
                                    onChange={(e) => {
                                        const isFixed = e.target.checked;
                                        setEgresoData(prev => ({
                                            ...prev,
                                            es_gasto_fijo: isFixed,
                                            dia_vencimiento: isFixed ? "1" : "",
                                            // Si es fijo, por defecto NO está pagado (es una deuda). Si es egreso normal, sí.
                                            pagado: !isFixed
                                        }));
                                    }}
                                />
                                Definir como Gasto Fijo Mensual
                            </label>

                            {egresoData.es_gasto_fijo && (
                                <div className="fin-form-field" style={{ maxWidth: 200, marginLeft: "25px" }}>
                                    <label>Día de pago mensual (1-28)</label>
                                    <input
                                        type="number" min="1" max="28"
                                        value={egresoData.dia_vencimiento}
                                        onChange={(e) => setEgresoData(prev => ({ ...prev, dia_vencimiento: e.target.value }))}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {/* Checkbox Pagado (Control Manual) */}
                        <div className="fin-form-row">
                            <label className="fin-checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-texto-principal)", fontWeight: 500, fontSize: "0.9rem", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    className="fin-custom-checkbox"
                                    checked={egresoData.pagado}
                                    onChange={(e) => setEgresoData(prev => ({ ...prev, pagado: e.target.checked }))}
                                />
                                Marcar como Pagado
                            </label>
                        </div>

                        <div className="fin-form-actions">
                            <button type="button" className="fin-btn" onClick={() => setShowEgresoForm(false)}>Cancelar</button>
                            <button
                                type="submit" className="fin-btn fin-btn-danger"
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
                <div style={{ overflowX: 'auto' }}>
                    <table className="fin-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimientos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="fin-table-empty">No hay movimientos registrados</td>
                                </tr>
                            ) : (
                                movimientos.map((mov) => {
                                    const isEgreso = mov.tipo === "egreso";
                                    const alreadyRecurrent = gastosRecurrentes.some(g => g.categoria === mov.categoria);
                                    const isPinning = pinningId === mov.id_movimiento;

                                    return (
                                        <tr key={mov.id_movimiento || mov.id}>
                                            <td className="mono">{formatDate(mov.createdAt)}</td>
                                            <td>
                                                <span className={`fin-badge tipo-${mov.tipo}`}>{mov.tipo}</span>
                                            </td>
                                            <td>
                                                {mov.descripcion?.substring(0, 50)}
                                                {mov.categoria && (
                                                    <small style={{ color: 'var(--color-texto-secundario)', marginLeft: 6 }}>
                                                        {getCatLabel(mov.categoria)}
                                                    </small>
                                                )}
                                                {mov.es_recurrente && (
                                                    <span className="fin-recurrente-tag">Gasto Mensual</span>
                                                )}
                                            </td>
                                            <td className={`mono ${mov.tipo}`}>
                                                {isEgreso ? "−" : "+"}{formatCurrency(mov.monto_ars)}
                                                {mov.monto_jus > 0 && (
                                                    <small style={{ color: '#818cf8', marginLeft: 4 }}>
                                                        ({mov.monto_jus} JUS)
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`fin-badge estado-${mov.estado}`}>{mov.estado}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                                    {isEgreso && mov.estado === "pendiente" && (
                                                        <button
                                                            className="fin-btn fin-btn-primary fin-btn-xs"
                                                            title="Marcar como pagado"
                                                            onClick={() => openPayConfirm(mov)}
                                                        >
                                                            ✓
                                                        </button>
                                                    )}
                                                    {!isEgreso && (mov.estado === "pendiente" || mov.estado === "parcial") && (!mov.cuotas || mov.cuotas.length === 0) && (
                                                        <button
                                                            className="fin-btn fin-btn-primary fin-btn-xs"
                                                            title="Marcar como cobrado"
                                                            onClick={() => setCobrarModal({
                                                                open: true,
                                                                id: mov.id_movimiento,
                                                                nombre: mov.descripcion || "Ingreso",
                                                                monto: mov.monto_ars,
                                                            })}
                                                        >
                                                            <DineroIcon />
                                                        </button>
                                                    )}
                                                    {mov.es_plan_cuotas && (
                                                        <button
                                                            className="fin-btn fin-btn-xs"
                                                            title="Ver cuotas"
                                                            onClick={() => setCuotasModal({ open: true, movimiento: mov })}
                                                        >
                                                            📋
                                                        </button>
                                                    )}
                                                    <button
                                                        className="fin-btn fin-btn-xs fin-btn-danger-ghost"
                                                        title="Eliminar"
                                                        onClick={() => setDeleteConfirm({ open: true, id: mov.id_movimiento, nombre: mov.descripcion || getCatLabel(mov.categoria) })}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPaginas > 1 && (
                    <div className="fin-table-pagination">
                        <span>Página {pagina} de {totalPaginas}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="fin-btn" disabled={pagina <= 1} onClick={() => cargarMovimientos(pagina - 1)}>← Anterior</button>
                            <button className="fin-btn" disabled={pagina >= totalPaginas} onClick={() => cargarMovimientos(pagina + 1)}>Siguiente →</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ MODALS ═══ */}
            <DeleteModal
                isOpen={confirmModal.open}
                onConfirm={handleConfirmPay}
                onCancel={() => setConfirmModal({ open: false, id: null, nombre: "", monto: 0 })}
                title="Confirmar pago"
                message={`¿Marcás como pagado "${confirmModal.nombre}" por ${formatCurrency(confirmModal.monto)}?`}
                confirmLabel="Confirmar pago"
                confirmVariant="success"
            />

            <DeleteModal
                isOpen={deleteConfirm.open}
                onConfirm={handleDeleteMovimiento}
                onCancel={() => setDeleteConfirm({ open: false, id: null, nombre: "" })}
                title="Eliminar movimiento"
                message={`¿Estás seguro que querés eliminar "${deleteConfirm.nombre}"? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                confirmVariant="danger"
            />
            <DeleteModal
                isOpen={cobrarModal.open}
                onConfirm={handleCobrar}
                onCancel={() => setCobrarModal({ open: false, id: null, nombre: "", monto: 0 })}
                title="Confirmar cobro"
                message={`¿Marcás como cobrado "${cobrarModal.nombre}" por ${formatCurrency(cobrarModal.monto)}?`}
                confirmLabel="Confirmar cobro"
                confirmVariant="success"
            />
            <DetalleCuotas
                isOpen={cuotasModal.open}
                onClose={() => setCuotasModal({ open: false, movimiento: null })}
                movimiento={cuotasModal.movimiento}
                onCuotaUpdated={async () => {
                    await cargarMovimientos(pagina);
                    const idAbogadoParam = isAdmin && abogadoFiltro ? abogadoFiltro : null;
                    const dashRes = await finanzasService.getDashboard("NQN", idAbogadoParam);
                    setDashboard(dashRes.data || null);
                }}
            />
        </div>
    );
};

export default FinanzasDashboard;
