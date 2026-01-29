import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import eventosService from "../../services/eventos.service";
import Toast from "../../components/common/Toast";
import GlassTable from "../../components/common/GlassTable";
import CustomSelect from "../../components/common/CustomSelect";
import {
  AddIcon,
  EventIcon,
  PencilIcon,
  TrashICon,
} from "../../components/common/Icons";
import DeleteModal from "../../components/common/DeleteModal";
import EventoForm from "./EventoForm";
// ... existing imports ...

const EventosList = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAño, setFiltroAño] = useState(new Date().getFullYear());
  const [filtroTipo, setFiltroTipo] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [selectedEvento, setSelectedEvento] = useState(null);

  useEffect(() => {
    cargarEventos();
  }, [filtroMes, filtroAño, filtroTipo]);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      // Por defecto traemos del mes seleccionado
      const data = await eventosService.getAll({
        month: filtroMes === 0 ? null : filtroMes,
        year: filtroAño,
        tipo: filtroTipo || null,
      });
      // Ajustar según lo que devuelva el backend, asumo data.data o data array
      setEventos(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      setToast({
        message: "Error al cargar los eventos",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarEvento = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await eventosService.delete(idToDelete);
      setToast({
        message: "Evento eliminado correctamente",
        type: "success",
      });
      cargarEventos();
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      setToast({
        message: "Error al eliminar el evento",
        type: "error",
      });
    } finally {
        setShowDeleteModal(false);
        setIdToDelete(null);
    }
  };



  const handleCreate = () => {
    setSelectedEvento(null);
    setShowModal(true);
  };

  const handleEdit = (evento) => {
    setSelectedEvento(evento);
    setShowModal(true);
  };

  const handleCloseModal = (reload) => {
    setShowModal(false);
    setSelectedEvento(null);
    if (reload) {
        cargarEventos();
    }
  };

  const showToast = (message, type = 'success') => {
      setToast({ message, type });
  }

  const meses = [
    { value: 0, label: "Todos los meses" },
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-title">
          <EventIcon />
          <h2>Eventos y Agenda</h2>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <AddIcon /> Nuevo Evento
        </button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <CustomSelect
            options={meses}
            value={filtroMes}
            onChange={setFiltroMes}
            className="filter-date-select"
          />
          <CustomSelect
            options={[2024, 2025, 2026, 2027].map(a => ({ value: a, label: String(a) }))}
            value={filtroAño}
            onChange={setFiltroAño}
            className="filter-year-select"
          />
          <CustomSelect
            options={[
              { value: "", label: "Todos los tipos" },
              { value: "audiencia", label: "Audiencia" },
              { value: "reunion", label: "Reunión" },
              { value: "tarea", label: "Tarea" },
              { value: "vencimiento", label: "Vencimiento" },
              { value: "otro", label: "Otro" }
            ]}
            value={filtroTipo}
            onChange={setFiltroTipo}
            className="filter-type-select"
          />
        </div>
      </div>

      <GlassTable
        columns={[
          "Fecha",
          "Hora",
          "Título",
          "Caso",
          "Cliente",
          "Tipo",
          "Estado",
          "Acciones"
        ]}
        loading={loading}
      >
        {eventos.map((evento) => (
          <tr key={evento.id_evento}>
            <td className="text-center" style={{ fontWeight: 600 }}>{new Date(evento.fecha_inicio).toLocaleDateString()}</td>
            <td>
              {evento.hora_inicio ? evento.hora_inicio.substring(0, 5) : "-"}
            </td>
            <td title={evento.titulo}>
              {evento.titulo?.length > 30 ? `${evento.titulo.substring(0, 30)}...` : evento.titulo}
            </td>
            <td title={evento.caso ? evento.caso.descripcion : ""}>
              {evento.caso 
                ? (() => {
                    const desc = evento.caso.descripcion?.replace(/\n/g, " ") || "";
                    return desc.length > 40 ? `${desc.substring(0, 40)}...` : desc;
                  })()
                : "-"}
            </td>
            <td>
              {evento.cliente ? (
                <Link to={`/dashboard/clientes/${evento.cliente.id_cliente}`}>
                  {evento.cliente.nombre} {evento.cliente.apellido}
                </Link>
              ) : (
                "-"
              )}
            </td>
            <td>
              <span className="badge badge-info">{evento.tipo}</span>
            </td>
            <td>
              <span
                className={`badge ${
                  evento.estado === "REALIZADO"
                    ? "badge-success"
                    : "badge-warning"
                }`}
              >
                {evento.estado}
              </span>
            </td>
            <td className="actions-cell">
              <div className="actions-wrapper">
                <button
                  className="btn-action btn-edit"
                  title="Editar"
                  onClick={() => handleEdit(evento)}
                >
                  <PencilIcon />
                </button>
                <button
                  className="btn-action btn-delete"
                  title="Eliminar"
                  onClick={() => eliminarEvento(evento.id_evento)}
                >
                  <TrashICon />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </GlassTable>

      {showModal && (
        <EventoForm 
            evento={selectedEvento} 
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
          title="Eliminar Evento"
          message="¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer."
        />
      )}
    </div>
  );
};

export default EventosList;
