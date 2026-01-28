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

  return (
    <div className="detail-container">
      <div className="detail-header">
        <div>
          <BackButton to="/dashboard/clientes" />
          <h1>
            {cliente.nombre} {cliente.apellido}
          </h1>
          <p>Expediente Digital Individual · ID #{cliente.id_cliente}</p>
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
        {/* CARD DATOS DEL CLIENTE - Verificá que esté este bloque */}
        <div className="detail-card">
          <div className="card-header">
            <h2>Datos del Cliente</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{cliente.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Teléfono</span>
              <span className="info-value">{cliente.telefono || "-"}</span>
            </div>
          </div>
        </div>

        {/* CARD CONSULTAS - Corregida con 'mensaje' y 'fecha_envio' */}
        <div className="detail-card">
          <div className="card-header">
            <h2>Consultas ({cliente.consultas?.length || 0})</h2>
            <button
              className="btn-small btn-primary"
              onClick={() => setShowConsultaModal(true)}
            >
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
                    <span className="item-date">
                      {formatearFecha(consulta.fecha_envio)}
                    </span>
                    <span className="item-status">{consulta.estado}</span>
                  </div>
                  <div className="item-main-content">
                    <p className="preview-text">
                      {consulta.mensaje || "Sin mensaje"}
                    </p>
                  </div>
                  <div className="item-arrow">
                    <RightIcon />
                  </div>
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
            <button
              className="btn-small btn-primary"
              onClick={() => setShowCasoModal(true)}
            >
              <AddIcon /> Iniciar Caso
            </button>
          </div>
          <div className="card-body">
            {cliente.casos && cliente.casos.length > 0 ? (
              cliente.casos.map((caso) => (
                <div key={caso.id_caso} className="list-item clickable-item">
                  <div className="item-sidebar">
                    <span className="item-id">Caso #{caso.id_caso}</span>
                    <span className="item-status">{caso.estado}</span>
                  </div>
                  <div className="item-main-content">
                    <p>{caso.descripcion}</p>
                  </div>
                  <button
                    className="btn-delete-small"
                    onClick={() => triggerCerrarCaso(caso.id_caso)}
                    title="Eliminar Caso"
                  >
                    <TrashICon />
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-state-small">
                No hay casos iniciados para este cliente.
              </p>
            )}
          </div>
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
