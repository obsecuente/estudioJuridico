import React, { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import ModalFrame from "../../components/common/ModalFrame";
import CustomSelect from "../../components/common/CustomSelect";
import "./ConsultaForm.css";

const ConsultaForm = ({ consulta, clienteId, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    mensaje: "",
    estado: "pendiente",
    id_cliente: "",
    id_abogado_asignado: "",
  });

  const [clientes, setClientes] = useState([]);
  const [abogados, setAbogados] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Carga de datos inicial (Solo una vez)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [clRes, abRes] = await Promise.all([
          api.get("/clientes?limit=1000"),
          api.get("/abogados?limit=1000"),
        ]);
        setClientes(clRes.data.data || []);
        setAbogados(abRes.data.data || []);
      } catch (err) {
        showToast("Error al cargar datos", "error");
      }
    };
    cargarDatos();
  }, []);

  // 2. Sincronización con la consulta a editar
  useEffect(() => {
    if (consulta) {
      setFormData({
        mensaje: consulta.mensaje || "",
        estado: consulta.estado || "pendiente",
        id_cliente: String(consulta.id_cliente || ""),
        id_abogado_asignado: String(consulta.id_abogado_asignado || ""),
      });
    } else if (clienteId) {
      setFormData((prev) => ({ ...prev, id_cliente: String(clienteId) }));
    }
  }, [consulta, clienteId]);

  // --- MEMOIZACIÓN DE OPCIONES (Esto arregla el FOCO) ---
  const opcionesClientes = useMemo(
    () =>
      clientes.map((c) => ({
        value: String(c.id_cliente),
        label: `${c.nombre} ${c.apellido}`,
      })),
    [clientes]
  );

  const opcionesAbogados = useMemo(
    () =>
      abogados.map((a) => ({
        value: String(a.id_abogado),
        label: `${a.nombre} ${a.apellido}`,
      })),
    [abogados]
  );

  const opcionesEstado = useMemo(
    () => [
      { value: "pendiente", label: "PENDIENTE" },
      { value: "en_progreso", label: "EN PROGRESO" },
      { value: "resuelta", label: "RESUELTA" },
    ],
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        id_abogado_asignado: formData.id_abogado_asignado || null,
      };
      if (consulta) {
        await api.put(`/consultas/${consulta.id_consulta}`, data);
        showToast("Consulta actualizada");
      } else {
        await api.post("/consultas", data);
        showToast("Consulta creada");
      }
      onClose(true);
    } catch (err) {
      showToast("Error al guardar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame
      title={consulta ? "Editar Consulta" : "Nueva Consulta"}
      onClose={() => onClose(false)}
    >
      <form onSubmit={handleSubmit} className="premium-form-content">
        <div className="form-body">
          <div className="form-group">
            <label>CLIENTE</label>
            <CustomSelect
              options={opcionesClientes}
              value={formData.id_cliente}
              onChange={(val) =>
                setFormData((p) => ({ ...p, id_cliente: val }))
              }
              placeholder="Seleccionar cliente..."
              disabled={!!clienteId}
            />
          </div>

          <div className="form-group">
            <label>ABOGADO ASIGNADO</label>
            <CustomSelect
              options={opcionesAbogados}
              value={formData.id_abogado_asignado}
              onChange={(val) =>
                setFormData((p) => ({ ...p, id_abogado_asignado: val }))
              }
              placeholder="Sin asignar..."
            />
          </div>

          <div className="form-group">
            <label>MENSAJE</label>
            <textarea
              className="premium-textarea"
              value={formData.mensaje}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, mensaje: e.target.value }))
              }
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>ESTADO</label>
            <CustomSelect
              options={opcionesEstado}
              value={formData.estado}
              onChange={(val) => setFormData((p) => ({ ...p, estado: val }))}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => onClose(false)}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Consulta"}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
};

export default ConsultaForm;
