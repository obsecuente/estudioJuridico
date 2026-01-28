import { useState, useEffect } from "react";
import vencimientosService from "../../services/vencimientos.service";
import Toast from "../../components/common/Toast";
import {
  AddIcon,
  AlarmIcon,
  PencilIcon,
  TrashICon,
  EyeIcon,
  GreenState,
  YellowState,
  
} from "../../components/common/Icons";
import VencimientoForm from "./VencimientoForm";
import "./VencimientosList.css";

// Icono rojo simple para urgencia alta
const RedState = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 32 32"
    >
      <circle cx="16" cy="16" r="14" fill="#FF5252" />
    </svg>
  );

const VencimientosList = () => {
  const [vencimientos, setVencimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("PENDIENTE");
  
  const [showModal, setShowModal] = useState(false);
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

  const eliminarVencimiento = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este vencimiento?")) return;

    try {
      await vencimientosService.delete(id);
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
  const getSemaforo = (fechaVencimiento, estado) => {
    if (estado === "CUMPLIDO") return <GreenState />;
    
    const hoy = new Date();
    const venc = new Date(fechaVencimiento);
    const diffTime = venc - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 3) return <RedState />; // Menos de 3 días o vencido
    if (diffDays < 7) return <YellowState />; // Menos de una semana
    return <GreenState />; // Más de una semana
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <AlarmIcon />
          <h2>Vencimientos</h2>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
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

      {loading ? (
        <div className="loading-spinner">Cargando vencimientos...</div>
      ) : vencimientos.length === 0 ? (
        <div className="empty-state">
          <p>No hay vencimientos con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}></th>
                <th>Fecha Venc.</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Casos/Cliente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vencimientos.map((venc) => (
                <tr key={venc.id_vencimiento}>
                  <td title="Prioridad/Urgencia">
                    {getSemaforo(venc.fecha_vencimiento, venc.estado)}
                  </td>
                  <td className={new Date(venc.fecha_vencimiento) < new Date() && venc.estado !== 'CUMPLIDO' ? 'text-danger fw-bold' : ''}>
                    {new Date(venc.fecha_vencimiento).toLocaleDateString()}
                    <br/>
                    <small>{new Date(venc.fecha_vencimiento).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                  </td>
                  <td>{venc.titulo}</td>
                  <td>{venc.tipo_vencimiento}</td>
                  <td>
                    {venc.caso ? `Caso: ${venc.caso.caratula}` : venc.cliente ? `Cliente: ${venc.cliente.nombre} ${venc.cliente.apellido}` : '-'}
                  </td>
                  <td>
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
                    {venc.estado !== "CUMPLIDO" && (
                        <button 
                            className="btn-icon text-success" 
                            title="Marcar Cumplido"
                            onClick={() => marcarComoCumplido(venc.id_vencimiento)}
                        >
                            ✓
                        </button>
                    )}
                     <button
                      className="btn-icon"
                      title="Editar"
                      onClick={() => handleEdit(venc)}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      className="btn-icon"
                      title="Ver detalle"
                      onClick={() => handleEdit(venc)} // Reusamos el form para ver detalle/editar
                    >
                      <EyeIcon />
                    </button>
                    <button
                      className="btn-icon delete"
                      title="Eliminar"
                      onClick={() => eliminarVencimiento(venc.id_vencimiento)}
                    >
                      <TrashICon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
};

export default VencimientosList;
