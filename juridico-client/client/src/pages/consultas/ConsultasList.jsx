import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import ConsultaForm from "./ConsultaForm";
import Toast from "../../components/common/Toast";
import "./ConsultasList.css";

const ConsultasList = () => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todas");
  const [showModal, setShowModal] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarConsultas();
  }, [pagination.page, searchTerm, estadoFiltro]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarConsultas = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };

      // Si hay filtro de estado, agregarlo
      if (estadoFiltro !== "todas") {
        params.estado = estadoFiltro;
      }

      const response = await api.get("/consultas", { params });

      setConsultas(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (err) {
      console.error("Error al cargar consultas:", err);
      setError("Error al cargar las consultas");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEstadoFilter = (estado) => {
    setEstadoFiltro(estado);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleNuevaConsulta = () => {
    setEditingConsulta(null);
    setShowModal(true);
  };

  const handleEditarConsulta = (consulta) => {
    setEditingConsulta(consulta);
    setShowModal(true);
  };

  const handleEliminarConsulta = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta consulta?")) {
      return;
    }

    try {
      await api.delete(`/consultas/${id}`);
      cargarConsultas();
      showToast("Consulta eliminada exitosamente", "warning");
    } catch (err) {
      console.error("Error al eliminar consulta:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar la consulta",
        "error"
      );
    }
  };

  const handleCloseModal = (reload = false) => {
    setShowModal(false);
    setEditingConsulta(null);
    if (reload) {
      cargarConsultas();
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR");
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { text: "Pendiente", color: "#f59e0b" },
      en_progreso: { text: "En Progreso", color: "#3b82f6" },
      resuelta: { text: "Resuelta", color: "#10b981" },
    };
    return badges[estado] || { text: estado, color: "#6b7280" };
  };

  return (
    <div className="consultas-container">
      {/* Header */}
      <div className="consultas-header">
        <div>
          <h1>Gestión de Consultas</h1>
          <p>Administrá las consultas de los clientes</p>
        </div>
        <button className="btn-nuevo" onClick={handleNuevaConsulta}>
          ➕ Nueva Consulta
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Buscar por cliente o mensaje..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="estado-filters">
          <button
            className={`filter-btn ${estadoFiltro === "todas" ? "active" : ""}`}
            onClick={() => handleEstadoFilter("todas")}
          >
            Todas
          </button>
          <button
            className={`filter-btn ${
              estadoFiltro === "pendiente" ? "active" : ""
            }`}
            onClick={() => handleEstadoFilter("pendiente")}
          >
            🟡 Pendientes
          </button>
          <button
            className={`filter-btn ${
              estadoFiltro === "en_progreso" ? "active" : ""
            }`}
            onClick={() => handleEstadoFilter("en_progreso")}
          >
            🔵 En Progreso
          </button>
          <button
            className={`filter-btn ${
              estadoFiltro === "resuelta" ? "active" : ""
            }`}
            onClick={() => handleEstadoFilter("resuelta")}
          >
            🟢 Resueltas
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando consultas...</p>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div className="table-container">
            {consultas.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron consultas</p>
                {(searchTerm || estadoFiltro !== "todas") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setEstadoFiltro("todas");
                    }}
                    className="btn-clear"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <table className="consultas-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Mensaje</th>
                    <th>Estado</th>
                    <th>Abogado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {consultas.map((consulta) => {
                    const badge = getEstadoBadge(consulta.estado);
                    return (
                      <tr key={consulta.id_consulta}>
                        <td>{consulta.id_consulta}</td>
                        <td className="cliente-cell">
                          {consulta.cliente ? (
                            <Link
                              to={`/dashboard/clientes/${consulta.cliente.id_cliente}`}
                            >
                              {consulta.cliente.nombre}{" "}
                              {consulta.cliente.apellido}
                            </Link>
                          ) : (
                            "Cliente no disponible"
                          )}
                        </td>
                        <td className="mensaje-cell">
                          {consulta.mensaje?.substring(0, 50)}...
                        </td>
                        <td>
                          <span
                            className="estado-badge"
                            style={{ backgroundColor: badge.color }}
                          >
                            {badge.text}
                          </span>
                        </td>
                        <td className="abogado-cell">
                          {consulta.abogado ? (
                            `${consulta.abogado.nombre} ${consulta.abogado.apellido}`
                          ) : (
                            <span className="sin-asignar">Sin asignar</span>
                          )}
                        </td>
                        <td>{formatearFecha(consulta.fecha_envio)}</td>
                        <td className="actions-cell">
                          <Link
                            to={`/dashboard/consultas/${consulta.id_consulta}`}
                            className="btn-action btn-view"
                            title="Ver detalles"
                          >
                            👁️
                          </Link>
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEditarConsulta(consulta)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() =>
                              handleEliminarConsulta(consulta.id_consulta)
                            }
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-page"
              >
                ← Anterior
              </button>

              <div className="page-numbers">
                {[...Array(pagination.totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`btn-page-number ${
                      pagination.page === index + 1 ? "active" : ""
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-page"
              >
                Siguiente →
              </button>
            </div>
          )}

          {/* Info de paginación */}
          <div className="pagination-info">
            Mostrando {consultas.length} de {pagination.total} consultas
          </div>
        </>
      )}

      {/* Modal de formulario */}
      {showModal && (
        <ConsultaForm
          consulta={editingConsulta}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}

      {/* Toast */}
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

export default ConsultasList;
