import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import useDebounce from "../../hooks/useDebounce";

// Componentes comunes
import GlassTable from "../../components/common/GlassTable";
import StatusBadge from "../../components/common/StatusBadge";
import Toast from "../../components/common/Toast";
import DeleteModal from "../../components/common/DeleteModal";
import {
  AddIcon,
  EyeIcon,
  PencilIcon,
  TrashICon,
} from "../../components/common/Icons";

// Estilos
import "./ConsultasList.css";

// Formulario
import ConsultaForm from "./ConsultaForm";

const ConsultasList = () => {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todas");
  const [abogados, setAbogados] = useState([]);
  const [idAbogadoFiltro, setIdAbogadoFiltro] = useState("");

  // Estados para Modales
  const [showModal, setShowModal] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState(null);
  const [deleteConfig, setDeleteConfig] = useState({ show: false, id: null });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState(null);

  // Aplicar debounce al término de búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    cargarAbogados();
  }, []);

  useEffect(() => {
    cargarConsultas();
  }, [pagination.page, debouncedSearchTerm, estadoFiltro, idAbogadoFiltro]);

  const cargarAbogados = async () => {
    try {
      const response = await api.get("/abogados");
      setAbogados(response.data.data);
    } catch (err) {
      console.error("Error al cargar abogados para filtro", err);
    }
  };

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
        search: debouncedSearchTerm,
      };
      if (estadoFiltro !== "todas") params.estado = estadoFiltro;
      if (idAbogadoFiltro) params.id_abogado = idAbogadoFiltro;

      const response = await api.get("/consultas", { params });
      setConsultas(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (err) {
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

  // --- NUEVA LÓGICA DE ELIMINACIÓN ---
  const handleOpenDeleteModal = (id) => {
    setDeleteConfig({ show: true, id });
  };

  const confirmEliminar = async () => {
    try {
      await api.delete(`/consultas/${deleteConfig.id}`);
      cargarConsultas();
      showToast("Consulta eliminada exitosamente", "warning");
    } catch (err) {
      showToast("Error al eliminar la consulta", "error");
    } finally {
      setDeleteConfig({ show: false, id: null });
    }
  };

  const handleCloseModal = (reload = false) => {
    setShowModal(false);
    setEditingConsulta(null);
    if (reload === true) cargarConsultas();
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

  return (
    <div className="consultas-container">
      <div className="consultas-header">
        <div className="header-title-container">
          <h1>Gestión de Consultas</h1>
          <p>Administrá las consultas de los clientes</p>
        </div>
        {/* Este botón ahora se moverá a la derecha por el CSS */}
        <button className="btn-nuevo" onClick={handleNuevaConsulta}>
          <AddIcon /> Nueva Consulta
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Buscar por cliente o mensaje..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="estado-filters">
          <div className="filter-group">
            <span className="filter-label">Estado:</span>
            <button
                className={`filter-btn ${estadoFiltro === "todas" ? "active" : ""}`}
                onClick={() => handleEstadoFilter("todas")}
            >
                Todas
            </button>
            <button
                className={`filter-btn ${estadoFiltro === "pendiente" ? "active" : ""}`}
                onClick={() => handleEstadoFilter("pendiente")}
            >
                Pendientes
            </button>
            <button
                className={`filter-btn ${estadoFiltro === "resuelta" ? "active" : ""}`}
                onClick={() => handleEstadoFilter("resuelta")}
            >
                Resueltas
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-label">Abogado:</span>
            <select 
              value={idAbogadoFiltro} 
              onChange={(e) => {
                setIdAbogadoFiltro(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="filter-select"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#1a1f2b',
                color: 'white',
                border: '1px solid #d4af37',
                marginRight: '10px'
              }}
            >
              <option value="">Todos los abogados</option>
              {abogados.map(a => (
                <option key={a.id_abogado} value={a.id_abogado}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <GlassTable
        columns={[
          "ID",
          "Cliente",
          "Mensaje",
          "Estado",
          "Abogado",
          "Fecha",
          "Acciones",
        ]}
        loading={loading}
      >
        {consultas.map((consulta) => (
          <tr key={consulta.id_consulta}>
            <td className="text-center" style={{ fontWeight: 600 }}>
              {consulta.id_consulta}
            </td>
            <td className="cliente-cell">
              {consulta.cliente ? (
                <Link to={`/dashboard/clientes/${consulta.cliente.id_cliente}`}>
                  {consulta.cliente.nombre} {consulta.cliente.apellido}
                </Link>
              ) : (
                "No disponible"
              )}
            </td>
            <td className="mensaje-cell">
              {consulta.mensaje?.substring(0, 50)}...
            </td>
            <td className="text-center">
              <StatusBadge status={consulta.estado} />
            </td>
            <td className="abogado-cell">
              {consulta.abogado ? (
                `${consulta.abogado.nombre} ${consulta.abogado.apellido}`
              ) : (
                <span className="sin-asignar">Sin asignar</span>
              )}
            </td>
            <td>{formatearFecha(consulta.fecha_envio)}</td>
            <td>
              <div className="actions-cell">
                <Link
                  to={`/dashboard/consultas/${consulta.id_consulta}`}
                  className="btn-action btn-view"
                  title="Ver detalles"
                >
                  <EyeIcon />
                </Link>
                <button
                  className="btn-action btn-edit"
                  onClick={() => handleEditarConsulta(consulta)}
                  title="Editar"
                >
                  <PencilIcon />
                </button>
                <button
                  className="btn-action btn-delete"
                  onClick={() => handleOpenDeleteModal(consulta.id_consulta)}
                  title="Eliminar"
                >
                  <TrashICon />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </GlassTable>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn-page"
          >
            ←
          </button>
          <div className="page-numbers">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
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
            →
          </button>
        </div>
      )}

      {/* MODAL DE EDICIÓN / NUEVA */}
      {showModal && (
        <ConsultaForm
          key={
            editingConsulta
              ? `modal-edit-${editingConsulta.id_consulta}`
              : "modal-nuevo"
          }
          consulta={editingConsulta}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}

      {/* MODAL DE ELIMINACIÓN GLASS */}
      <DeleteModal
        isOpen={deleteConfig.show}
        onConfirm={confirmEliminar}
        onCancel={() => setDeleteConfig({ show: false, id: null })}
        title="¿Eliminar Consulta?"
        message="Esta acción no se puede deshacer. La consulta será eliminada permanentemente del sistema."
        confirmLabel={"Eliminar Consulta"}
        confirmVariant={"danger"}
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

export default ConsultasList;
