import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import CasoForm from "./CasoForm";
import Toast from "../../components/common/Toast";
import GlassTable from "../../components/common/GlassTable";
import "./CasosList.css";
import {
  AddIcon,
  EyeIcon,
  PencilIcon,
  TrashICon,
} from "../../components/common/Icons";
import DeleteModal from "../../components/common/DeleteModal";

const CasosList = () => {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [editingCaso, setEditingCaso] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarCasos();
  }, [pagination.page, searchTerm, estadoFiltro]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarCasos = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };
      if (estadoFiltro !== "todos") params.estado = estadoFiltro;

      const response = await api.get("/casos", { params });
      setCasos(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (err) {
      setError("Error al cargar los casos");
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

  const handleNuevoCaso = () => {
    setEditingCaso(null);
    setShowModal(true);
  };

  const handleEditarCaso = (caso) => {
    setEditingCaso(caso);
    setShowModal(true);
  };

  const handleEliminarCaso = (id) => {
    setIdToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/casos/${idToDelete}`);
      cargarCasos();
      showToast("Caso eliminado exitosamente", "warning");
    } catch (err) {
      showToast("Error al eliminar", "error");
    } finally {
      setShowDeleteModal(false);
      setIdToDelete(null);
    }
  };

  const handleCloseModal = (reload = false) => {
    setShowModal(false);
    setEditingCaso(null);
    if (reload) cargarCasos();
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
      abierto: { text: "Abierto", color: "#10b981" },
      cerrado: { text: "Cerrado", color: "#6b7280" },
    };
    return badges[estado] || { text: estado, color: "#6b7280" };
  };

  const columnas = [
    "ID",
    "Cliente",
    "Descripción",
    "Estado",
    "Abogado",
    "Fecha Inicio",
    "Acciones",
  ];

  return (
    <div className="casos-container">
      <div className="casos-header">
        <div>
          <h1>Gestión de Casos</h1>
          <p>Administrá los casos legales del estudio</p>
        </div>
        <button className="btn-nuevo" onClick={handleNuevoCaso}>
          <AddIcon /> Nuevo Caso
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por cliente, descripción o abogado..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="estado-filters">
          <button
            className={`filter-btn ${estadoFiltro === "todos" ? "active" : ""}`}
            onClick={() => handleEstadoFilter("todos")}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${
              estadoFiltro === "abierto" ? "active" : ""
            }`}
            onClick={() => handleEstadoFilter("abierto")}
          >
            Abiertos
          </button>
          <button
            className={`filter-btn ${
              estadoFiltro === "cerrado" ? "active" : ""
            }`}
            onClick={() => handleEstadoFilter("cerrado")}
          >
            Cerrados
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <GlassTable columns={columnas} loading={loading}>
        {casos.length === 0 ? (
          <tr>
            <td colSpan={columnas.length} className="empty-state">
              No se encontraron casos
            </td>
          </tr>
        ) : (
          casos.map((caso) => {
            const badge = getEstadoBadge(caso.estado);
            return (
              <tr key={caso.id_caso}>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>
                  {caso.id_caso}
                </td>
                <td className="cliente-cell">
                  {caso.cliente ? (
                    <Link to={`/dashboard/clientes/${caso.cliente.id_cliente}`}>
                      {caso.cliente.nombre} {caso.cliente.apellido}
                    </Link>
                  ) : (
                    "No disponible"
                  )}
                </td>
                <td className="descripcion-cell">
                  {caso.descripcion?.substring(0, 45)}...
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
                  {caso.abogado ? (
                    `${caso.abogado.nombre} ${caso.abogado.apellido}`
                  ) : (
                    <span className="sin-asignar">Sin asignar</span>
                  )}
                </td>
                <td>{formatearFecha(caso.fecha_inicio)}</td>
                <td className="actions-cell">
                  <div className="actions-wrapper">
                    <Link
                      to={`/dashboard/casos/${caso.id_caso}`}
                      className="btn-action btn-view"
                      title="Ver"
                    >
                      <EyeIcon />
                    </Link>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEditarCaso(caso)}
                      title="Editar"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleEliminarCaso(caso.id_caso)}
                      title="Eliminar"
                    >
                      <TrashICon />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </GlassTable>

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
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`btn-page-number ${
                  pagination.page === i + 1 ? "active" : ""
                }`}
              >
                {i + 1}
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

      {/* MODALES Y TOAST AL FINAL */}
      {showModal && (
        <CasoForm
          caso={editingCaso}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          title="¿Eliminar caso?"
          message="Esta acción no se puede deshacer y eliminará todos los datos asociados."
          confirmLabel={"Eliminar Caso"}
          confirmVariant={"danger"}
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

export default CasosList;
