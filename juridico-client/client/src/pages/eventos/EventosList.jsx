import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import eventosService from "../../services/eventos.service";
import Toast from "../../components/common/Toast";
import {
  AddIcon,
  EventIcon,
  PencilIcon,
  TrashICon,
  EyeIcon,
} from "../../components/common/Icons";
import EventoForm from "./EventoForm";
import "./EventosList.css";

const EventosList = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAño, setFiltroAño] = useState(new Date().getFullYear());

  const [showModal, setShowModal] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState(null);

  useEffect(() => {
    cargarEventos();
  }, [filtroMes, filtroAño]);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      // Por defecto traemos del mes seleccionado
      const data = await eventosService.getAll({
        month: filtroMes,
        year: filtroAño,
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

  const eliminarEvento = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este evento?")) return;

    try {
      await eventosService.delete(id);
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
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(parseInt(e.target.value))}
            className="form-select"
          >
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
          <select
            value={filtroAño}
            onChange={(e) => setFiltroAño(parseInt(e.target.value))}
            className="form-select"
          >
            {[2024, 2025, 2026].map((año) => (
              <option key={año} value={año}>
                {año}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Cargando eventos...</div>
      ) : eventos.length === 0 ? (
        <div className="empty-state">
          <p>No hay eventos registrados para este período.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id_evento}>
                  <td>{new Date(evento.fecha_inicio).toLocaleDateString()}</td>
                  <td>
                    {new Date(evento.fecha_inicio).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>{evento.titulo}</td>
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
                    <button
                      className="btn-icon"
                      title="Ver detalle"
                      onClick={() => alert("Implementar Ver Detalle")}
                    >
                      <EyeIcon />
                    </button>
                    <button
                      className="btn-icon"
                      title="Editar"
                      onClick={() => handleEdit(evento)}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      className="btn-icon delete"
                      title="Eliminar"
                      onClick={() => eliminarEvento(evento.id_evento)}
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
    </div>
  );
};

export default EventosList;
