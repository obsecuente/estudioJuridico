import { useState, useEffect } from "react";
import api from "../../services/api";
import ClienteForm from "./ClienteForm";
import Toast from "../../components/common/Toast";
import "./ClientesList.css";
import { Link } from "react-router-dom";

const ClientesList = () => {
  const [clientes, setClientes] = useState([]); //* guarda el array de clientes que nos trae el backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); //* guardamos lo que el usuario escribe en la busqueda
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState(null);

  // Cargar clientes
  useEffect(() => {
    cargarClientes();
  }, [pagination.page, searchTerm]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };
  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };

      const response = await api.get("/clientes", { params });

      setClientes(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      }));
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      setError("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  // Manejar búsqueda
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Abrir modal para crear
  const handleNuevoCliente = () => {
    setEditingCliente(null);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEditarCliente = (cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };

  // Eliminar cliente
  const handleEliminarCliente = async (id, nombreCompleto) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nombreCompleto}?`)) {
      return;
    }

    try {
      await api.delete(`/clientes/${id}`);
      cargarClientes();
      showToast("Cliente eliminado exitosamente", "success");
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      showToast(
        err.response?.data?.error || "Error al eliminar el cliente",
        "error"
      );
    }
  };

  // Cerrar modal y recargar
  const handleCloseModal = (reload = false) => {
    setShowModal(false);
    setEditingCliente(null);
    if (reload) {
      cargarClientes();
    }
  };

  // Cambiar página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR");
  };
  return (
    <div className="clientes-container">
      {/* Header */}
      <div className="clientes-header">
        <div>
          <h1>Gestión de Clientes</h1>
          <p>Administrá los clientes del estudio</p>
        </div>
        <button className="btn-nuevo" onClick={handleNuevoCliente}>
          ➕ Nuevo Cliente
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando clientes...</p>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div className="table-container">
            {clientes.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron clientes</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="btn-clear"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              <table className="clientes-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id_cliente}>
                      <td>{cliente.id_cliente}</td>
                      <td className="nombre-cell">
                        {cliente.nombre} {cliente.apellido}
                      </td>
                      <td>{cliente.email}</td>
                      <td>{cliente.telefono || "-"}</td>
                      <td>{formatearFecha(cliente.fecha_registro)}</td>
                      <td className="actions-cell">
                        <Link
                          to={`/dashboard/clientes/${cliente.id_cliente}`}
                          className="btn-action btn-view"
                          title="Ver detalles"
                        >
                          👁️
                        </Link>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => handleEditarCliente(cliente)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() =>
                            handleEliminarCliente(
                              cliente.id_cliente,
                              `${cliente.nombre} ${cliente.apellido}`
                            )
                          }
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
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
            Mostrando {clientes.length} de {pagination.total} clientes
          </div>
        </>
      )}

      {/* Modal de formulario */}
      {showModal && (
        <ClienteForm
          cliente={editingCliente}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}

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

export default ClientesList;
