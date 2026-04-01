import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import casosService from "../../services/casos.service";
import tareasService from "../../services/tareas.service";
import CasoForm from "./CasoForm";
import EditarEtapaModal from "./EditarEtapaModal";
import EditarDemandadoModal from "./EditarDemandadoModal";
import DocumentoUpload from "../documentos/DocumentoUpload";
import Toast from "../../components/common/Toast";
import DeleteModal from "../../components/common/DeleteModal";
import "./CasoDetail.css";
import {
  AbogadosIcon,
  CalendarIcon,
  DocumentosIcon,
  DownLoadIcon,
  excelIcon,
  EyeIcon,
  pdfIcon,
  PencilIcon,
  photoIcon,
  SaveIcon,
  TrashICon,
  txtIcon,
  UploadIcon,
  wordIcon,
  zipIcon,
  DineroIcon,
  AddIcon,
  FinanzasIcon,
  SpinnerIcon,
  EventIcon,
} from "../../components/common/Icons";
import BackButton from "../../components/common/BackButton";

// Tiempo relativo
const tiempoRelativo = (fecha) => {
  if (!fecha) return "";
  const ahora = new Date();
  const f = new Date(fecha);
  const diffMs = ahora - f;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Justo ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} dias`;
  if (dias < 30) return `hace ${Math.floor(dias / 7)} sem`;
  return f.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
};

// Icono y color por tipo de evento
const iconoPorTipo = {
  NOTA_MANUAL: <PencilIcon />,
  SISTEMA_DOCUMENTO: <DocumentosIcon />,
  SISTEMA_FINANZAS: <DineroIcon />,
  SISTEMA_VENCIMIENTO: <CalendarIcon />,
  CAMBIO_ESTADO: <AbogadosIcon />,
  CAMBIO_ETAPA: <FinanzasIcon />,
};

const colorPorTipo = {
  NOTA_MANUAL: { bg: "rgba(212, 175, 55, 0.12)", border: "rgba(212, 175, 55, 0.5)", icon: "#d4af37", label: "Nota" },
  SISTEMA_DOCUMENTO: { bg: "rgba(96, 165, 250, 0.12)", border: "rgba(96, 165, 250, 0.5)", icon: "#60a5fa", label: "Documento" },
  SISTEMA_FINANZAS: { bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.5)", icon: "#34d399", label: "Finanzas" },
  SISTEMA_VENCIMIENTO: { bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.5)", icon: "#fbbf24", label: "Vencimiento" },
  CAMBIO_ESTADO: { bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.5)", icon: "#a855f7", label: "Estado" },
  CAMBIO_ETAPA: { bg: "rgba(251, 146, 60, 0.12)", border: "rgba(251, 146, 60, 0.5)", icon: "#fb923c", label: "Etapa" },
};

const FILTROS_TIMELINE = [
  { key: "todos", label: "Todo" },
  { key: "notas", label: "Notas", tipos: ["NOTA_MANUAL"] },
  { key: "finanzas", label: "Finanzas", tipos: ["SISTEMA_FINANZAS"] },
  { key: "documentos", label: "Docs", tipos: ["SISTEMA_DOCUMENTO"] },
  { key: "sistema", label: "Sistema", tipos: ["SISTEMA_VENCIMIENTO", "CAMBIO_ESTADO", "CAMBIO_ETAPA"] },
];

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES MEMOIZADOS — Evitan re-renders cruzados
// ═══════════════════════════════════════════════════════════════

/**
 * DocumentosPanel — Aislado del historial y finanzas.
 * Cambiar docPage solo re-renderiza este bloque.
 */
const DocumentosPanel = memo(function DocumentosPanel({
  documentos, docPage, setDocPage, docSearch, setDocSearch,
  docSearchResults, onSearch, onVerDoc, onDescargarDoc,
  onOCR, ocrLoading, onUpload, getFileIcon
}) {
  const DOCS_POR_PAGINA = 3;
  const docsOrdenados = useMemo(
    () => [...(documentos || [])].sort((a, b) => b.id_documento - a.id_documento),
    [documentos]
  );
  const totalDocsPaginas = Math.ceil(docsOrdenados.length / DOCS_POR_PAGINA);
  const inicio = (docPage - 1) * DOCS_POR_PAGINA;
  const docsVisibles = docsOrdenados.slice(inicio, inicio + DOCS_POR_PAGINA);

  return (
    <div className="panel panel-docs">
      <div className="panel-title">
        <span><DocumentosIcon /> Documentos ({documentos?.length || 0})</span>
        <button className="btn-small-panel" onClick={onUpload}><UploadIcon /> Subir</button>
      </div>

      <div className="doc-search-bar">
        <input
          type="text"
          className="doc-search-input"
          placeholder="Buscar dentro de documentos..."
          value={docSearch}
          onChange={(e) => { setDocSearch(e.target.value); setDocPage(1); }}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        <button className="doc-search-btn" onClick={onSearch} disabled={docSearch.trim().length < 2}>🔍</button>
      </div>

      {docSearchResults && docSearchResults.length > 0 && (
        <div className="doc-search-results">
          <div className="doc-search-label">Resultados en documentos:</div>
          {docSearchResults.map((r) => (
            <div key={r.id_documento} className="doc-search-result-item">
              <span className="doc-search-name">{r.nombre_archivo}</span>
              <span className="doc-search-snippet">{r.snippet}</span>
            </div>
          ))}
        </div>
      )}
      {docSearchResults && docSearchResults.length === 0 && (
        <div className="panel-empty" style={{ fontSize: '12px', padding: '8px' }}>Sin coincidencias en documentos</div>
      )}

      {docsOrdenados.length > 0 ? (
        <>
          <div className="docs-list">
            {docsVisibles.map((doc) => (
              <div key={doc.id_documento} className="doc-item">
                <div className="doc-info" onClick={() => onVerDoc(doc)}>
                  <span className="doc-icon">{getFileIcon(doc.nombre_archivo)}</span>
                  <span className="doc-name">{doc.nombre_archivo}</span>
                </div>
                <div className="doc-actions">
                  <button className="item-action-btn" onClick={() => onOCR(doc.id_documento)} title="Extraer texto (OCR)" disabled={ocrLoading === doc.id_documento}>
                    {ocrLoading === doc.id_documento ? <SpinnerIcon /> : "📝"}
                  </button>
                  <button className="item-action-btn" onClick={() => onVerDoc(doc)} title="Ver"><EyeIcon /></button>
                  <button className="item-action-btn" onClick={() => onDescargarDoc(doc)} title="Descargar"><DownLoadIcon /></button>
                </div>
              </div>
            ))}
          </div>
          {totalDocsPaginas > 1 && (
            <div className="doc-pagination">
              <button className="doc-pag-btn" disabled={docPage <= 1} onClick={() => setDocPage(p => p - 1)} title="Página anterior">← Anterior</button>
              <span className="doc-pag-info">{docPage} / {totalDocsPaginas}</span>
              <button className="doc-pag-btn" disabled={docPage >= totalDocsPaginas} onClick={() => setDocPage(p => p + 1)} title="Página siguiente">Siguiente →</button>
            </div>
          )}
        </>
      ) : (
        <div className="panel-empty">Sin documentos</div>
      )}
    </div>
  );
});

/**
 * FinanzasPanel — Aislado de documentos y historial.
 */
const FinanzasPanel = memo(function FinanzasPanel({
  resumenFinanciero, mostrarTodasCuotas, setMostrarTodasCuotas,
  onCobrarCuota, formatMoney
}) {
  const cuotasPendientes = resumenFinanciero.cuotas_pendientes || [];
  const totalCuotas = cuotasPendientes.length;
  const cuotasVisibles = mostrarTodasCuotas ? cuotasPendientes : cuotasPendientes.slice(0, 3);
  const formatFechaCorta = (f) => {
    if (!f) return "-";
    return new Date(f).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="panel panel-finanzas">
      <div className="panel-title"><DineroIcon /> Finanzas</div>
      <div className="panel-kpi">
        <span className="kpi-label">Pendiente de Cobro</span>
        <span className="kpi-value kpi-pendiente">{formatMoney(resumenFinanciero.total_pendiente_ars)}</span>
      </div>
      <div className="panel-kpi panel-kpi-cobrado">
        <span className="kpi-label">Cobrado del Caso</span>
        <span className="kpi-value kpi-cobrado">{formatMoney(resumenFinanciero.total_cobrado_ars)}</span>
      </div>

      {totalCuotas > 0 && (
        <div className="cuotas-list">
          <div className="section-label">Proximas Cuotas ({totalCuotas})</div>
          {cuotasVisibles.map((c) => (
            <div key={c.id_cuota} className="cuota-item">
              <div className="cuota-info">
                <span className="cuota-num">C{c.numero_cuota}</span>
                <span className="cuota-fecha">{formatFechaCorta(c.fecha_vencimiento)}</span>
                <span className="cuota-monto">{formatMoney(c.monto_cuota)}</span>
              </div>
              <button className="btn-cobrar" onClick={() => onCobrarCuota(c.id_cuota, c.numero_cuota)}>Cobrar</button>
            </div>
          ))}
          {totalCuotas > 3 && (
            <button className="btn-ver-mas-cuotas" onClick={() => setMostrarTodasCuotas(!mostrarTodasCuotas)}>
              {mostrarTodasCuotas ? "Ver menos" : `Ver todas (${totalCuotas})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * HistorialPanel — Aislado de documentos y finanzas.
 * El panel más pesado (~50+ nodos DOM con iconos y badges).
 */
const HistorialPanel = memo(function HistorialPanel({
  historial, filtroTimeline, setFiltroTimeline,
  paginaHistorial, setPaginaHistorial,
  notaTexto, setNotaTexto, notaImportante, setNotaImportante,
  guardandoNota, onGuardarNota
}) {
  const filtroActivo = FILTROS_TIMELINE.find((f) => f.key === filtroTimeline);
  const historialFiltrado = filtroTimeline === "todos"
    ? historial
    : (historial || []).filter((ev) => filtroActivo?.tipos?.includes(ev.tipo_evento));
  const ITEMS_POR_PAGINA = 10;
  const totalPaginas = Math.ceil((historialFiltrado || []).length / ITEMS_POR_PAGINA);
  const inicioH = (paginaHistorial - 1) * ITEMS_POR_PAGINA;
  const historialVisible = (historialFiltrado || []).slice(inicioH, inicioH + ITEMS_POR_PAGINA);

  return (
    <div className="panel panel-historial">
      <div className="panel-title"><PencilIcon /> Historial del Caso</div>

      <div className="nota-form">
        <textarea className="nota-textarea" placeholder="Anotar novedad del caso..." value={notaTexto} onChange={(e) => setNotaTexto(e.target.value)} rows={3} />
        <div className="nota-actions">
          <label className="nota-importante-check">
            <input type="checkbox" checked={notaImportante} onChange={(e) => setNotaImportante(e.target.checked)} className="custom-check" />
            <span className="check-label">Marcar como importante</span>
          </label>
          <button className="btn-guardar-nota" onClick={onGuardarNota} disabled={guardandoNota || !notaTexto.trim()}>
            {guardandoNota ? <SpinnerIcon /> : <SaveIcon />} Guardar
          </button>
        </div>
      </div>

      <div className="timeline-filters">
        {FILTROS_TIMELINE.map((f) => (
          <button
            key={f.key}
            className={`timeline-filter-btn ${filtroTimeline === f.key ? "active" : ""}`}
            onClick={() => { setFiltroTimeline(f.key); setPaginaHistorial(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="timeline">
        {historial && historial.length > 0 ? (
          historialFiltrado.length > 0 ? (
            <>
              {historialVisible.map((ev) => {
                const tipoColor = colorPorTipo[ev.tipo_evento] || colorPorTipo.NOTA_MANUAL;
                return (
                  <div key={ev.id_historial} className={`timeline-event ${ev.es_importante ? "evento-importante" : ""}`}>
                    <div
                      className="timeline-icon"
                      style={!ev.es_importante ? {
                        background: tipoColor.bg,
                        borderColor: tipoColor.border,
                      } : undefined}
                    >
                      <span style={!ev.es_importante ? { color: tipoColor.icon } : undefined}>
                        {iconoPorTipo[ev.tipo_evento] || <PencilIcon />}
                      </span>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-type-badge" style={{ color: tipoColor.icon, background: tipoColor.bg }}>
                          {tipoColor.label}
                        </span>
                        {ev.es_importante && <span className="timeline-important-badge">⚠️ Importante</span>}
                      </div>
                      <p className="timeline-desc">{ev.descripcion}</p>
                      <div className="timeline-meta">
                        <span className="timeline-time">{tiempoRelativo(ev.fecha_registro)}</span>
                        {ev.usuario && <span className="timeline-user">{ev.usuario.nombre} {ev.usuario.apellido}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {totalPaginas > 1 && (
                <div className="timeline-pagination">
                  <button className="pagination-btn pagination-arrow" disabled={paginaHistorial <= 1} onClick={() => setPaginaHistorial(p => p - 1)}>◀</button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                    <button key={num} className={`pagination-btn ${paginaHistorial === num ? "pagination-active" : ""}`} onClick={() => setPaginaHistorial(num)}>{num}</button>
                  ))}
                  <button className="pagination-btn pagination-arrow" disabled={paginaHistorial >= totalPaginas} onClick={() => setPaginaHistorial(p => p + 1)}>▶</button>
                </div>
              )}
            </>
          ) : (
            <div className="panel-empty">No hay eventos de este tipo</div>
          )
        ) : (
          <div className="panel-empty">Aun no hay actividad registrada</div>
        )}
      </div>
    </div>
  );
});

const CasoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEtapaModal, setShowEtapaModal] = useState(false);
  const [showDemandadoModal, setShowDemandadoModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({});

  const [notaTexto, setNotaTexto] = useState("");
  const [notaImportante, setNotaImportante] = useState(false);
  const [guardandoNota, setGuardandoNota] = useState(false);

  const [etiquetasAbogado, setEtiquetasAbogado] = useState([]);
  const [showEtiquetaDropdown, setShowEtiquetaDropdown] = useState(false);
  const [nuevaEtiquetaNombre, setNuevaEtiquetaNombre] = useState("");

  const [mostrarTodasCuotas, setMostrarTodasCuotas] = useState(false);
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [filtroTimeline, setFiltroTimeline] = useState("todos");
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [creandoTarea, setCreandoTarea] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(null);
  const [docSearch, setDocSearch] = useState("");
  const [docSearchResults, setDocSearchResults] = useState(null);
  const [docPage, setDocPage] = useState(1); // paginación de documentos (3 por página)

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const cargarData = useCallback(async (background = false) => {
    try {
      if (!background) setLoading(true);
      setError(null);
      const res = await casosService.getDetalle360(id);
      setData(res.data);
    } catch (err) {
      console.error("Error al cargar detalle 360:", err);
      setError(err.response?.data?.error || "Error al cargar el caso");
    } finally {
      if (!background) setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargarData(); }, [cargarData]);

  const cargarEtiquetas = async () => {
    try {
      const res = await casosService.getEtiquetas();
      setEtiquetasAbogado(res.data || []);
    } catch { /* silenciar */ }
  };

  const handleEliminar = () => { setDeleteConfig({ type: "DELETE_CASE", id }); setShowDeleteModal(true); };
  const handleCerrarCaso = () => { setDeleteConfig({ type: "CLOSE_CASE", id }); setShowDeleteModal(true); };
  const handleReabrirCaso = () => { setDeleteConfig({ type: "REOPEN_CASE", id }); setShowDeleteModal(true); };

  const handleConfirmAction = async () => {
    try {
      if (deleteConfig.type === "DELETE_CASE") {
        await api.delete(`/casos/${deleteConfig.id}`);
        showToast("Caso eliminado exitosamente", "warning");
        setTimeout(() => navigate("/dashboard/casos"), 1500);
      } else if (deleteConfig.type === "CLOSE_CASE") {
        await api.patch(`/casos/${deleteConfig.id}/estado`, { estado: "cerrado" });
        showToast("Caso cerrado exitosamente", "success");
        cargarData(true);
      } else if (deleteConfig.type === "REOPEN_CASE") {
        await api.patch(`/casos/${deleteConfig.id}/estado`, { estado: "abierto" });
        showToast("Caso reabierto exitosamente", "success");
        cargarData(true);
      } else if (deleteConfig.type === "COBRAR_CUOTA") {
        await ejecutarCobrarCuota(deleteConfig.id);
      }
    } catch {
      showToast("Error al procesar la accion", "error");
    } finally {
      setShowDeleteModal(false);
      setDeleteConfig({});
    }
  };

  const getFileIcon = (nombreArchivo) => {
    if (!nombreArchivo) return <txtIcon />;
    const extension = nombreArchivo.split(".").pop().toLowerCase();
    const icons = {
      pdf: pdfIcon, doc: wordIcon, docx: wordIcon,
      xls: excelIcon, xlsx: excelIcon, txt: txtIcon,
      jpg: photoIcon, jpeg: photoIcon, png: photoIcon, gif: photoIcon,
      zip: zipIcon, rar: zipIcon,
    };
    const IconComponent = icons[extension] || txtIcon;
    return <IconComponent />;
  };

  const handleVerDocumento = useCallback(async (documento) => {
    try {
      showToast("Generando vista previa...", "info");
      const response = await api.get(`/documentos/${documento.id_documento}/descargar`, { responseType: "blob" });
      const extension = documento.nombre_archivo.split(".").pop().toLowerCase();
      let mimeType = response.headers["content-type"];
      if (extension === "pdf") mimeType = "application/pdf";
      if (["jpg", "jpeg", "png"].includes(extension)) mimeType = `image/${extension === "jpg" ? "jpeg" : extension}`;
      const file = new Blob([response.data], { type: mimeType });
      const fileURL = window.URL.createObjectURL(file);
      const win = window.open();
      if (win) {
        win.document.title = documento.nombre_archivo;
        const iframe = win.document.createElement("iframe");
        iframe.src = fileURL;
        iframe.style.cssText = "width:100%;height:100%;border:none;position:fixed;inset:0";
        win.document.body.style.margin = "0";
        win.document.body.appendChild(iframe);
        win.onbeforeunload = () => window.URL.revokeObjectURL(fileURL);
      } else {
        showToast("El navegador bloqueo la ventana emergente", "error");
      }
    } catch {
      showToast("Error de conexion con el servidor", "error");
    }
  }, [showToast]);

  const handleDescargarDocumento = useCallback(async (documento) => {
    try {
      const response = await api.get(`/documentos/${documento.id_documento}/descargar`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", documento.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Documento descargado exitosamente", "success");
    } catch {
      showToast("Error al descargar el documento", "error");
    }
  }, [showToast]);

  const handleGuardarNota = useCallback(async () => {
    if (!notaTexto.trim()) return;
    setGuardandoNota(true);
    try {
      await casosService.postHistorial(id, notaTexto, notaImportante);
      setNotaTexto("");
      setNotaImportante(false);
      showToast("Nota guardada", "success");
      cargarData(true);
    } catch {
      showToast("Error al guardar la nota", "error");
    } finally {
      setGuardandoNota(false);
    }
  }, [id, notaTexto, notaImportante, showToast, cargarData]);

  const handleCobrarCuota = useCallback((idCuota, numeroCuota) => {
    setDeleteConfig({ type: "COBRAR_CUOTA", id: idCuota, numeroCuota });
    setShowDeleteModal(true);
  }, []);

  const ejecutarCobrarCuota = async (idCuota) => {
    try {
      await api.patch(`/finanzas/cuotas/${idCuota}`, { fecha_pago: new Date().toISOString() });
      showToast("Cuota cobrada", "success");
      cargarData(true);
    } catch {
      showToast("Error al cobrar cuota", "error");
    }
  };

  const handleAsignarEtiqueta = async (idEtiqueta) => {
    try {
      await casosService.asignarEtiqueta(id, idEtiqueta);
      setShowEtiquetaDropdown(false);
      cargarData(true);
    } catch {
      showToast("Error al asignar etiqueta", "error");
    }
  };

  const handleQuitarEtiqueta = async (idEtiqueta) => {
    try {
      await casosService.quitarEtiqueta(id, idEtiqueta);
      cargarData(true);
    } catch {
      showToast("Error al quitar etiqueta", "error");
    }
  };

  const handleCrearYAsignar = async () => {
    if (!nuevaEtiquetaNombre.trim()) return;
    try {
      const res = await casosService.crearEtiqueta(nuevaEtiquetaNombre);
      await casosService.asignarEtiqueta(id, res.data.id_etiqueta);
      setNuevaEtiquetaNombre("");
      setShowEtiquetaDropdown(false);
      cargarData(true);
      cargarEtiquetas();
    } catch {
      showToast("Error al crear etiqueta", "error");
    }
  };

  const formatMoney = (n) => `$${parseFloat(n || 0).toLocaleString("es-AR")}`;
  const formatFechaCorta = (f) => {
    if (!f) return "-";
    return new Date(f).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  };

  // ═══ TAREAS DEL CASO ═══
  const handleCompletarTarea = useCallback(async (idTarea, completada) => {
    try {
      await tareasService.marcarCompletada(idTarea, !completada);
      cargarData(true);
    } catch {
      showToast("Error al actualizar tarea", "error");
    }
  }, [cargarData, showToast]);

  const handleCrearTareaCaso = async () => {
    if (!nuevaTarea.trim()) return;
    setCreandoTarea(true);
    try {
      await tareasService.crear({
        titulo: nuevaTarea.trim(),
        id_caso: parseInt(id),
        prioridad: "normal",
      });
      setNuevaTarea("");
      cargarData(true);
      showToast("Tarea creada", "success");
    } catch {
      showToast("Error al crear tarea", "error");
    } finally {
      setCreandoTarea(false);
    }
  };

  // ═══ OCR ═══
  const handleOCR = useCallback(async (idDocumento) => {
    setOcrLoading(idDocumento);
    try {
      const res = await api.post(`/documentos/${idDocumento}/ocr`);
      showToast(`Texto extraído: ${res.data.caracteres_extraidos} caracteres`, "success");
    } catch (err) {
      showToast("Error al extraer texto", "error");
    } finally {
      setOcrLoading(null);
    }
  }, [showToast]);

  const handleDocSearch = useCallback(async () => {
    if (!docSearch.trim() || docSearch.trim().length < 2) return;
    try {
      const res = await api.get(`/documentos/caso/${id}/buscar?q=${encodeURIComponent(docSearch)}`);
      setDocSearchResults(res.data.resultados);
    } catch {
      showToast("Error al buscar en documentos", "error");
    }
  }, [docSearch, id, showToast]);

  // ═══ EXPORTAR RESUMEN DEL CASO (Bypass de Conectividad) ═══
  const handleExportarResumen = () => {
    if (!data) return;
    const { caso, historial, resumen_financiero, vencimientos_proximos, eventos_proximos, etapa_legal_info } = data;
    const ahora = new Date().toLocaleString("es-AR");
    const ultimos10 = (historial || []).slice(0, 10);

    // Construir sección de clasificación procesal
    const tieneProcesal = caso.instancia || caso.tipo_proceso || caso.jurisdiccion || caso.fuero || caso.numero_expediente || etapa_legal_info;
    const seccionProcesal = tieneProcesal ? `
<h2>Clasificación Procesal</h2>
<div class="grid">
  ${caso.numero_expediente ? `<div class="card"><div class="card-title">Nº Expediente</div><div class="card-value">${caso.numero_expediente}</div></div>` : ""}
  ${caso.instancia ? `<div class="card"><div class="card-title">Instancia</div><div class="card-value">${caso.instancia}</div></div>` : ""}
  ${caso.tipo_proceso ? `<div class="card"><div class="card-title">Tipo de Proceso</div><div class="card-value">${caso.tipo_proceso}</div></div>` : ""}
  ${caso.jurisdiccion ? `<div class="card"><div class="card-title">Jurisdicción</div><div class="card-value">${caso.jurisdiccion.replace("_", " ")}</div></div>` : ""}
  ${caso.fuero ? `<div class="card"><div class="card-title">Fuero</div><div class="card-value" style="text-transform:capitalize">${caso.fuero}</div></div>` : ""}
</div>
${etapa_legal_info ? `<div class="card" style="margin-top:10px;border-left:3px solid #d4af37">
  <div class="card-title">Etapa Procesal Actual</div>
  <div class="card-value">Etapa ${etapa_legal_info.numero_etapa}: ${etapa_legal_info.descripcion}</div>
</div>` : ""}` : "";

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Caso #${caso.id_caso} — ${caso.descripcion}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 820px; margin: 0 auto; padding: 30px 24px; background: #0f172a; color: #e2e8f0; }
  h1 { border-bottom: 3px solid #d4af37; padding-bottom: 12px; font-size: 20px; color: #f1f5f9; margin-bottom: 4px; }
  h2 { color: #d4af37; font-size: 14px; margin-top: 28px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  .meta { color: #94a3b8; font-size: 12px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 12px 0; }
  .card { border: 1px solid #1e293b; border-radius: 10px; padding: 16px; background: #1a1f2b; }
  .card-title { font-size: 10px; text-transform: uppercase; color: #d4af37; font-weight: 700; letter-spacing: 0.8px; }
  .card-value { font-size: 15px; font-weight: 600; margin-top: 6px; color: #f1f5f9; }
  .card-sub { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0; }
  .kpi { text-align: center; padding: 14px; border-radius: 10px; background: #1a1f2b; border: 1px solid #1e293b; }
  .kpi-num { font-size: 18px; font-weight: 800; font-family: 'JetBrains Mono', 'Roboto Mono', monospace; }
  .kpi-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .verde { color: #10b981; } .rojo { color: #ef4444; } .dorado { color: #d4af37; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
  th { text-align: left; background: #1a1f2b; padding: 10px; font-size: 10px; text-transform: uppercase; color: #d4af37; letter-spacing: 0.5px; border-bottom: 2px solid #1e293b; }
  td { padding: 10px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
  tr:hover td { background: rgba(212, 175, 55, 0.03); }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .badge-abierto { background: rgba(16, 185, 129, 0.15); color: #34d399; }
  .badge-cerrado { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .footer { margin-top: 30px; padding-top: 14px; border-top: 2px solid #d4af37; font-size: 11px; color: #475569; text-align: center; }
  .print-bar { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px; }
  .print-bar button { padding: 10px 24px; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
  .btn-print { background: #d4af37; color: #0f172a; }
  .btn-print:hover { background: #f1c40f; }
  @media print { .print-bar { display: none !important; } body { background: white; color: #1a1a2e; } .card, .kpi { background: #f8f9fa; border-color: #ddd; } .card-title, h2, th { color: #8b7025; } .card-value, .kpi-num { color: #1a1a2e; } td, .card-sub { color: #333; } th { background: #f0f0f0; border-color: #ddd; } td { border-color: #eee; } .footer { border-color: #d4af37; color: #999; } h1 { color: #1a1a2e; } .meta { color: #666; } }
</style>
</head>
<body>
<div class="print-bar">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
</div>
<h1>⚖️ Caso #${caso.id_caso} — ${caso.descripcion}</h1>
<div class="meta">Exportado el ${ahora} · Estado: <span class="badge badge-${caso.estado}">${caso.estado?.toUpperCase()}</span></div>

<h2>Partes del Juicio</h2>
<div class="grid">
  <div class="card">
    <div class="card-title">Demandante (Cliente)</div>
    <div class="card-value">${caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido}` : "No definido"}</div>
    <div class="card-sub">${caso.cliente?.tipo_persona === "juridica" ? `CUIT: ${caso.cliente?.cuit || "—"}` : `DNI: ${caso.cliente?.dni || "—"}`}</div>
    <div class="card-sub">${caso.cliente?.domicilio_real || caso.cliente?.email || ""}</div>
  </div>
  <div class="card">
    <div class="card-title">Demandado (Contraparte)</div>
    <div class="card-value">${caso.demandado_nombre || "A definir"}</div>
    <div class="card-sub">${caso.demandado_tipo === "persona_juridica" ? "CUIT" : "DNI"}: ${caso.demandado_dni_cuit || "—"}</div>
    <div class="card-sub">${caso.demandado_domicilio || "Sin domicilio"}</div>
  </div>
</div>

${caso.objeto_del_juicio ? `<div class="card"><div class="card-title">Objeto del Juicio</div><div class="card-value">${caso.objeto_del_juicio}</div></div>` : ""}
${caso.monto_reclamado ? `<div class="card" style="margin-top:10px"><div class="card-title">Monto Reclamado</div><div class="card-value">$${parseFloat(caso.monto_reclamado).toLocaleString("es-AR")}</div></div>` : ""}

${seccionProcesal}

<h2>Estado Financiero</h2>
<div class="kpi-row">
  <div class="kpi"><div class="kpi-num verde">$${parseFloat(resumen_financiero?.total_cobrado_ars || 0).toLocaleString("es-AR")}</div><div class="kpi-label">Cobrado</div></div>
  <div class="kpi"><div class="kpi-num rojo">$${parseFloat(resumen_financiero?.total_pendiente_ars || 0).toLocaleString("es-AR")}</div><div class="kpi-label">Pendiente</div></div>
  <div class="kpi"><div class="kpi-num dorado">${(resumen_financiero?.cuotas_pendientes || []).length}</div><div class="kpi-label">Cuotas Pendientes</div></div>
</div>

${(vencimientos_proximos && vencimientos_proximos.length > 0) ? `
<h2>Vencimientos Próximos</h2>
<table><tr><th>Título</th><th>Fecha</th><th>Prioridad</th></tr>
${vencimientos_proximos.map(v => `<tr><td>${v.titulo}</td><td>${new Date(v.fecha_limite).toLocaleDateString("es-AR")}</td><td>${v.prioridad || "normal"}</td></tr>`).join("")}
</table>` : ""}

${(eventos_proximos && eventos_proximos.length > 0) ? `
<h2>Próximos Eventos</h2>
<table><tr><th>Evento</th><th>Fecha</th><th>Hora</th></tr>
${eventos_proximos.map(e => `<tr><td>${e.titulo}</td><td>${new Date(e.fecha_inicio).toLocaleDateString("es-AR")}</td><td>${e.hora_inicio ? e.hora_inicio.slice(0,5) : "—"}</td></tr>`).join("")}
</table>` : ""}

<h2>Últimos ${ultimos10.length} Hitos del Historial</h2>
<table><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th></tr>
${ultimos10.map(h => `<tr><td>${new Date(h.fecha_registro).toLocaleDateString("es-AR")}</td><td>${h.tipo_evento.replace("SISTEMA_", "").replace("_", " ")}</td><td>${h.descripcion}</td></tr>`).join("")}
</table>

<div class="footer">Documento generado por Sistema Jurídico · ${ahora}</div>
</body>
</html>`;

    const ventana = window.open("", "_blank");
    ventana.document.write(html);
    ventana.document.close();
    showToast("Resumen abierto — usá el botón Imprimir para guardar como PDF", "success");
  };

  if (loading) {
    return (
      <div className="detail-container">
        <div className="loading-container"><div className="spinner"></div><p>Cargando caso...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-container">
        <div className="error-message-360"><p>{error}</p><button className="btn-retry" onClick={cargarData}>Reintentar</button></div>
      </div>
    );
  }

  if (!data) return null;

  const { caso, historial, documentos, vencimientos_proximos, eventos_proximos, resumen_financiero, etapa_legal_info, tareas_caso } = data;
  const estadoBadge = caso.estado === "abierto" ? { text: "Abierto", cls: "badge-abierto" } : { text: "Cerrado", cls: "badge-cerrado" };



  return (
    <div className="detail-container caso-360">
      {/* Cabecera */}
      <div className="caso360-header">
        <div className="header-top">
          <BackButton to="/dashboard/casos" text="Volver a casos" />
          <div className="header-actions-360">
            <button className="btn-action-header btn-edit" onClick={() => setShowEditModal(true)}>
              <PencilIcon /> Editar Caso
            </button>
            <button className="btn-action-header btn-edit" onClick={() => setShowDemandadoModal(true)}>
              <AbogadosIcon /> Demandado
            </button>
            <button className="btn-action-header btn-exportar" onClick={handleExportarResumen} title="Exportar resumen offline">
              <DownLoadIcon /> Exportar
            </button>
            {caso.estado === "abierto" ? (
              <button className="btn-action-header btn-cerrar-caso" onClick={handleCerrarCaso}>Cerrar Caso</button>
            ) : (
              <button className="btn-action-header btn-reabrir-caso" onClick={handleReabrirCaso}>Reabrir Caso</button>
            )}
            <button className="btn-action-header btn-delete" onClick={handleEliminar}><TrashICon /></button>
          </div>
        </div>

        {/* VS Partes Header */}
        <div className="header-vs-partes">
          <div className="parte-card demandante" onClick={() => navigate(`/dashboard/clientes/${caso.cliente?.id_cliente}`)}>
            <div className="parte-badge">Demandante (Cliente)</div>
            <div className="parte-nombre">{caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido}` : "Desconocido"}</div>
            <div className="parte-doc">
              {caso.cliente?.tipo_persona === "juridica" ? `CUIT: ${caso.cliente?.cuit || "—"}` : `DNI: ${caso.cliente?.dni || "—"}`}
            </div>
            {caso.cliente?.perfil_completo_bool && <span className="perfil-completo-chip">Perfil Completo</span>}
          </div>
          <div className="vs-logo"></div>
          <div className="parte-card demandado" onClick={() => setShowDemandadoModal(true)}>
            <div className="parte-badge">Demandado (Contraparte)</div>
            <div className="parte-nombre">{caso.demandado_nombre || "A definir..."}</div>
            <div className="parte-doc">
              {caso.demandado_tipo === "persona_juridica" ? "CUIT: " : "DNI: "}
              {caso.demandado_dni_cuit || "—"}
            </div>
          </div>
        </div>

        <div className="header-info">
          <div className="header-title-row">
            <h1>Caso #{caso.id_caso} - {caso.descripcion}</h1>
          </div>
          <div className="header-badges">
            <span className={`estado-badge ${estadoBadge.cls}`}>{estadoBadge.text}</span>
            {caso.instancia && <span className="badge-procesal">{caso.instancia}</span>}
            {etapa_legal_info && (
              <span className="badge-etapa">Etapa {etapa_legal_info.numero_etapa}: {etapa_legal_info.descripcion}</span>
            )}
            {caso.numero_expediente && <span className="badge-expediente">Exp: {caso.numero_expediente}</span>}
            <button className="btn-editar-etapa" onClick={() => setShowEtapaModal(true)}>
              <PencilIcon /> Etapa
            </button>
          </div>
          <div className="header-tags">
            {(caso.etiquetas || []).map((et) => (
              <span key={et.id_etiqueta} className="tag-chip" style={{ backgroundColor: et.color_hex + "22", borderColor: et.color_hex, color: et.color_hex }}>
                {et.nombre}
                <button className="tag-remove" onClick={() => handleQuitarEtiqueta(et.id_etiqueta)} title="Quitar">x</button>
              </span>
            ))}
            <div className="tag-dropdown-wrapper">
              <button className="btn-add-tag" onClick={() => { setShowEtiquetaDropdown(!showEtiquetaDropdown); cargarEtiquetas(); }}>
                <AddIcon />
              </button>
              {showEtiquetaDropdown && (
                <div className="tag-dropdown">
                  {etiquetasAbogado.filter(et => !(caso.etiquetas || []).some(ce => ce.id_etiqueta === et.id_etiqueta)).map(et => (
                    <button key={et.id_etiqueta} className="tag-dropdown-item" onClick={() => handleAsignarEtiqueta(et.id_etiqueta)}>
                      <span className="tag-dot" style={{ backgroundColor: et.color_hex }}></span>{et.nombre}
                    </button>
                  ))}
                  <div className="tag-dropdown-create">
                    <input type="text" placeholder="Nueva..." value={nuevaEtiquetaNombre} onChange={(e) => setNuevaEtiquetaNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCrearYAsignar()} />
                    <button onClick={handleCrearYAsignar} disabled={!nuevaEtiquetaNombre.trim()}>+</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal: Izquierda (datos) | Derecha (historial) */}
      <div className="caso360-main-layout">
        <div className="col-izquierda">

          {/* 1. PARTES DEL JUICIO */}
          <div className="panel panel-info-legal">
            <div className="panel-title"><AbogadosIcon /> Partes del Juicio</div>
            <div className="info-block" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <strong>Demandante / Actor:</strong>
              <p>{caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido}` : ""}</p>
              <p className="text-muted">{caso.cliente?.domicilio_real || caso.cliente?.email || "Sin domicilio principal"}</p>
            </div>
          </div>

          {/* 1.5 DATOS DEL DEMANDADO */}
          <div className="panel panel-info-legal">
            <div className="panel-title"><AbogadosIcon /> Datos del Demandado</div>
            <div className="info-block">
              <strong>Nombre / Razón Social:</strong>
              <p>{caso.demandado_nombre || "A definir..."}</p>
            </div>
            <div className="info-block">
              <strong>{caso.demandado_tipo === "persona_juridica" ? "CUIT:" : "DNI:"}</strong>
              <p>{caso.demandado_dni_cuit || "No especificado"}</p>
            </div>
            <div className="info-block" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <strong>Domicilio Denunciado:</strong>
              <p>{caso.demandado_domicilio || "Sin domicilio notificado"}</p>
            </div>
          </div>

          {/* 2. RELACION DE LOS HECHOS */}
          <div className="panel panel-info-legal">
            <div className="panel-title"><DocumentosIcon /> Relacion de los Hechos</div>
            <div className="info-block">
              <strong>Objeto del Juicio:</strong>
              <p>{caso.objeto_del_juicio || "No especificado"}</p>
            </div>
            <div className="info-block">
              <strong>Monto Reclamado:</strong>
              <p>{caso.monto_reclamado ? formatMoney(caso.monto_reclamado) : "No especificado"}</p>
            </div>
          </div>

          {/* 3. DOCUMENTOS — Memoizado */}
          <DocumentosPanel
            documentos={documentos}
            docPage={docPage}
            setDocPage={setDocPage}
            docSearch={docSearch}
            setDocSearch={setDocSearch}
            docSearchResults={docSearchResults}
            onSearch={handleDocSearch}
            onVerDoc={handleVerDocumento}
            onDescargarDoc={handleDescargarDocumento}
            onOCR={handleOCR}
            ocrLoading={ocrLoading}
            onUpload={() => setShowUploadModal(true)}
            getFileIcon={getFileIcon}
          />

          {/* 4. AGENDA */}
          <div className="panel panel-agenda">
            <div className="panel-title"><EventIcon /> Agenda</div>
            {eventos_proximos && eventos_proximos.length > 0 ? (
              <div className="venc-list">
                {eventos_proximos.slice(0, 3).map((ev) => (
                  <div key={ev.id_evento} className="venc-item venc-normal">
                    <span className="venc-titulo">{ev.titulo}</span>
                    <span className="venc-fecha">
                      {formatFechaCorta(ev.fecha_inicio)}
                      {ev.hora_inicio ? ` ${ev.hora_inicio.slice(0, 5)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-empty">Sin eventos</div>
            )}
          </div>

          {/* 5. VENCIMIENTOS */}
          <div className="panel panel-venc">
            <div className="panel-title"><CalendarIcon /> Vencimientos</div>
            {vencimientos_proximos && vencimientos_proximos.length > 0 ? (
              <div className="venc-list">
                {vencimientos_proximos.slice(0, 3).map((v) => (
                  <div key={v.id_vencimiento} className={`venc-item venc-${v.prioridad || "normal"}`}>
                    <span className="venc-titulo">{v.titulo}</span>
                    <span className="venc-fecha">{formatFechaCorta(v.fecha_limite)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-empty">Sin vencimientos</div>
            )}
          </div>

          {/* 6. FINANZAS — Memoizado */}
          <FinanzasPanel
            resumenFinanciero={resumen_financiero}
            mostrarTodasCuotas={mostrarTodasCuotas}
            setMostrarTodasCuotas={setMostrarTodasCuotas}
            onCobrarCuota={handleCobrarCuota}
            formatMoney={formatMoney}
          />

          {/* 7. TAREAS DEL CASO */}
          <div className="panel panel-tareas-caso">
            <div className="panel-title"><CalendarIcon /> Tareas del Caso</div>
            <div className="tarea-caso-form">
              <input
                type="text"
                className="tarea-caso-input"
                placeholder="Nueva tarea para este caso..."
                value={nuevaTarea}
                onChange={(e) => setNuevaTarea(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCrearTareaCaso()}
              />
              <button className="tarea-caso-btn" onClick={handleCrearTareaCaso} disabled={creandoTarea || !nuevaTarea.trim()}>+</button>
            </div>
            {tareas_caso && tareas_caso.length > 0 ? (
              <div className="tareas-caso-list">
                {tareas_caso.map((t) => (
                  <div key={t.id_tarea} className={`tarea-caso-item ${t.completada ? "tarea-done" : ""}`}>
                    <button
                      className={`tarea-check ${t.completada ? "checked" : ""}`}
                      onClick={() => handleCompletarTarea(t.id_tarea, t.completada)}
                    >
                      {t.completada ? "✓" : ""}
                    </button>
                    <div className="tarea-caso-info">
                      <span className="tarea-caso-titulo">{t.titulo}</span>
                      {t.fecha_limite && (
                        <span className={`tarea-caso-fecha ${new Date(t.fecha_limite) < new Date() && !t.completada ? "tarea-vencida" : ""}`}>
                          {formatFechaCorta(t.fecha_limite)}
                        </span>
                      )}
                    </div>
                    {t.prioridad === "urgente" && <span className="tarea-prioridad-badge">!</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-empty">Sin tareas asignadas a este caso</div>
            )}
          </div>

        </div>

        {/* Columna derecha: Historial — Memoizado */}
        <div className="col-derecha">
          <HistorialPanel
            historial={historial}
            filtroTimeline={filtroTimeline}
            setFiltroTimeline={setFiltroTimeline}
            paginaHistorial={paginaHistorial}
            setPaginaHistorial={setPaginaHistorial}
            notaTexto={notaTexto}
            setNotaTexto={setNotaTexto}
            notaImportante={notaImportante}
            setNotaImportante={setNotaImportante}
            guardandoNota={guardandoNota}
            onGuardarNota={handleGuardarNota}
          />
        </div>
      </div>

      {/* Modals */}
      {showEditModal && <CasoForm caso={caso} onClose={(reload) => { setShowEditModal(false); if (reload) cargarData(); }} showToast={showToast} />}
      {showDemandadoModal && <EditarDemandadoModal caso={caso} onClose={() => setShowDemandadoModal(false)} onGuardado={cargarData} showToast={showToast} />}
      {showUploadModal && <DocumentoUpload idCasoPredefinido={caso.id_caso} onClose={(reload) => { setShowUploadModal(false); if (reload) cargarData(); }} showToast={showToast} />}
      {showEtapaModal && <EditarEtapaModal idCaso={id} casoData={caso} onClose={(reload) => { setShowEtapaModal(false); if (reload) cargarData(); }} showToast={showToast} />}

      <DeleteModal isOpen={showDeleteModal}
        title={deleteConfig.type === "DELETE_CASE" ? "Eliminar Caso?" : deleteConfig.type === "CLOSE_CASE" ? "Cerrar Caso?" : deleteConfig.type === "COBRAR_CUOTA" ? "Confirmar Cobro" : "Reabrir Caso?"}
        message={deleteConfig.type === "DELETE_CASE" ? "Esto eliminara el caso y sus archivos asociados." : deleteConfig.type === "CLOSE_CASE" ? "El caso se cerrara y archivara." : deleteConfig.type === "COBRAR_CUOTA" ? `Se marcara la cuota ${deleteConfig.numeroCuota || ""} como cobrada. Esta accion se reflejara en Finanzas.` : "El caso sera reabierto y volvera a estar activo."}
        confirmLabel={deleteConfig.type === "DELETE_CASE" ? "Eliminar" : deleteConfig.type === "CLOSE_CASE" ? "Cerrar" : deleteConfig.type === "COBRAR_CUOTA" ? "Confirmar Cobro" : "Reabrir"}
        confirmVariant={deleteConfig.type === "DELETE_CASE" ? "danger" : deleteConfig.type === "CLOSE_CASE" ? "warning" : "success"}
        onCancel={() => setShowDeleteModal(false)} onConfirm={handleConfirmAction} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CasoDetail;
