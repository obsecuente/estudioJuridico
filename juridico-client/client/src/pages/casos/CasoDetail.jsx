import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import casosService from "../../services/casos.service";
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

// Icono por tipo de evento
const iconoPorTipo = {
  NOTA_MANUAL: <PencilIcon />,
  SISTEMA_DOCUMENTO: <DocumentosIcon />,
  SISTEMA_FINANZAS: <DineroIcon />,
  SISTEMA_VENCIMIENTO: <CalendarIcon />,
  CAMBIO_ESTADO: <AbogadosIcon />,
  CAMBIO_ETAPA: <FinanzasIcon />,
};

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
  const [mostrarTodoHistorial, setMostrarTodoHistorial] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const cargarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await casosService.getDetalle360(id);
      setData(res.data);
    } catch (err) {
      console.error("Error al cargar detalle 360:", err);
      setError(err.response?.data?.error || "Error al cargar el caso");
    } finally {
      setLoading(false);
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
        cargarData();
      } else if (deleteConfig.type === "REOPEN_CASE") {
        await api.patch(`/casos/${deleteConfig.id}/estado`, { estado: "abierto" });
        showToast("Caso reabierto exitosamente", "success");
        cargarData();
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

  const handleVerDocumento = async (documento) => {
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
  };

  const handleDescargarDocumento = async (documento) => {
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
  };

  const handleGuardarNota = async () => {
    if (!notaTexto.trim()) return;
    setGuardandoNota(true);
    try {
      await casosService.postHistorial(id, notaTexto, notaImportante);
      setNotaTexto("");
      setNotaImportante(false);
      showToast("Nota guardada", "success");
      cargarData();
    } catch {
      showToast("Error al guardar la nota", "error");
    } finally {
      setGuardandoNota(false);
    }
  };

  const handleCobrarCuota = (idCuota, numeroCuota) => {
    setDeleteConfig({ type: "COBRAR_CUOTA", id: idCuota, numeroCuota });
    setShowDeleteModal(true);
  };

  const ejecutarCobrarCuota = async (idCuota) => {
    try {
      await api.patch(`/finanzas/cuotas/${idCuota}`, { fecha_pago: new Date().toISOString() });
      showToast("Cuota cobrada", "success");
      cargarData();
    } catch {
      showToast("Error al cobrar cuota", "error");
    }
  };

  const handleAsignarEtiqueta = async (idEtiqueta) => {
    try {
      await casosService.asignarEtiqueta(id, idEtiqueta);
      setShowEtiquetaDropdown(false);
      cargarData();
    } catch {
      showToast("Error al asignar etiqueta", "error");
    }
  };

  const handleQuitarEtiqueta = async (idEtiqueta) => {
    try {
      await casosService.quitarEtiqueta(id, idEtiqueta);
      cargarData();
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
      cargarData();
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

  const { caso, historial, documentos, vencimientos_proximos, eventos_proximos, resumen_financiero, etapa_legal_info } = data;
  const estadoBadge = caso.estado === "abierto" ? { text: "Abierto", cls: "badge-abierto" } : { text: "Cerrado", cls: "badge-cerrado" };

  const cuotasVisibles = mostrarTodasCuotas
    ? (resumen_financiero.cuotas_pendientes || [])
    : (resumen_financiero.cuotas_pendientes || []).slice(0, 3);
  const totalCuotas = (resumen_financiero.cuotas_pendientes || []).length;

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
            {caso.cliente?.perfil_completo && <span className="perfil-completo-chip">Perfil Completo</span>}
          </div>
          <div className="vs-logo">VS</div>
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
            <div className="info-block">
              <strong>Demandante / Actor:</strong>
              <p>{caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido}` : ""}</p>
              <p className="text-muted">{caso.cliente?.domicilio_real || caso.cliente?.email || "Sin domicilio"}</p>
            </div>
            <div className="info-block">
              <strong>Demandado:</strong>
              <p>{caso.demandado_nombre || "No establecido"}</p>
              <p className="text-muted">{caso.demandado_domicilio || "Sin domicilio notificado"}</p>
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

          {/* 3. DOCUMENTOS */}
          <div className="panel panel-docs">
            <div className="panel-title">
              <span><DocumentosIcon /> Documentos ({documentos?.length || 0})</span>
              <button className="btn-small-panel" onClick={() => setShowUploadModal(true)}><UploadIcon /> Subir</button>
            </div>
            {documentos && documentos.length > 0 ? (
              <div className="docs-list">
                {documentos.map((doc) => (
                  <div key={doc.id_documento} className="doc-item">
                    <div className="doc-info" onClick={() => handleVerDocumento(doc)}>
                      <span className="doc-icon">{getFileIcon(doc.nombre_archivo)}</span>
                      <span className="doc-name">{doc.nombre_archivo}</span>
                    </div>
                    <div className="doc-actions">
                      <button className="item-action-btn" onClick={() => handleVerDocumento(doc)} title="Ver"><EyeIcon /></button>
                      <button className="item-action-btn" onClick={() => handleDescargarDocumento(doc)} title="Descargar"><DownLoadIcon /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-empty">Sin documentos</div>
            )}
          </div>

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

          {/* 6. FINANZAS */}
          <div className="panel panel-finanzas">
            <div className="panel-title"><DineroIcon /> Finanzas</div>
            <div className="panel-kpi">
              <span className="kpi-label">Pendiente de Cobro</span>
              <span className="kpi-value kpi-pendiente">{formatMoney(resumen_financiero.total_pendiente_ars)}</span>
            </div>
            <div className="panel-kpi panel-kpi-cobrado">
              <span className="kpi-label">Cobrado del Caso</span>
              <span className="kpi-value kpi-cobrado">{formatMoney(resumen_financiero.total_cobrado_ars)}</span>
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
                    <button className="btn-cobrar" onClick={() => handleCobrarCuota(c.id_cuota, c.numero_cuota)}>Cobrar</button>
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

        </div>

        {/* Columna derecha: Historial */}
        <div className="col-derecha">
          <div className="panel panel-historial">
            <div className="panel-title"><PencilIcon /> Historial del Caso</div>

            <div className="nota-form">
              <textarea className="nota-textarea" placeholder="Anotar novedad del caso..." value={notaTexto} onChange={(e) => setNotaTexto(e.target.value)} rows={3} />
              <div className="nota-actions">
                <label className="nota-importante-check">
                  <input type="checkbox" checked={notaImportante} onChange={(e) => setNotaImportante(e.target.checked)} className="custom-check" />
                  <span className="check-label">Marcar como importante</span>
                </label>
                <button className="btn-guardar-nota" onClick={handleGuardarNota} disabled={guardandoNota || !notaTexto.trim()}>
                  {guardandoNota ? <SpinnerIcon /> : <SaveIcon />} Guardar
                </button>
              </div>
            </div>

            <div className="timeline">
              {historial && historial.length > 0 ? (
                <>
                  {(mostrarTodoHistorial ? historial : historial.slice(0, 5)).map((ev) => (
                    <div key={ev.id_historial} className={`timeline-event ${ev.es_importante ? "evento-importante" : ""}`}>
                      <div className="timeline-icon">{iconoPorTipo[ev.tipo_evento] || <PencilIcon />}</div>
                      <div className="timeline-content">
                        <p className="timeline-desc">{ev.descripcion}</p>
                        <div className="timeline-meta">
                          <span className="timeline-time">{tiempoRelativo(ev.fecha_registro)}</span>
                          {ev.usuario && <span className="timeline-user">{ev.usuario.nombre} {ev.usuario.apellido}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {historial.length > 5 && (
                    <button className="btn-ver-mas-cuotas" onClick={() => setMostrarTodoHistorial(!mostrarTodoHistorial)}>
                      {mostrarTodoHistorial ? "Ver menos" : `Ver todo el historial (${historial.length})`}
                    </button>
                  )}
                </>
              ) : (
                <div className="panel-empty">Aun no hay actividad registrada</div>
              )}
            </div>
          </div>
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
