// src/components/common/DetalleCuotas.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import finanzasService from "../../services/finanzas.service";
import { SpinnerIcon } from "./Icons";
import "./DetalleCuotas.css";

const formatCurrency = (v) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

const formatFecha = (f) => {
    if (!f) return "-";
    const d = new Date(f + "T12:00:00");
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};

const DetalleCuotas = ({ isOpen, onClose, movimiento, onCuotaUpdated }) => {
    const [cuotas, setCuotas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editFecha, setEditFecha] = useState("");
    const [payingId, setPayingId] = useState(null);
    const [payDate, setPayDate] = useState("");
    const bodyRef = useRef(null);

    const cargarCuotas = useCallback(async (silent = false) => {
        if (!movimiento?.id_movimiento) return;
        // En recarga silenciosa (post-pago) no mostramos spinner para no resetear el scroll
        if (!silent) setLoading(true);
        // Guardamos la posición del scroll antes de recargar
        const scrollTop = bodyRef.current?.scrollTop ?? 0;
        try {
            const res = await finanzasService.getCuotasMovimiento(movimiento.id_movimiento);
            setCuotas(res.data || []);
            // Restauramos el scroll después de que React actualice el DOM
            requestAnimationFrame(() => {
                if (bodyRef.current) bodyRef.current.scrollTop = scrollTop;
            });
        } catch (err) {
            console.error("Error cargando cuotas:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [movimiento]);

    useEffect(() => {
        if (isOpen) cargarCuotas();
    }, [isOpen, cargarCuotas]);

    if (!isOpen || !movimiento) return null;

    const pagadas = cuotas.filter(c => c.estado === "pagado").length;
    const pendientes = cuotas.filter(c => c.estado !== "pagado").length;
    const totalPagado = cuotas.filter(c => c.estado === "pagado").reduce((s, c) => s + parseFloat(c.monto_cuota || 0), 0);

    const handlePagar = async (cuota) => {
        try {
            const fecha = payingId === cuota.id_cuota && payDate ? payDate : null;
            await finanzasService.marcarCuotaPagada(cuota.id_cuota, fecha);
            setPayingId(null);
            setPayDate("");
            // Recarga silenciosa: no muestra spinner, preserva el scroll
            await cargarCuotas(true);
            if (onCuotaUpdated) onCuotaUpdated();
        } catch (err) {
            console.error("Error al pagar cuota:", err);
            alert(err.response?.data?.error || "Error al marcar cuota");
        }
    };

    const handleEditFecha = async (cuota) => {
        if (!editFecha) return;
        try {
            await finanzasService.actualizarCuota(cuota.id_cuota, { fecha_vencimiento: editFecha });
            setEditingId(null);
            setEditFecha("");
            await cargarCuotas();
        } catch (err) {
            console.error("Error actualizando cuota:", err);
        }
    };

    return (
        <div className="dc-overlay" onClick={onClose}>
            <div className="dc-modal" onClick={e => e.stopPropagation()}>
                <div className="dc-header">
                    <h3>📋 Cuotas — {movimiento.descripcion || "Ingreso"}</h3>
                    <button className="dc-close" onClick={onClose}>✕</button>
                </div>
                <div className="dc-body" ref={bodyRef}>
                    {/* Summary */}
                    <div className="dc-summary">
                        <div className="dc-summary-item">
                            <div className="label">Total</div>
                            <div className="value">{formatCurrency(movimiento.monto_ars)}</div>
                        </div>
                        <div className="dc-summary-item">
                            <div className="label">Cobrado</div>
                            <div className="value green">{formatCurrency(totalPagado)}</div>
                        </div>
                        <div className="dc-summary-item">
                            <div className="label">Pagadas</div>
                            <div className="value green">{pagadas}/{cuotas.length}</div>
                        </div>
                        <div className="dc-summary-item">
                            <div className="label">Pendientes</div>
                            <div className="value yellow">{pendientes}</div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "20px" }}><SpinnerIcon /></div>
                    ) : (
                        <table className="dc-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Monto</th>
                                    <th>Vencimiento</th>
                                    <th>Pago</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cuotas.map(c => (
                                    <tr key={c.id_cuota}>
                                        <td>{c.numero_cuota}</td>
                                        <td className="mono">{formatCurrency(c.monto_cuota)}</td>
                                        <td>
                                            {editingId === c.id_cuota ? (
                                                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                                    <input
                                                        className="dc-date-input"
                                                        type="date"
                                                        value={editFecha}
                                                        onChange={e => setEditFecha(e.target.value)}
                                                    />
                                                    <button className="dc-actions" style={{ padding: "3px 6px", cursor: "pointer", border: "1px solid #d4af37", borderRadius: "4px", background: "transparent", color: "#d4af37", fontSize: "0.7rem" }} onClick={() => handleEditFecha(c)}>✓</button>
                                                    <button className="dc-actions" style={{ padding: "3px 6px", cursor: "pointer", border: "1px solid #94a3b8", borderRadius: "4px", background: "transparent", color: "#94a3b8", fontSize: "0.7rem" }} onClick={() => setEditingId(null)}>✕</button>
                                                </div>
                                            ) : (
                                                formatFecha(c.fecha_vencimiento)
                                            )}
                                        </td>
                                        <td>{c.fecha_pago_efectivo ? formatFecha(c.fecha_pago_efectivo) : "-"}</td>
                                        <td><span className={`dc-badge ${c.estado}`}>{c.estado}</span></td>
                                        <td>
                                            <div className="dc-actions">
                                                {c.estado !== "pagado" && (
                                                    <>
                                                        {payingId === c.id_cuota ? (
                                                            <>
                                                                <input className="dc-date-input" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
                                                                <button className="pay-btn" onClick={() => handlePagar(c)}>✓</button>
                                                                <button onClick={() => { setPayingId(null); setPayDate(""); }}>✕</button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button className="pay-btn" onClick={() => handlePagar(c)} title="Cobrar hoy">💰</button>
                                                                <button onClick={() => { setPayingId(c.id_cuota); setPayDate(""); }} title="Cobrar con fecha custom">📅</button>
                                                                <button onClick={() => { setEditingId(c.id_cuota); setEditFecha(c.fecha_vencimiento); }} title="Editar fecha vto">✎</button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetalleCuotas;
