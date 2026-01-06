import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import SearchInput from "../../components/common/SearchInput";
import GlassTable from "../../components/common/GlassTable";
import ClienteForm from "./ClienteForm";
import DeleteModal from "../../components/common/DeleteModal.jsx"; // Importamos tu nuevo componente
import Toast from "../../components/common/Toast";
import {
  AddIcon,
  EyeIcon,
  PencilIcon,
  TrashICon,
} from "../../components/common/Icons";

import "./ClientesList.css";

const ClientesList = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para Modales
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  // Estados para Eliminación
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    show: false,
    id: null,
    nombre: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarClientes();
  }, [pagination.page, searchTerm]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const cargarClientes = async () => {
    try {
      setLoading(true);
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
      setError("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Eliminación ---
  const handleOpenDeleteModal = (id, nombreCompleto) => {
    setDeleteModalConfig({ show: true, id, nombre: nombreCompleto });
  };

  const confirmEliminar = async () => {
    try {
      await api.delete(`/clientes/${deleteModalConfig.id}`);
      cargarClientes();
      showToast("Cliente eliminado exitosamente", "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Error al eliminar", "error");
    } finally {
      setDeleteModalConfig({ show: false, id: null, nombre: "" });
    }
  };

  // ... (handleSearch, handleNuevoCliente, handleEditarCliente, handleCloseModal, handlePageChange se mantienen igual)
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };
  const handleNuevoCliente = () => {
    setEditingCliente(null);
    setShowModal(true);
  };
  const handleEditarCliente = (cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };
  const handleCloseModal = (reload = false) => {
    setShowModal(false);
    setEditingCliente(null);
    if (reload) cargarClientes();
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages)
      setPagination((prev) => ({ ...prev, page: newPage }));
  };
  const formatearFecha = (fecha) =>
    fecha ? new Date(fecha).toLocaleDateString("es-AR") : "-";

  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <div>
          <h1>Gestión de Clientes</h1>
          <p>Administrá los clientes del estudio</p>
        </div>
        <button className="btn-nuevo" onClick={handleNuevoCliente}>
          <AddIcon /> Nuevo Cliente
        </button>
      </div>

      <SearchInput
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Buscar por nombre, email o teléfono..."
      />

      <GlassTable
        columns={[
          "ID",
          "Nombre",
          "Email",
          "Teléfono",
          "Fecha Registro",
          "Acciones",
        ]}
        loading={loading}
      >
        {clientes.length === 0 && !loading ? (
          <tr>
            <td colSpan="6" className="empty-state">
              No se encontraron clientes
            </td>
          </tr>
        ) : (
          clientes.map((cliente) => (
            <tr key={cliente.id_cliente}>
              <td className="text-center" style={{ fontWeight: 600 }}>
                {cliente.id_cliente}
              </td>
              <td className="nombre-cell">
                {cliente.nombre} {cliente.apellido}
              </td>
              <td>{cliente.email}</td>
              <td>{cliente.telefono || "-"}</td>
              <td>{formatearFecha(cliente.fecha_registro)}</td>
              <td>
                <div className="actions-cell">
                  <Link
                    to={`/dashboard/clientes/${cliente.id_cliente}`}
                    className="btn-action btn-view"
                    title="Ver detalles"
                  >
                    <EyeIcon />
                  </Link>
                  <button
                    className="btn-action btn-edit"
                    onClick={() => handleEditarCliente(cliente)}
                    title="Editar"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() =>
                      handleOpenDeleteModal(
                        cliente.id_cliente,
                        `${cliente.nombre} ${cliente.apellido}`
                      )
                    }
                    title="Eliminar"
                  >
                    <TrashICon />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </GlassTable>

      {/* Paginación (igual que antes) */}

      {/* MODAL DE EDICIÓN/CREACIÓN */}
      {showModal && (
        <ClienteForm
          cliente={editingCliente}
          onClose={handleCloseModal}
          showToast={showToast}
        />
      )}

      {/* MODAL DE ELIMINACIÓN GLASS (NUEVO) */}
      <DeleteModal
        isOpen={deleteModalConfig.show}
        onConfirm={confirmEliminar}
        onCancel={() =>
          setDeleteModalConfig({ show: false, id: null, nombre: "" })
        }
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar a ${deleteModalConfig.nombre}? Esta acción no se puede deshacer.`}
        confirmLabel={"Eliminar Cliente"}
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

export default ClientesList;
