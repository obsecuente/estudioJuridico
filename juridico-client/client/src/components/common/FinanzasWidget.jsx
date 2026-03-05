// src/components/common/FinanzasWidget.jsx
import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import finanzasService from "../../services/finanzas.service";
import {
    SpinnerIcon,
    DineroIcon,
    AddIcon,
    ArrowRightIcon,
    FinanzasIcon,
} from "./Icons";
import "./FinanzasWidget.css";

// ═══ CATEGORÍAS DE EGRESOS (mismas que FinanzasDashboard) ═══
const CATEGORIAS_EGRESO = [
    { value: "caja_forense", label: "Caja Forense" },
    { value: "bono_ley", label: "Bono Ley" },
    { value: "alquiler", label: "Alquiler" },
    { value: "matricula", label: "Matricula" },
    { value: "libreria", label: "Libreria" },
    { value: "aportes", label: "Aportes" },
    { value: "internet", label: "Internet" },
    { value: "otros", label: "Otros" },
];

const loadCustomCats = () => {
    try {
        return JSON.parse(localStorage.getItem("custom_categorias_egreso") || "[]");
    } catch { return []; }
};

const FinanzasWidget = ({ showToast }) => {
    const { user } = useContext(AuthContext);

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [activeForm, setActiveForm] = useState(null); // null | "ingreso" | "egreso"

    // Egreso
    const [egresoData, setEgresoData] = useState({
        monto: "", fecha: new Date().toISOString().split("T")[0],
        categoria: "", descripcion: "",
        es_gasto_fijo: false, dia_vencimiento: "", pagado: true,
    });
    const [submittingEgreso, setSubmittingEgreso] = useState(false);

    // Ingreso
    const [ingresoData, setIngresoData] = useState({
        monto: "", fecha: new Date().toISOString().split("T")[0],
        categoria: "honorarios", descripcion: "",
        id_cliente: "", id_caso: "",
        es_plan_cuotas: false, cantidad_cuotas: 1,
        fecha_primera_cuota: new Date().toISOString().split("T")[0],
    });
    const [submittingIngreso, setSubmittingIngreso] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [casosCliente, setCasosCliente] = useState([]);

    const customCats = loadCustomCats();
    const allCategorias = [...CATEGORIAS_EGRESO, ...customCats];

    useEffect(() => {
        cargarDashboard();
        const handler = () => cargarDashboard();
        window.addEventListener("finanzas-updated", handler);
        return () => window.removeEventListener("finanzas-updated", handler);
    }, []);

    // Cargar clientes al abrir ingreso
    useEffect(() => {
        if (activeForm === "ingreso" && clientes.length === 0) {
            api.get("/clientes?limit=1000")
                .then(res => setClientes(res.data.data || []))
                .catch(err => console.error(err));
        }
    }, [activeForm]);

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

    const cargarDashboard = async () => {
        try {
            setLoading(true);
            const response = await finanzasService.getDashboard("NQN");
            setDashboard(response.data);
        } catch (err) {
            console.error("Error cargando finanzas:", err);
            setError("No se pudo cargar");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency", currency: "ARS",
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(value || 0);

    // ═══ SUBMIT EGRESO ═══
    const handleEgresoSubmit = async (e) => {
        e.preventDefault();
        if (!egresoData.monto || !egresoData.categoria) return;
        setSubmittingEgreso(true);
        try {
            const catLabel = allCategorias.find(c => c.value === egresoData.categoria)?.label || egresoData.categoria;
            await finanzasService.crearMovimiento({
                tipo: "egreso",
                categoria: egresoData.categoria,
                descripcion: egresoData.descripcion || `Egreso: ${catLabel}`,
                monto_ars: parseFloat(egresoData.monto),
                estado: egresoData.pagado ? "pagado" : "pendiente",
                es_gasto_fijo: egresoData.es_gasto_fijo,
                dia_vencimiento: egresoData.es_gasto_fijo ? parseInt(egresoData.dia_vencimiento) : null,
                fecha_pago: egresoData.fecha,
            });
            setActiveForm(null);
            setEgresoData({
                monto: "", fecha: new Date().toISOString().split("T")[0],
                categoria: "", descripcion: "",
                es_gasto_fijo: false, dia_vencimiento: "", pagado: true,
            });
            await cargarDashboard();
            window.dispatchEvent(new CustomEvent("finanzas-updated"));
            showToast?.("Egreso registrado correctamente", "success");
        } catch (err) {
            console.error("Error al registrar egreso:", err);
            showToast?.("Error al registrar egreso", "error");
        } finally {
            setSubmittingEgreso(false);
        }
    };

    // ═══ SUBMIT INGRESO ═══
    const handleIngresoSubmit = async (e) => {
        e.preventDefault();
        if (!ingresoData.monto) return;
        setSubmittingIngreso(true);
        try {
            const planCuotas = ingresoData.es_plan_cuotas ? {
                cantidad: parseInt(ingresoData.cantidad_cuotas),
                fecha_primera: ingresoData.fecha_primera_cuota,
            } : null;

            await finanzasService.crearMovimiento({
                tipo: "ingreso",
                categoria: ingresoData.categoria,
                descripcion: ingresoData.descripcion || "Honorarios profesionales",
                monto_ars: parseFloat(ingresoData.monto),
                estado: ingresoData.es_plan_cuotas ? "parcial" : "pagado",
                id_cliente: ingresoData.id_cliente || null,
                id_caso: ingresoData.id_caso || null,
                fecha_cobro: ingresoData.es_plan_cuotas ? null : ingresoData.fecha,
                plan_cuotas: planCuotas,
            });
            setActiveForm(null);
            setIngresoData({
                monto: "", fecha: new Date().toISOString().split("T")[0],
                categoria: "honorarios", descripcion: "",
                id_cliente: "", id_caso: "",
                es_plan_cuotas: false, cantidad_cuotas: 1,
                fecha_primera_cuota: new Date().toISOString().split("T")[0],
            });
            await cargarDashboard();
            window.dispatchEvent(new CustomEvent("finanzas-updated"));
            showToast?.("Ingreso registrado correctamente", "success");
        } catch (err) {
            console.error("Error al registrar ingreso:", err);
            showToast?.("Error al registrar ingreso", "error");
        } finally {
            setSubmittingIngreso(false);
        }
    };

    // ═══ RENDER ═══
    const neto = dashboard?.caja?.neto || 0;
    const percibido = dashboard?.caja?.percibido || 0;
    const egresos = dashboard?.caja?.egresos || 0;
    const pendiente = dashboard?.cartera?.total_pendiente_actualizado || 0;

    // Balance bar: verde (ingresos) vs rojo (egresos)
    const totalFlow = percibido + egresos;
    const ingresoPercent = totalFlow > 0 ? (percibido / totalFlow) * 100 : 50;

    if (loading) {
        return (
            <div className="finw-container">
                <div className="finw-head">
                    <h3><FinanzasIcon /> Mis Finanzas</h3>
                </div>
                <div className="finw-loading">
                    <SpinnerIcon />
                    <span>Calculando...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="finw-container">
                <div className="finw-head">
                    <h3><FinanzasIcon /> Mis Finanzas</h3>
                </div>
                <div className="finw-loading">
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="finw-container">
            {/* Header */}
            <div className="finw-head">
                <h3><DineroIcon /> Mis Finanzas</h3>
                <Link to="/dashboard/finanzas" className="finw-ver-mas">
                    Ver detalle <ArrowRightIcon />
                </Link>
            </div>

            {/* KPI Row */}
            <div className="finw-kpi-row">
                <div className="finw-kpi-card finw-kpi-balance">
                    <span className="finw-kpi-label">Balance del Mes</span>
                    <span className={`finw-kpi-number ${neto >= 0 ? "positive" : "negative"}`}>
                        {formatCurrency(neto)}
                    </span>
                </div>
                <div className="finw-kpi-card">
                    <span className="finw-kpi-label">Ingresos</span>
                    <span className="finw-kpi-number positive">{formatCurrency(percibido)}</span>
                </div>
                <div className="finw-kpi-card">
                    <span className="finw-kpi-label">Egresos</span>
                    <span className="finw-kpi-number negative">{formatCurrency(egresos)}</span>
                </div>
                <div className="finw-kpi-card">
                    <span className="finw-kpi-label">Pendiente Cobro</span>
                    <span className="finw-kpi-number warn">{formatCurrency(pendiente)}</span>
                </div>
            </div>

            {/* Balance bar */}
            <div className="finw-balance-bar-wrap">
                <div className="finw-balance-bar">
                    <div className="finw-bar-income" style={{ width: `${ingresoPercent}%` }} />
                </div>
                <div className="finw-bar-labels">
                    <span className="finw-bar-label-in">Ingresos {ingresoPercent.toFixed(0)}%</span>
                    <span className="finw-bar-label-out">Egresos {(100 - ingresoPercent).toFixed(0)}%</span>
                </div>
            </div>

            {/* Action buttons */}
            <div className="finw-actions">
                <button
                    className={`finw-action-btn finw-btn-ingreso ${activeForm === "ingreso" ? "active" : ""}`}
                    onClick={() => setActiveForm(activeForm === "ingreso" ? null : "ingreso")}
                >
                    <AddIcon /> {activeForm === "ingreso" ? "Cerrar" : "Registrar Ingreso"}
                </button>
                <button
                    className={`finw-action-btn finw-btn-egreso ${activeForm === "egreso" ? "active" : ""}`}
                    onClick={() => setActiveForm(activeForm === "egreso" ? null : "egreso")}
                >
                    <AddIcon /> {activeForm === "egreso" ? "Cerrar" : "Registrar Egreso"}
                </button>
            </div>

            {/* ═══ FORM INGRESO ═══ */}
            {activeForm === "ingreso" && (
                <form className="finw-form finw-form-ingreso" onSubmit={handleIngresoSubmit}>
                    <div className="finw-form-grid">
                        <div className="finw-field">
                            <label>Monto ($)</label>
                            <input
                                type="number" placeholder="0" value={ingresoData.monto}
                                onChange={(e) => setIngresoData(p => ({ ...p, monto: e.target.value }))}
                                min="0" step="0.01" required autoFocus
                            />
                        </div>
                        <div className="finw-field">
                            <label>Fecha Cobro</label>
                            <input
                                type="date" value={ingresoData.fecha}
                                onChange={(e) => setIngresoData(p => ({ ...p, fecha: e.target.value }))}
                            />
                        </div>
                        <div className="finw-field finw-field-wide">
                            <label>Descripcion</label>
                            <input
                                type="text" placeholder="Honorarios, consulta..."
                                value={ingresoData.descripcion}
                                onChange={(e) => setIngresoData(p => ({ ...p, descripcion: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="finw-form-grid">
                        <div className="finw-field">
                            <label>Cliente</label>
                            <select
                                value={ingresoData.id_cliente}
                                onChange={(e) => setIngresoData(p => ({ ...p, id_cliente: e.target.value, id_caso: "" }))}
                            >
                                <option value="">-- Sin cliente --</option>
                                {clientes.map(c => (
                                    <option key={c.id_cliente} value={c.id_cliente}>
                                        {c.nombre} {c.apellido}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="finw-field">
                            <label>Caso</label>
                            <select
                                value={ingresoData.id_caso}
                                onChange={(e) => setIngresoData(p => ({ ...p, id_caso: e.target.value }))}
                                disabled={!ingresoData.id_cliente}
                            >
                                <option value="">-- Sin caso --</option>
                                {casosCliente.map(c => (
                                    <option key={c.id_caso} value={c.id_caso}>{c.descripcion}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Plan de cuotas */}
                    <label className="finw-checkbox-row">
                        <input
                            type="checkbox"
                            checked={ingresoData.es_plan_cuotas}
                            onChange={(e) => setIngresoData(p => ({ ...p, es_plan_cuotas: e.target.checked }))}
                        />
                        <span>Plan de Cuotas</span>
                    </label>
                    {ingresoData.es_plan_cuotas && (
                        <div className="finw-form-grid finw-cuotas-detail">
                            <div className="finw-field">
                                <label>Cant. Cuotas</label>
                                <input
                                    type="number" min="2" max="24"
                                    value={ingresoData.cantidad_cuotas}
                                    onChange={(e) => setIngresoData(p => ({ ...p, cantidad_cuotas: e.target.value }))}
                                />
                            </div>
                            <div className="finw-field">
                                <label>1er Vencimiento</label>
                                <input
                                    type="date"
                                    value={ingresoData.fecha_primera_cuota}
                                    onChange={(e) => setIngresoData(p => ({ ...p, fecha_primera_cuota: e.target.value }))}
                                />
                            </div>
                            <div className="finw-cuotas-info">
                                {ingresoData.cantidad_cuotas > 0 && ingresoData.monto > 0 && (
                                    <span>{ingresoData.cantidad_cuotas} cuotas de <b>{formatCurrency(ingresoData.monto / ingresoData.cantidad_cuotas)}</b></span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="finw-form-actions">
                        <button type="button" className="finw-cancel-btn" onClick={() => setActiveForm(null)}>Cancelar</button>
                        <button type="submit" className="finw-submit-btn finw-submit-ingreso" disabled={submittingIngreso || !ingresoData.monto}>
                            {submittingIngreso ? "Registrando..." : "Confirmar Ingreso"}
                        </button>
                    </div>
                </form>
            )}

            {/* ═══ FORM EGRESO ═══ */}
            {activeForm === "egreso" && (
                <form className="finw-form finw-form-egreso" onSubmit={handleEgresoSubmit}>
                    <div className="finw-form-grid">
                        <div className="finw-field">
                            <label>Monto ($)</label>
                            <input
                                type="number" placeholder="0" value={egresoData.monto}
                                onChange={(e) => setEgresoData(p => ({ ...p, monto: e.target.value }))}
                                min="0" step="0.01" required autoFocus
                            />
                        </div>
                        <div className="finw-field">
                            <label>Fecha</label>
                            <input
                                type="date" value={egresoData.fecha}
                                onChange={(e) => setEgresoData(p => ({ ...p, fecha: e.target.value }))}
                            />
                        </div>
                        <div className="finw-field finw-field-wide">
                            <label>Descripcion (opcional)</label>
                            <input
                                type="text" placeholder="Detalle del egreso..."
                                value={egresoData.descripcion}
                                onChange={(e) => setEgresoData(p => ({ ...p, descripcion: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Categoría chips */}
                    <div className="finw-field">
                        <label>Categoria</label>
                        <div className="finw-cat-chips">
                            {allCategorias.map(cat => (
                                <button
                                    key={cat.value} type="button"
                                    className={`finw-cat-chip ${egresoData.categoria === cat.value ? "active" : ""}`}
                                    onClick={() => setEgresoData(p => ({ ...p, categoria: cat.value }))}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gasto fijo */}
                    <label className="finw-checkbox-row">
                        <input
                            type="checkbox"
                            checked={egresoData.es_gasto_fijo}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setEgresoData(p => ({
                                    ...p,
                                    es_gasto_fijo: checked,
                                    dia_vencimiento: checked ? "1" : "",
                                    pagado: checked ? false : true,
                                }));
                            }}
                        />
                        <span>Gasto Fijo Mensual</span>
                    </label>
                    {egresoData.es_gasto_fijo && (
                        <div className="finw-form-grid finw-gasto-fijo-detail">
                            <div className="finw-field">
                                <label>Dia de Vencimiento</label>
                                <input
                                    type="number" min="1" max="28"
                                    value={egresoData.dia_vencimiento}
                                    onChange={(e) => setEgresoData(p => ({ ...p, dia_vencimiento: e.target.value }))}
                                    placeholder="1-28"
                                />
                            </div>
                            <label className="finw-checkbox-row" style={{ alignSelf: "end" }}>
                                <input
                                    type="checkbox"
                                    checked={egresoData.pagado}
                                    onChange={(e) => setEgresoData(p => ({ ...p, pagado: e.target.checked }))}
                                />
                                <span>Ya pagado este mes</span>
                            </label>
                        </div>
                    )}

                    <div className="finw-form-actions">
                        <button type="button" className="finw-cancel-btn" onClick={() => setActiveForm(null)}>Cancelar</button>
                        <button
                            type="submit"
                            className="finw-submit-btn finw-submit-egreso"
                            disabled={submittingEgreso || !egresoData.monto || !egresoData.categoria}
                        >
                            {submittingEgreso ? "Registrando..." : "Confirmar Egreso"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default FinanzasWidget;
