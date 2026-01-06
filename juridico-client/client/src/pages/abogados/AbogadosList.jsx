import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import AbogadoForm from "./AbogadoForm";
import Toast from "../../components/common/Toast";
import DeleteModal from "../../components/common/DeleteModal";
import { EyeIcon, PencilIcon, TrashICon } from "../../components/common/Icons";
import { AuthContext } from "../../context/AuthContext";
import "./AbogadosList.css";
import "../../components/common/GlassTable.css"; /* glass styling shared */

const AbogadosList = () => {
  // Obtener el rol del usuario logueado
  const { user } = useContext(AuthContext);
  const isAdmin = user?.rol === "admin";

  const [abogados, setAbogados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAbogado, setEditingAbogado] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({ id: null, nombre: "" });

  // Cargar abogados
  useEffect(() => {
    // Ejecutar carga solo si el usuario es admin (por la restriccion en las rutas)
    if (isAdmin) {
      cargarAbogados();
    } else {
      setLoading(false);
      setError(
        "Acceso denegado. Solo administradores pueden gestionar abogados."
      );
    }
  }, [pagination.page, searchTerm, isAdmin]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarAbogados = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };

      const response = await api.get("/abogados", { params });

      setAbogados(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (err) {
      console.error("Error al cargar abogados:", err);
      setError("Error al cargar los abogados");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleNuevoAbogado = () => {
    setEditingAbogado(null);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEditarAbogado = (abogado) => {
    setEditingAbogado(abogado);
    setShowModal(true);
  };

  // Mostrar modal de confirmación para eliminar
  const handleOpenDelete = (id, nombre) => {
    setDeleteConfig({ id, nombre });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/abogados/${deleteConfig.id}`);
      showToast("Abogado eliminado exitosamente", "success");
      cargarAbogados();
    } catch (err) {
      console.error("Error al eliminar abogado:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar el abogado",
        "error"
      );
    } finally {
      setShowDeleteModal(false);
      setDeleteConfig({ id: null, nombre: "" });
    }
  };

  // Cerrar modal y recargar (Logica identica)
  const handleCloseModal = (reload = false) => {
    setShowModal(false);
    setEditingAbogado(null);
    if (reload) {
      cargarAbogados();
    }
  };

  // Cambiar pagina y Formatear fecha (Logica identica)
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
    <div className="abogados-container">
      {/* Header */}
      <div className="abogados-header">
        <div>
          <h1>Gestion de Abogados</h1>
          <p>Administra los profesionales del estudio</p>
        </div>
        {/* Mostrar boton solo si es Admin */}
        {isAdmin && (
          <button className="btn-nuevo" onClick={handleNuevoAbogado}>
            Nuevo Abogado
          </button>
        )}
      </div>

      {/* Barra de busqueda */}
      {isAdmin && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, email o especialidad..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      )}

      {/* Error o Acceso Denegado */}
      {error && <div className="error-message">{error}</div>}

      {/* Mostrar contenido solo si es Admin y no hay error de acceso */}
      {isAdmin &&
        !error &&
        (loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando abogados...</p>
          </div>
        ) : (
          <>
            {/* Tabla (Glass) */}
            <div className="table-wrapper-glass">
              {abogados.length === 0 ? (
                <div className="empty-state">
                  <p>No se encontraron abogados</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="btn-clear"
                    >
                      Limpiar busqueda
                    </button>
                  )}
                </div>
              ) : (
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>DNI</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Número de Telefono</th>
                      <th>Especialidad</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abogados.map((abogado) => (
                      <tr key={abogado.id_abogado}>
                        <td>{abogado.id_abogado}</td>
                        <td>{abogado.dni || "-"}</td>
                        <td className="nombre-cell">
                          {abogado.nombre} {abogado.apellido}
                        </td>
                        <td>{abogado.email}</td>
                        <td>{abogado.telefono || "-"}</td>
                        <td>{abogado.especialidad || "-"}</td>
                        <td>{abogado.rol}</td>
                        <td className="actions-cell">
                          <div className="actions-wrapper">
                            <Link
                              to={`/dashboard/abogados/${abogado.id_abogado}`}
                              className="btn-action btn-view"
                              title={`Ver ${abogado.nombre} ${abogado.apellido}`}
                              aria-label={`Ver ${abogado.nombre} ${abogado.apellido}`}
                            >
                              <EyeIcon />
                            </Link>
                            <button
                              className="btn-action btn-edit"
                              onClick={() => handleEditarAbogado(abogado)}
                              title="Editar"
                              aria-label={`Editar ${abogado.nombre} ${abogado.apellido}`}
                            >
                              <PencilIcon />
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() =>
                                handleOpenDelete(
                                  abogado.id_abogado,
                                  `${abogado.nombre} ${abogado.apellido}`
                                )
                              }
                              title="Eliminar"
                              aria-label={`Eliminar ${abogado.nombre} ${abogado.apellido}`}
                            >
                              <TrashICon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginacion */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                {/* Logica de paginacion identica */}
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-page"
                >
                  Anterior
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
                  Siguiente
                </button>
              </div>
            )}

            {/* Info de paginacion */}
            <div className="pagination-info">
              Mostrando {abogados.length} de {pagination.total} abogados
            </div>
          </>
        ))}

      {/* Modal de formulario */}
      {showModal && (
        <AbogadoForm
          abogado={editingAbogado}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}

      {/* DeleteModal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title={`¿Eliminar abogado?`}
        message={`Se eliminará a ${deleteConfig.nombre}. Esta acción no se puede deshacer.`}
        confirmLabel={"Eliminar Abogado"}
        confirmVariant={"danger"}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast de notificaciones */}
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

export default AbogadosList;
