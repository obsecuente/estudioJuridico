// src/pages/finanzas/GastosFijos.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import finanzasService from "../../services/finanzas.service";
import BackButton from "../../components/common/BackButton";
import DeleteModal from "../../components/common/DeleteModal";
import { SpinnerIcon } from "../../components/common/Icons";
import "./GastosFijos.css";

const CATEGORIAS = [
    { value: "caja_forense", label: "Caja Forense" },
    { value: "bono_ley", label: "Bono Ley" },
    { value: "alquiler", label: "Alquiler" },
    { value: "matricula", label: "Matrícula Colegio" },
    { value: "libreria", label: "Resmas/Librería" },
    { value: "aportes", label: "Aportes Obligatorios" },
    { value: "internet", label: "Internet/Sistemas" },
    { value: "otros", label: "Otros" },
];

const getCatLabel = (val) => CATEGORIAS.find(c => c.value === val)?.label || val;

const formatCurrency = (v) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

const GastosFijos = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ descripcion: "", categoria: "", monto_ars: "", dia_vencimiento: "" });
    const [submitting, setSubmitting] = useState(false);

    // Editing
    const [editingId, setEditingId] = useState(null);
    const [editMonto, setEditMonto] = useState("");
    const [editDia, setEditDia] = useState("");

    // Delete
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, nombre: "" });

    const cargarGastos = useCallback(async () => {
        try {
            setLoading(true);
            const res = await finanzasService.getGastosRecurrentes();
            setGastos(res.data || []);
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { cargarGastos(); }, [cargarGastos]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.monto_ars || !form.categoria || !form.dia_vencimiento) return;
        setSubmitting(true);
        try {
            await finanzasService.crearGastoRecurrente({
                descripcion: form.descripcion || `Gasto fijo: ${getCatLabel(form.categoria)}`,
                categoria: form.categoria,
                monto_ars: parseFloat(form.monto_ars),
                dia_vencimiento: parseInt(form.dia_vencimiento),
            });
            setForm({ descripcion: "", categoria: "", monto_ars: "", dia_vencimiento: "" });
            setShowForm(false);
            await cargarGastos();
        } catch (err) {
            console.error("Error al crear gasto fijo:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const startEditing = (gasto) => {
        setEditingId(gasto.id_gasto_recurrente);
        setEditMonto(gasto.monto_ars);
        setEditDia(gasto.dia_vencimiento);
    };

    const saveEdit = async (id) => {
        try {
            await finanzasService.actualizarGastoRecurrente(id, {
                monto_ars: parseFloat(editMonto),
                dia_vencimiento: parseInt(editDia),
            });
            setEditingId(null);
            await cargarGastos();
        } catch (err) {
            console.error("Error al editar:", err);
        }
    };

    const handleDelete = async () => {
        try {
            await finanzasService.eliminarGastoRecurrente(deleteModal.id);
            setDeleteModal({ open: false, id: null, nombre: "" });
            await cargarGastos();
        } catch (err) {
            console.error("Error al eliminar:", err);
        }
    };

    // Summary
    const totalMensual = gastos.reduce((s, g) => s + parseFloat(g.monto_ars || 0), 0);
    const gastosActivos = gastos.filter(g => g.activo !== false).length;
    const hoy = new Date().getDate();
    const proximosVencer = gastos.filter(g => {
        const dia = g.dia_vencimiento;
        return dia >= hoy && dia <= hoy + 5;
    }).length;

    if (loading) {
        return (
            <div className="gf-container">
                <div className="fin-loading"><SpinnerIcon /><span>Cargando gastos fijos...</span></div>
            </div>
        );
    }

    return (
        <div className="gf-container">
            <BackButton to="/dashboard/finanzas" />

            <div className="gf-header">
                <h1>
                    Gastos Fijos Mensuales
                    <span>• Configuración de egresos recurrentes</span>
                </h1>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/dashboard/finanzas" className="fin-btn">← Volver a Finanzas</Link>
                    <button className="fin-btn fin-btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? "✕ Cerrar" : "＋ Nuevo Gasto Fijo"}
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="gf-summary">
                <div className="gf-summary-card total">
                    <div className="gf-summary-label">Total Mensual</div>
                    <div className="gf-summary-value red">{formatCurrency(totalMensual)}</div>
                </div>
                <div className="gf-summary-card activos">
                    <div className="gf-summary-label">Gastos Activos</div>
                    <div className="gf-summary-value green">{gastosActivos}</div>
                </div>
                <div className="gf-summary-card alerta">
                    <div className="gf-summary-label">Próximos a Vencer</div>
                    <div className="gf-summary-value">{proximosVencer}</div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="gf-form-card">
                    <form onSubmit={handleSubmit}>
                        <div className="gf-form-row">
                            <div className="gf-form-field">
                                <label>Categoría</label>
                                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} required>
                                    <option value="">Seleccionar...</option>
                                    {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div className="gf-form-field">
                                <label>Monto Mensual ($)</label>
                                <input type="number" min="0" step="100" placeholder="0" value={form.monto_ars} onChange={e => setForm(f => ({ ...f, monto_ars: e.target.value }))} required />
                            </div>
                            <div className="gf-form-field">
                                <label>Día de Vencimiento</label>
                                <input type="number" min="1" max="28" placeholder="1-28" value={form.dia_vencimiento} onChange={e => setForm(f => ({ ...f, dia_vencimiento: e.target.value }))} required />
                            </div>
                        </div>
                        <div className="gf-form-row" style={{ marginTop: "10px" }}>
                            <div className="gf-form-field">
                                <label>Descripción (opcional)</label>
                                <input type="text" placeholder="Ej: Caja Forense mensual" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                            </div>
                        </div>
                        <div className="gf-form-actions">
                            <button type="button" className="fin-btn" onClick={() => setShowForm(false)}>Cancelar</button>
                            <button type="submit" className="fin-btn fin-btn-primary" disabled={submitting}>
                                {submitting ? "Guardando..." : "Guardar Gasto Fijo"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="gf-list">
                {gastos.length === 0 ? (
                    <div className="gf-empty">
                        No hay gastos fijos configurados. Usá el botón "Nuevo Gasto Fijo" para agregar.
                    </div>
                ) : (
                    gastos.map(g => (
                        <div className="gf-item" key={g.id_gasto_recurrente}>
                            <div className="gf-item-main">
                                <div className="gf-item-day">
                                    {editingId === g.id_gasto_recurrente ? (
                                        <input
                                            type="number" min="1" max="28"
                                            value={editDia}
                                            onChange={e => setEditDia(e.target.value)}
                                            style={{ width: "36px", textAlign: "center", padding: "4px", fontSize: "0.9rem" }}
                                        />
                                    ) : (
                                        <>
                                            <span className="num">{g.dia_vencimiento}</span>
                                            <span className="label">día</span>
                                        </>
                                    )}
                                </div>
                                <div className="gf-item-info">
                                    <div className="gf-item-desc">{g.descripcion || getCatLabel(g.categoria)}</div>
                                    <div className="gf-item-cat">{getCatLabel(g.categoria)}</div>
                                </div>
                            </div>

                            {editingId === g.id_gasto_recurrente ? (
                                <div className="gf-edit-field">
                                    <span>$</span>
                                    <input
                                        type="number" min="0" step="100"
                                        value={editMonto}
                                        onChange={e => setEditMonto(e.target.value)}
                                    />
                                    <button className="fin-btn fin-btn-primary" style={{ padding: "6px 12px", fontSize: "0.75rem" }} onClick={() => saveEdit(g.id_gasto_recurrente)}>✓</button>
                                    <button className="fin-btn" style={{ padding: "6px 12px", fontSize: "0.75rem" }} onClick={() => setEditingId(null)}>✕</button>
                                </div>
                            ) : (
                                <div className="gf-item-amount">{formatCurrency(g.monto_ars)}</div>
                            )}

                            <div className="gf-item-actions">
                                {editingId !== g.id_gasto_recurrente && (
                                    <>
                                        <button onClick={() => startEditing(g)} title="Editar">✎</button>
                                        <button className="delete-btn" onClick={() => setDeleteModal({ open: true, id: g.id_gasto_recurrente, nombre: g.descripcion || getCatLabel(g.categoria) })} title="Eliminar">✕</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <DeleteModal
                isOpen={deleteModal.open}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ open: false, id: null, nombre: "" })}
                title="Eliminar gasto fijo"
                message={`¿Estás seguro que querés eliminar "${deleteModal.nombre}"? Esto no afecta los movimientos ya generados.`}
                confirmLabel="Eliminar"
                confirmVariant="danger"
            />
        </div>
    );
};

export default GastosFijos;
