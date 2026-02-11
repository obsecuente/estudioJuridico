// src/components/common/MiDia.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tareasService from "../../services/tareas.service";
import eventosService from "../../services/eventos.service";
import vencimientosService from "../../services/vencimientos.service";
import finanzasService from "../../services/finanzas.service";
import { SpinnerIcon, TrashICon, AddIcon, CalendarIcon, AlarmIcon, CasosIcon, AbogadosIcon, LocacionIcon } from "./Icons";
import "./MiDia.css";

// Helper para obtener fecha local como string YYYY-MM-DD (evita problemas de timezone)
const getHoyLocal = () => {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
};

// Categorías sugeridas (el usuario puede escribir las propias)
const CATEGORIAS_SUGERIDAS = [
    { label: "Procuración", value: "procuracion" },
    { label: "Escrito", value: "escrito" },
    { label: "Comunicación", value: "comunicacion" },
    { label: "Gestión", value: "gestion" },
];

const MiDia = () => {
    const navigate = useNavigate();
    // Estado principal: datos organizados del endpoint /mi-dia
    const [miDiaData, setMiDiaData] = useState(null);
    const [eventosHoy, setEventosHoy] = useState([]);
    const [vencimientosHoy, setVencimientosHoy] = useState([]);
    const [loading, setLoading] = useState(true);

    // Input rápido
    const [nuevaTarea, setNuevaTarea] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [nuevaPrioridad, setNuevaPrioridad] = useState("media");
    const [nuevaCategoria, setNuevaCategoria] = useState("");
    const [nuevoIdCaso, setNuevoIdCaso] = useState("");
    const [nuevaFechaLimite, setNuevaFechaLimite] = useState("");

    // Tareas recién completadas (para animación)
    const [recienCompletadas, setRecienCompletadas] = useState(new Set());

    useEffect(() => {
        cargarMiDia();
    }, []);

    const cargarMiDia = async () => {
        try {
            setLoading(true);
            const [miDiaRes] = await Promise.all([
                tareasService.getMiDia(),
            ]);
            setMiDiaData(miDiaRes.data || null);
            // Cargar eventos y vencimientos de hoy en paralelo
            await Promise.all([cargarEventosHoy(), cargarVencimientosHoy()]);
        } catch (err) {
            console.error("Error al cargar Mi Día:", err);
        } finally {
            setLoading(false);
        }
    };

    const cargarEventosHoy = async () => {
        try {
            const hoy = getHoyLocal();
            const response = await eventosService.getAll({
                fecha_desde: hoy,
                fecha_hasta: hoy,
                estado: "pendiente",
            });
            setEventosHoy(response?.data || []);
        } catch (err) {
            console.error("Error al cargar eventos:", err);
        }
    };

    const cargarVencimientosHoy = async () => {
        try {
            const hoy = getHoyLocal(); // YYYY-MM-DD
            const [vencRes, gastosRes] = await Promise.all([
                vencimientosService.getAll({ estado: "pendiente" }),
                finanzasService.getPendientesMes()
            ]);

            const todos = vencRes?.data || [];
            const deHoy = todos.filter((v) => {
                if (!v.fecha_limite) return false;
                return String(v.fecha_limite).split("T")[0] === hoy;
            });

            // Gastos recurrentes que vencen hoy (coincide día del mes)
            const hoyDia = new Date().getDate();
            const listaGastos = gastosRes?.data || [];
            console.log("MiDia - Gastos check:", { hoyDia, gastosCount: listaGastos.length });

            const gastosHoy = listaGastos.filter(g => {
                if (!g.gasto_recurrente) return false;
                // Mostrar solo pendientes
                if (g.estado !== "pendiente") return false;

                // Vence hoy si el día de vencimiento es igual al día actual (usar == para evitar problemas de tipos)
                const diaVenc = g.gasto_recurrente.dia_vencimiento;
                const match = diaVenc == hoyDia;
                if (match) console.log("MiDia - Gasto matches today:", g.descripcion);
                return match;
            }).map(g => ({
                id_vencimiento: `gasto-${g.id_movimiento}`,
                titulo: `💸 ${g.descripcion || g.category}`,
                tipo_vencimiento: "Gasto Fijo",
                // Usar fecha real de este mes/año para que el sort funcione
                fecha_limite: new Date(new Date().getFullYear(), new Date().getMonth(), hoyDia).toISOString(),
                caso: null,
                es_gasto: true,
                monto: g.monto_ars
            }));

            setVencimientosHoy([...deHoy, ...gastosHoy]);
        } catch (err) {
            console.error("Error al cargar vencimientos:", err);
        }
    };

    // ═══ ACCIONES ═══

    const agregarTarea = async (e) => {
        e.preventDefault();
        if (!nuevaTarea.trim() || submitting) return;

        try {
            setSubmitting(true);
            await tareasService.crear({
                descripcion: nuevaTarea.trim(),
                prioridad: nuevaPrioridad,
                categoria: nuevaCategoria || null,
                id_caso: nuevoIdCaso ? parseInt(nuevoIdCaso) : null,
                fecha_limite: nuevaFechaLimite || null,
            });
            setNuevaTarea("");
            setNuevaPrioridad("media");
            setNuevaCategoria("");
            setNuevoIdCaso("");
            setNuevaFechaLimite("");
            setShowAdvanced(false);
            cargarMiDia();
        } catch (err) {
            console.error("Error al crear tarea:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleCompletada = async (tarea) => {
        try {
            if (!tarea.completada) {
                // Animación de satisfacción
                setRecienCompletadas((prev) => new Set(prev).add(tarea.id_tarea));
                // Esperar animación y luego completar
                setTimeout(async () => {
                    await tareasService.marcarCompletada(tarea.id_tarea, true);
                    cargarMiDia();
                    // Limpiar de recién completadas después de un rato
                    setTimeout(() => {
                        setRecienCompletadas((prev) => {
                            const next = new Set(prev);
                            next.delete(tarea.id_tarea);
                            return next;
                        });
                    }, 500);
                }, 800);
            } else {
                await tareasService.marcarCompletada(tarea.id_tarea, false);
                cargarMiDia();
            }
        } catch (err) {
            console.error("Error al marcar tarea:", err);
        }
    };

    const completarEvento = async (evento) => {
        try {
            await eventosService.update(evento.id_evento, { estado: "completado" });
            cargarEventosHoy();
        } catch (err) {
            console.error("Error al completar evento:", err);
        }
    };

    const completarVencimiento = async (venc) => {
        if (!venc) return;
        try {
            // Manejo de Gasto Fijo
            if (String(venc.id_vencimiento).startsWith("gasto-")) {
                const idMov = venc.id_vencimiento.replace("gasto-", "");
                await finanzasService.marcarPagado(idMov);
            } else {
                await vencimientosService.marcarCumplido(venc.id_vencimiento);
            }
            // Recargar
            await cargarVencimientosHoy();
            // Agregar a completadas para animación
            const id = venc.id_vencimiento;
            setRecienCompletadas(prev => new Set(prev).add(id));
            setTimeout(() => {
                setRecienCompletadas(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }, 1000);
        } catch (err) {
            console.error("Error al completar vencimiento:", err);
        }
    };

    const eliminarTarea = async (idTarea) => {
        try {
            await tareasService.eliminar(idTarea);
            cargarMiDia();
        } catch (err) {
            console.error("Error al eliminar tarea:", err);
        }
    };

    const pasarAPlazoDeGracia = async (tarea) => {
        try {
            await tareasService.pasarAPlazoDeGracia(tarea.id_tarea);
            cargarMiDia();
        } catch (err) {
            console.error("Error al pasar al plazo de gracia:", err);
        }
    };

    // ═══ HELPERS ═══

    const formatFecha = (fecha) => {
        if (!fecha) return null;
        // Usar comparación de strings para evitar problemas de timezone
        const fechaStr = String(fecha).split("T")[0];
        const hoyStr = getHoyLocal();

        // Calcular mañana como string
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const mananaStr = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;

        if (fechaStr < hoyStr) return { text: "Vencida", class: "vencida" };
        if (fechaStr === hoyStr) return { text: "Hoy", class: "hoy" };
        if (fechaStr === mananaStr) return { text: "Mañana", class: "manana" };
        // Formatear con toLocaleDateString para fechas futuras
        const [y, m, d] = fechaStr.split("-");
        const displayDate = new Date(Number(y), Number(m) - 1, Number(d));
        return { text: displayDate.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }), class: "" };
    };

    const getFechaHeader = () => {
        const hoy = new Date();
        const opciones = { weekday: "long", day: "numeric", month: "long" };
        const fecha = hoy.toLocaleDateString("es-AR", opciones);
        return fecha.charAt(0).toUpperCase() + fecha.slice(1);
    };

    const tipoEventoLabel = {
        audiencia: "Audiencia",
        reunion: "Reunión",
        tarea: "Tarea",
        vencimiento: "Vencimiento",
        otro: "Evento",
    };

    // ═══ RENDER DE TAREA INDIVIDUAL ═══

    const renderTarea = (tarea, seccion = "pendientes") => {
        const fechaInfo = formatFecha(tarea.fecha_limite);
        const isCompletando = recienCompletadas.has(tarea.id_tarea);

        return (
            <div
                key={tarea.id_tarea}
                className={`midia-tarea prioridad-${tarea.prioridad} ${isCompletando ? "completando" : ""} ${tarea.en_plazo_gracia ? "plazo-gracia" : ""}`}
            >
                <div
                    className={`midia-checkbox ${isCompletando ? "checked" : ""}`}
                    onClick={() => toggleCompletada(tarea)}
                    title="Marcar como completada"
                />
                <div className="midia-tarea-content">
                    <div className={`midia-tarea-texto ${isCompletando ? "tachado" : ""}`}>
                        {tarea.descripcion}
                    </div>
                    <div className="midia-tarea-meta">
                        {tarea.categoria && (
                            <span className="midia-categoria">{tarea.categoria}</span>
                        )}
                        {tarea.caso && (
                            <span
                                className="caso caso-link"
                                onClick={() => navigate(`/casos/${tarea.caso.id_caso}`)}
                                title={`Ir al caso: ${tarea.caso.descripcion}`}
                            >
                                <CasosIcon /> {tarea.caso.descripcion?.substring(0, 30)}
                            </span>
                        )}
                        {fechaInfo && (
                            <span className={fechaInfo.class}><CalendarIcon /> {fechaInfo.text}</span>
                        )}
                        {tarea.hora_limite && (
                            <span className="hora-limite"><AlarmIcon /> {tarea.hora_limite.substring(0, 5)}</span>
                        )}
                    </div>
                </div>
                <div className="midia-tarea-actions">
                    {/* Botón Plazo de Gracia: solo para tareas que vencen hoy o están atrasadas */}
                    {(seccion === "vencen_hoy" || seccion === "atrasadas") && !tarea.en_plazo_gracia && (
                        <button
                            className="midia-gracia-btn"
                            onClick={() => pasarAPlazoDeGracia(tarea)}
                            title="Pasar al Plazo de Gracia (Art. 124 CPCC) → Mañana 09:30"
                        >
                            <AbogadosIcon />
                        </button>
                    )}
                    <button
                        className="midia-tarea-delete"
                        onClick={() => eliminarTarea(tarea.id_tarea)}
                        title="Eliminar tarea"
                    >
                        <TrashICon />
                    </button>
                </div>
            </div>
        );
    };

    // ═══ RENDER PRINCIPAL ═══

    const stats = miDiaData?.stats || { pendientes: 0, completadas: 0, vencidas: 0 };
    const urgentes = miDiaData?.urgentes || [];
    const vencenHoy = miDiaData?.vencen_hoy || [];
    const atrasadas = miDiaData?.atrasadas || [];
    const pendientes = miDiaData?.pendientes || [];

    return (
        <div className="midia-widget">
            {/* Header con fecha y stats */}
            <div className="midia-header">
                <h3>Mi Día — <span className="midia-fecha">{getFechaHeader()}</span></h3>
                <div className="midia-stats">
                    {stats.vencidas > 0 && (
                        <span className="midia-stat atrasadas"> {stats.vencidas} atrasadas</span>
                    )}
                    <span className="midia-stat pendientes">{stats.pendientes} pendientes</span>
                    <span className="midia-stat completadas">{stats.completadas} hechas</span>
                </div>
            </div>

            {/* Input rápido */}
            <form className="midia-form" onSubmit={agregarTarea}>
                <div className="midia-input-row">
                    <input
                        type="text"
                        placeholder="Escribí una tarea nueva y dale Enter..."
                        value={nuevaTarea}
                        onChange={(e) => setNuevaTarea(e.target.value)}
                        disabled={submitting}
                    />
                    <button
                        type="button"
                        className={`midia-advanced-toggle ${showAdvanced ? "active" : ""}`}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        title="Opciones avanzadas"
                    >
                        ⚙️
                    </button>
                    <button type="submit" disabled={submitting || !nuevaTarea.trim()}>
                        <AddIcon /> Agregar
                    </button>
                </div>

                {/* Panel expandible de opciones */}
                {showAdvanced && (
                    <div className="midia-advanced-panel">
                        <div className="midia-advanced-row">
                            <div className="midia-field">
                                <label>Prioridad</label>
                                <div className="midia-prioridad-selector">
                                    {["baja", "media", "alta"].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            className={`midia-prio-btn prio-${p} ${nuevaPrioridad === p ? "active" : ""}`}
                                            onClick={() => setNuevaPrioridad(p)}
                                        >
                                            {p === "alta" ? "🔴" : p === "media" ? "🟡" : "⬜"} {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="midia-field">
                                <label>Categoría</label>
                                <div className="midia-categorias-chips">
                                    {CATEGORIAS_SUGERIDAS.map((cat) => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            className={`midia-cat-chip ${nuevaCategoria === cat.value ? "active" : ""}`}
                                            onClick={() => setNuevaCategoria(nuevaCategoria === cat.value ? "" : cat.value)}
                                        >
                                            {cat.emoji} {cat.label}
                                        </button>
                                    ))}
                                    <input
                                        type="text"
                                        className="midia-cat-custom"
                                        placeholder="Otra..."
                                        value={!CATEGORIAS_SUGERIDAS.some(c => c.value === nuevaCategoria) ? nuevaCategoria : ""}
                                        onChange={(e) => setNuevaCategoria(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="midia-advanced-row">
                            <div className="midia-field">
                                <label>📅 Fecha Límite</label>
                                <input
                                    type="date"
                                    value={nuevaFechaLimite}
                                    onChange={(e) => setNuevaFechaLimite(e.target.value)}
                                />
                            </div>
                            <div className="midia-field">
                                <label><CasosIcon /> Caso (ID)</label>
                                <input
                                    type="number"
                                    placeholder="ID del caso"
                                    value={nuevoIdCaso}
                                    onChange={(e) => setNuevoIdCaso(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {/* Lista organizada por urgencia */}
            <div className="midia-list">
                {loading ? (
                    <div className="midia-loading">
                        <SpinnerIcon />
                        <span>Cargando Mi Día...</span>
                    </div>
                ) : (
                    <>
                        {/* 🔴 URGENTE - Plazo de Gracia */}
                        {urgentes.length > 0 && (
                            <div className="midia-section">
                                <div className="midia-section-header midia-section-urgente">
                                    ⚖️ URGENTE — Plazo de Gracia
                                </div>
                                {urgentes.map((t) => renderTarea(t, "urgentes"))}
                            </div>
                        )}

                        {/* 🟠 VENCE HOY */}
                        {vencenHoy.length > 0 && (
                            <div className="midia-section">
                                <div className="midia-section-header midia-section-vence-hoy">
                                    VENCE HOY
                                </div>
                                {vencenHoy.map((t) => renderTarea(t, "vencen_hoy"))}
                            </div>
                        )}

                        {/* 📅 Agenda de Hoy (eventos) */}
                        {eventosHoy.length > 0 && (
                            <div className="midia-section">
                                <div className="midia-section-header midia-section-agenda">
                                    <CalendarIcon /> Agenda de Hoy
                                </div>
                                {eventosHoy.map((evento) => (
                                    <div
                                        key={`evt-${evento.id_evento}`}
                                        className="midia-tarea midia-evento"
                                    >
                                        <div
                                            className="midia-checkbox"
                                            onClick={() => completarEvento(evento)}
                                            title="Marcar como completado"
                                        />
                                        <div className="midia-tarea-content">
                                            <div className="midia-tarea-texto">{evento.titulo}</div>
                                            <div className="midia-tarea-meta">
                                                <span className="evento-tipo">
                                                    {tipoEventoLabel[evento.tipo] || evento.tipo}
                                                </span>
                                                {evento.hora_inicio && (
                                                    <span><AlarmIcon /> {evento.hora_inicio.substring(0, 5)}</span>
                                                )}
                                                {evento.ubicacion && (
                                                    <span><LocacionIcon /> {evento.ubicacion}</span>
                                                )}
                                                {evento.caso && (
                                                    <span
                                                        className="caso caso-link"
                                                        onClick={() => navigate(`/casos/${evento.caso.id_caso}`)}
                                                        title={`Ir al caso: ${evento.caso.descripcion}`}
                                                    >
                                                        <CasosIcon /> {evento.caso.descripcion?.substring(0, 30)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ⏰ Vencimientos de Hoy */}
                        {vencimientosHoy.length > 0 && (
                            <div className="midia-section">
                                <div className="midia-section-header midia-section-vencimiento">
                                    <AlarmIcon /> Vencimientos de Hoy
                                </div>
                                {vencimientosHoy.map((venc) => {
                                    const isCompletando = recienCompletadas.has(venc.id_vencimiento);
                                    return (
                                        <div
                                            key={`venc-${venc.id_vencimiento}`}
                                            className={`midia-tarea midia-vencimiento ${isCompletando ? "completando" : ""}`}
                                        >
                                            <div
                                                className={`midia-checkbox ${isCompletando ? "checked" : ""}`}
                                                onClick={() => completarVencimiento(venc)}
                                                title="Marcar como cumplido"
                                            />
                                            <div className="midia-tarea-content">
                                                <div className={`midia-tarea-texto ${isCompletando ? "tachado" : ""}`}>
                                                    {venc.titulo}
                                                </div>
                                                <div className="midia-tarea-meta">
                                                    <span className="vencimiento-tipo">
                                                        {venc.tipo_vencimiento || "Vencimiento"}
                                                    </span>
                                                    {venc.caso && (
                                                        <span
                                                            className="caso caso-link"
                                                            onClick={() => navigate(`/casos/${venc.caso.id_caso}`)}
                                                            title={`Ir al caso: ${venc.caso.descripcion}`}
                                                        >
                                                            <CasosIcon /> {venc.caso.descripcion?.substring(0, 30)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 🔵 PENDIENTES */}
                        {pendientes.length > 0 && (
                            <div className="midia-section">
                                <div className="midia-section-header midia-section-pendientes">
                                    PENDIENTES
                                </div>
                                {pendientes.map((t) => renderTarea(t, "pendientes"))}
                            </div>
                        )}

                        {/* 🔴 ATRASADAS (persistencia automática) */}
                        {atrasadas.length > 0 && (
                            <div className="midia-section">
                                <div className="midia-section-header midia-section-atrasadas">
                                    ATRASADAS — Pendientes de días anteriores
                                </div>
                                {atrasadas.map((t) => renderTarea(t, "atrasadas"))}
                            </div>
                        )}

                        {/* Estado vacío */}
                        {urgentes.length === 0 && vencenHoy.length === 0 && eventosHoy.length === 0 && vencimientosHoy.length === 0 && pendientes.length === 0 && atrasadas.length === 0 && (
                            <div className="midia-empty">
                                Sin tareas pendientes.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MiDia;


