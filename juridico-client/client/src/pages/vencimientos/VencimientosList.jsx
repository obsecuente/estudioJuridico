import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import vencimientosService from "../../services/vencimientos.service";
import DeleteModal from "../../components/common/DeleteModal";
import Toast from "../../components/common/Toast";
import GlassTable from "../../components/common/GlassTable";
import {
  AddIcon,
  AlarmIcon,
  PencilIcon,
  TrashICon,
  EyeIcon,
  GreenState,
  YellowState,
  RedState,
  CheckIcon,
} from "../../components/common/Icons";
import VencimientoForm from "./VencimientoForm";
import "./VencimientosList.css";

const VencimientosList = () => {
  const [vencimientos, setVencimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("PENDIENTE");
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [selectedVencimiento, setSelectedVencimiento] = useState(null);

  useEffect(() => {
    cargarVencimientos();
  }, [filtroEstado]);

  const cargarVencimientos = async () => {
    try {
      setLoading(true);
      const data = await vencimientosService.getAll({
        estado: filtroEstado === "TODOS" ? null : filtroEstado,
      });
      // Ajustar según estructura de respuesta{ data: [], pagination: {} } usualmente
      setVencimientos(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error al cargar vencimientos:", error);
      setToast({
        message: "Error al cargar los vencimientos",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarVencimiento = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await vencimientosService.delete(idToDelete);
      setToast({
        message: "Vencimiento eliminado correctamente",
        type: "success",
      });
      cargarVencimientos();
    } catch (error) {
      console.error("Error al eliminar vencimiento:", error);
      setToast({
        message: "Error al eliminar el vencimiento",
        type: "error",
      });
    } finally {
      setShowDeleteModal(false);
      setIdToDelete(null);
    }
  };

  const marcarComoCumplido = async (id) => {
    try {
        // Podríamos abrir un modal para notas, por ahora simple
        await vencimientosService.marcarCumplido(id, "Marcado desde listado");
        setToast({ message: "Vencimiento cumplido", type: "success" });
        cargarVencimientos();
    } catch (error) {
        console.error("Error al marcar cumplido:", error);
        setToast({ message: "Error al actualizar estado", type: "error" });
    }
  }



  const handleCreate = () => {
    setSelectedVencimiento(null);
    setShowModal(true);
  };

  const handleEdit = (vencimiento) => {
    // Si ya está cumplido quizas no se deberia editar, pero lo dejamos
    setSelectedVencimiento(vencimiento);
    setShowModal(true);
  };

  const handleCloseModal = (reload) => {
    setShowModal(false);
    setSelectedVencimiento(null);
    if (reload) {
        cargarVencimientos();
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  }

  // Lógica de semáforo simple
  const getSemaforo = (fechaLimite, estado) => {
    if (estado === "CUMPLIDO") return <GreenState />;
    
    const hoy = new Date();
    const venc = new Date(fechaLimite);
    const diffTime = venc - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 3) return <RedState />; // Menos de 3 días o vencido
    if (diffDays < 7) return <YellowState />; // Menos de una semana
    return <GreenState />; // Más de una semana
  };

  // Icono según prioridad del vencimiento
  const getPrioridadIcono = (prioridad) => {
    switch (prioridad) {
      case "alta":
        return <RedState />;
      case "media":
        return <YellowState />;
      case "baja":
        return <GreenState />;
      default:
        return <YellowState />;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <AlarmIcon />
          <h2>Vencimientos</h2>
        </div>
        <button className="btn-nuevo" onClick={handleCreate}>
          <AddIcon /> Nuevo Vencimiento
        </button>
      </div>

      <div className="filters-bar">
        <button 
            className={`filter-btn ${filtroEstado === "PENDIENTE" ? "active" : ""}`}
            onClick={() => setFiltroEstado("PENDIENTE")}
        >
            Pendientes
        </button>
        <button 
            className={`filter-btn ${filtroEstado === "CUMPLIDO" ? "active" : ""}`}
            onClick={() => setFiltroEstado("CUMPLIDO")}
        >
            Cumplidos
        </button>
        <button 
            className={`filter-btn ${filtroEstado === "TODOS" ? "active" : ""}`}
            onClick={() => setFiltroEstado("TODOS")}
        >
            Todos
        </button>
      </div>

      <GlassTable
        columns={[
          "Prioridad",
          "Fecha Venc.",
          "Título",
          "Cliente",
          "Tipo",
          "Estado",
          "Acciones"
        ]}
        loading={loading}
      >
        {vencimientos.map((venc) => (
          <tr key={venc.id_vencimiento}>
            <td className="text-center" title={`Prioridad: ${venc.prioridad}`}>
              {getPrioridadIcono(venc.prioridad)}
            </td>
            <td className="text-center" style={{ fontWeight: 600 }}>
              {new Date(venc.fecha_limite).toLocaleDateString()}
              <br/>
              <small>{venc.fecha_limite ? new Date(venc.fecha_limite).toISOString().substring(11, 16) : ''}</small>
            </td>
            <td title={venc.titulo}>
              {venc.titulo}
            </td>
            <td>
              {venc.caso && venc.caso.cliente ? (
                <Link to={`/dashboard/clientes/${venc.caso.cliente.id_cliente}`}>
                  {venc.caso.cliente.nombre} {venc.caso.cliente.apellido}
                </Link>
              ) : (
                "-"
              )}
            </td>
            <td>{venc.tipo_vencimiento}</td>
            <td className="text-center">
              <span
                className={`badge ${
                  venc.estado === "CUMPLIDO"
                    ? "badge-success"
                    : "badge-warning"
                }`}
              >
                {venc.estado}
              </span>
            </td>
            <td className="actions-cell">
              <div className="actions-wrapper">
                {venc.estado !== "CUMPLIDO" && (
                  <button 
                    className="btn-action btn-view" /* Reusing view color for check */
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22c55e' }}
                    title="Marcar Cumplido"
                    onClick={() => marcarComoCumplido(venc.id_vencimiento)}
                  >
                    <CheckIcon />
                  </button>
                )}
                <button
                  className="btn-action btn-edit"
                  title="Editar"
                  onClick={() => handleEdit(venc)}
                >
                  <PencilIcon />
                </button>
                <button
                  className="btn-action btn-delete"
                  title="Eliminar"
                  onClick={() => eliminarVencimiento(venc.id_vencimiento)}
                >
                  <TrashICon />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </GlassTable>

      {showModal && (
        <VencimientoForm 
            vencimiento={selectedVencimiento}
            onClose={handleCloseModal}
            showToast={showToast}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Eliminar Vencimiento"
          message="¿Estás seguro de que deseas eliminar este vencimiento? Esta acción no se puede deshacer."
        />
      )}
    </div>
  );
};

export default VencimientosList;
