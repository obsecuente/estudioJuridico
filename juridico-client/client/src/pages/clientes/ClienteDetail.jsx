import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import ClienteForm from "./ClienteForm";
import ConsultaForm from "../consultas/ConsultaForm";
import CasoForm from "../casos/CasoForm";
import Toast from "../../components/common/Toast";
import BackButton from "../../components/common/BackButton";
import DeleteModal from "../../components/common/DeleteModal.jsx";
import "./ClienteDetail.css";
import {
  AddIcon,
  PencilIcon,
  TrashICon,
  RightIcon,
} from "../../components/common/Icons";

const ClienteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  // ESTADOS PARA MODALES
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [showCasoModal, setShowCasoModal] = useState(false);

  // ESTADOS PARA EL DELETE MODAL GENÉRICO
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({ type: null, id: null });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarCliente();
  }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarCliente = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clientes/${id}`);
      setCliente(response.data.data);
    } catch (err) {
      navigate("/dashboard/clientes");
    } finally {
      setLoading(false);
    }
  };

  // 1. Prepara la eliminación del CLIENTE
  const triggerDeleteCliente = () => {
    setDeleteConfig({ type: "CLIENTE", id: id });
    setShowDeleteModal(true);
  };

  // 2. Prepara el cierre de un CASO (usando el mismo modal)
  const triggerCerrarCaso = (casoId) => {
    setDeleteConfig({ type: "CASO", id: casoId });
    setShowDeleteModal(true);
  };

  // 3. Función única que confirma según el tipo
  const handleConfirmAction = async () => {
    try {
      if (deleteConfig.type === "CLIENTE") {
        await api.delete(`/clientes/${deleteConfig.id}`);
        showToast("Cliente eliminado correctamente", "warning");
        setTimeout(() => navigate("/dashboard/clientes"), 1500);
      } else if (deleteConfig.type === "CASO") {
        // Suponiendo que tu API tiene un endpoint para cerrar o podés usar delete
        await api.delete(`/casos/${deleteConfig.id}`);
        showToast("Caso cerrado y archivado", "success");
        cargarCliente(); // Recargamos para ver los cambios
      }
    } catch (err) {
      showToast("Error al procesar la solicitud", "error");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const formatearFecha = (f) =>
    f ? new Date(f).toLocaleDateString("es-AR") : "-";

  if (loading) return <div className="detail-container">Cargando...</div>;
  if (!cliente)
    return <div className="detail-container">Cliente no encontrado</div>;

  const calcularPorcentaje = (c) => {
    if (!c) return 0;
    const campos = c.tipo_persona === "juridica"
      ? ["cuit", "razon_social", "domicilio_sede", "email", "telefono"]
      : ["dni", "domicilio_real", "estado_civil", "profesion", "email", "telefono"];
    const completados = campos.filter(k => !!c[k]).length;
    return Math.round((completados / campos.length) * 100);
  };

  const porcentajePerfil = calcularPorcentaje(cliente);

  return (
    <div className="detail-container">
      <div className="detail-header">
        <div>
          <BackButton to="/dashboard/clientes" text="Volver a clientes" onClick={() => navigate(-1)} />
          <h1 style={{ marginTop: "10px" }}>
            {cliente.nombre} {cliente.apellido}
          </h1>
          <p>Expediente Digital Individual · ID #{cliente.id_cliente}</p>

          {/* Completitud del Perfil Destacada */}
          <div className="perfil-progreso-container" style={{
            marginTop: 20,
            maxWidth: 400,
            background: "#0f172a",
            border: `1px solid ${porcentajePerfil === 100 ? "#34d399" : "#d4af37"}`,
            borderRadius: "10px",
            padding: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#f8fafc", marginBottom: 8, fontWeight: 600 }}>
              <span>Completitud del perfil</span>
              <span style={{ color: porcentajePerfil === 100 ? "#34d399" : "#d4af37" }}>{porcentajePerfil}%</span>
            </div>
            <div style={{ width: "100%", height: 8, backgroundColor: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${porcentajePerfil}%`, height: "100%", backgroundColor: porcentajePerfil === 100 ? "#34d399" : "#d4af37", transition: "width 0.5s ease" }}></div>
            </div>
            {porcentajePerfil < 100 ? (
              <p style={{ fontSize: 12, color: "#d4af37", marginTop: 10, marginBottom: 0 }}>
                ⚠️ Faltan datos clave para iniciar trámites o expedientes.
              </p>
            ) : (
              <p style={{ fontSize: 12, color: "#34d399", marginTop: 10, marginBottom: 0 }}>
                ✓ Perfil completo y listo para operar.
              </p>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-action-header btn-edit"
            onClick={() => setShowEditModal(true)}
          >
            <PencilIcon /> Editar Perfil
          </button>
          <button
            className="btn-action-header btn-delete"
            onClick={triggerDeleteCliente}
          >
            <TrashICon /> Eliminar Cliente
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* CARD DATOS DEL CLIENTE */}
        <div className="detail-card">
          <div className="card-header">
            <h2>Datos del Cliente</h2>
          </div>

          <div className="card-body" style={{ padding: "0" }}>

            {/* SECCION 1: INFORMACION PRINCIPAL */}
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: "12px", color: "#d4af37", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Información Principal</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="info-row">
                  <span className="info-label">Tipo de Persona</span>
                  <span className="info-value" style={{ textTransform: "capitalize" }}>{cliente.tipo_persona?.replace("_", " ") || "Fisica"}</span>
                </div>
                {cliente.tipo_persona === "juridica" ? (
                  <>
                    <div className="info-row">
                      <span className="info-label">Razón Social</span>
                      <span className="info-value">{cliente.razon_social || "-"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">CUIT</span>
                      <span className="info-value">{cliente.cuit || "-"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="info-row">
                      <span className="info-label">DNI</span>
                      <span className="info-value">{cliente.dni || "-"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Estado Civil</span>
                      <span className="info-value" style={{ textTransform: "capitalize" }}>{cliente.estado_civil || "-"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Profesión</span>
                      <span className="info-value">{cliente.profesion || "-"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* SECCION 2: CONTACTO */}
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: "12px", color: "#d4af37", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Contacto</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="info-row">
                  <span className="info-label">Email Principal</span>
                  <span className="info-value">
                    {cliente.email ? (
                      <a href={`mailto:${cliente.email}`} style={{ color: "#34d399", textDecoration: "none" }}>{cliente.email}</a>
                    ) : "-"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Teléfono Principal</span>
                  <span className="info-value">
                    {cliente.telefono ? (
                      <a href={`tel:${cliente.telefono}`} style={{ color: "#34d399", textDecoration: "none" }}>{cliente.telefono}</a>
                    ) : "-"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Contacto Alternativo</span>
                  <span className="info-value">{cliente.contacto_alternativo_nombre || "-"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Teléfono Alternativo</span>
                  <span className="info-value">
                    {cliente.contacto_alternativo_telefono ? (
                      <a href={`tel:${cliente.contacto_alternativo_telefono}`} style={{ color: "#34d399", textDecoration: "none" }}>{cliente.contacto_alternativo_telefono}</a>
                    ) : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* SECCION 3: DOMICILIO */}
            <div style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "12px", color: "#d4af37", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Domicilio y Ubicación</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="info-row" style={{ gridColumn: "span 2" }}>
                  <span className="info-label">{cliente.tipo_persona === "juridica" ? "Domicilio Sede" : "Domicilio Real"}</span>
                  <span className="info-value">
                    {cliente.tipo_persona === "juridica" ? (cliente.domicilio_sede || "-") : (cliente.domicilio_real || "-")}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Localidad</span>
                  <span className="info-value">{cliente.localidad || "-"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Provincia</span>
                  <span className="info-value">{cliente.provincia || "-"}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CARD CONSULTAS */}
        <div className="detail-card">
          <div className="card-header">
            <h2>Consultas ({cliente.consultas?.length || 0})</h2>
            <button className="btn-small btn-primary" onClick={() => setShowConsultaModal(true)}>
              <AddIcon /> Nueva
            </button>
          </div>
          <div className="card-body">
            {cliente.consultas && cliente.consultas.length > 0 ? (
              cliente.consultas.map((consulta) => (
                <Link
                  key={consulta.id_consulta}
                  to={`/dashboard/consultas/${consulta.id_consulta}`}
                  className="list-item clickable-item"
                  style={{ borderLeftColor: "#d4af37", textDecoration: "none" }}
                >
                  <div className="item-sidebar">
                    <span className="item-id">ID #{consulta.id_consulta}</span>
                    <span className="item-date">{formatearFecha(consulta.fecha_envio)}</span>
                    <span className="item-status">{consulta.estado}</span>
                  </div>
                  <div className="item-main-content">
                    <p className="preview-text">{consulta.mensaje || "Sin mensaje"}</p>
                  </div>
                  <div className="item-arrow"><RightIcon /></div>
                </Link>
              ))
            ) : (
              <p className="empty-state-small">No hay consultas registradas.</p>
            )}
          </div>
        </div>

        {/* CARD CASOS (Ocupa todo el ancho abajo) */}
        <div className="detail-card" style={{ gridColumn: "span 2" }}>
          <div className="card-header">
            <h2>Expedientes y Casos Legales ({cliente.casos?.length || 0})</h2>
            <button className="btn-small btn-primary" onClick={() => setShowCasoModal(true)}>
              <AddIcon /> Iniciar Caso
            </button>
          </div>
          <div className="card-body">
            {cliente.casos && cliente.casos.length > 0 ? (
              cliente.casos.map((caso) => (
                <Link
                  key={caso.id_caso}
                  to={`/dashboard/casos/${caso.id_caso}`}
                  className="list-item clickable-item"
                  style={{ textDecoration: "none" }}
                >
                  <div className="item-sidebar">
                    <span className="item-id">Caso #{caso.id_caso}</span>
                    <span className="item-status">{caso.estado}</span>
                  </div>
                  <div className="item-main-content">
                    <p style={{ fontWeight: 600, color: "#fff", marginBottom: 4, fontSize: 14 }}>VS: {caso.demandado_nombre || "A definir"}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{caso.descripcion}</p>
                  </div>
                  <div className="item-arrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      className="btn-delete-small"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerCerrarCaso(caso.id_caso); }}
                      title="Eliminar Caso"
                    >
                      <TrashICon />
                    </button>
                    <RightIcon />
                  </div>
                </Link>
              ))
            ) : (
              <p className="empty-state-small">No hay casos iniciados para este cliente.</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat total cobrado al final */}
      <div className="cliente-stat-bar">
        <div className="cliente-stat">
          <span className="cliente-stat-label">Total Cobrado del Cliente</span>
          <span className="cliente-stat-value">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(cliente.total_cobrado || 0)}
          </span>
        </div>
        <div className="cliente-stat">
          <span className="cliente-stat-label">Casos Totales</span>
          <span className="cliente-stat-value">{cliente.casos?.length || 0}</span>
        </div>
        <div className="cliente-stat">
          <span className="cliente-stat-label">Consultas</span>
          <span className="cliente-stat-value">{cliente.consultas?.length || 0}</span>
        </div>
      </div>

      {/* --- RENDER DE MODALES --- */}

      {showEditModal && (
        <ClienteForm
          cliente={cliente}
          onClose={(reload) => {
            setShowEditModal(false);
            if (reload) cargarCliente();
          }}
          showToast={showToast}
        />
      )}

      {showConsultaModal && (
        <ConsultaForm
          clienteId={id}
          onClose={(reload) => {
            setShowConsultaModal(false);
            if (reload) cargarCliente();
          }}
          showToast={showToast}
        />
      )}

      {showCasoModal && (
        <CasoForm
          clienteId={id}
          onClose={(reload) => {
            setShowCasoModal(false);
            if (reload) cargarCliente();
          }}
          showToast={showToast}
        />
      )}

      {/* MODAL DE ELIMINACIÓN PREMIUM */}
      <DeleteModal
        isOpen={showDeleteModal}
        onConfirm={handleConfirmAction}
        onCancel={() => setShowDeleteModal(false)}
        title={
          deleteConfig.type === "CLIENTE"
            ? "¿Eliminar Cliente?"
            : "¿Cerrar Expediente?"
        }
        message={
          deleteConfig.type === "CLIENTE"
            ? `Se borrará permanentemente a ${cliente.nombre} y todos sus datos.`
            : "Esta acción archivará el caso seleccionado. ¿Confirmar?"
        }
        confirmLabel={
          deleteConfig.type === "CLIENTE"
            ? "Eliminar Cliente"
            : "Cerrar Expediente"
        }
        confirmVariant={deleteConfig.type === "CLIENTE" ? "danger" : "warning"}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ClienteDetail;
