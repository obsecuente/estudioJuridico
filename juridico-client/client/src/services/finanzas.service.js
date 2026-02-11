// src/services/finanzas.service.js
import api from "./api";

const finanzasService = {
    /**
     * Obtiene el dashboard financiero con métricas anti-inflación
     * @param {string} provincia - NQN o RN (default: NQN)
     */
    getDashboard: async (provincia = "NQN") => {
        const response = await api.get(`/finanzas/dashboard?provincia=${provincia}`);
        return response.data;
    },

    /**
     * Crea un nuevo movimiento financiero
     */
    crearMovimiento: async (datos) => {
        const response = await api.post("/finanzas", datos);
        return response.data;
    },

    /**
     * Obtiene los movimientos de un caso
     */
    getMovimientosPorCaso: async (idCaso) => {
        const response = await api.get(`/finanzas/caso/${idCaso}`);
        return response.data;
    },

    /**
     * Marca una cuota como pagada
     */
    marcarCuotaPagada: async (idCuota, fechaPago = null) => {
        const response = await api.patch(`/finanzas/cuotas/${idCuota}`, {
            fecha_pago: fechaPago,
        });
        return response.data;
    },

    /**
     * Obtiene los valores de JUS configurados
     */
    getValoresJus: async () => {
        const response = await api.get("/configuracion/jus");
        return response.data;
    },

    /**
     * Actualiza el valor del JUS para una provincia
     * @param {string} provincia - NQN o RN
     * @param {number} valor - Nuevo valor en pesos
     */
    actualizarValorJus: async (provincia, valor) => {
        const response = await api.put("/configuracion/jus", { provincia, valor });
        return response.data;
    },

    /**
     * Obtiene movimientos con filtros y paginación
     * @param {Object} params - { page, limit, tipo, estado, id_caso, categoria }
     */
    getMovimientos: async (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null) query.append(key, val);
        });
        const response = await api.get(`/finanzas?${query.toString()}`);
        return response.data;
    },

    // ═══ GASTOS RECURRENTES ═══

    /**
     * Obtener gastos recurrentes activos
     */
    getGastosRecurrentes: async () => {
        const response = await api.get("/finanzas/gastos-recurrentes");
        return response.data;
    },

    /**
     * Crear gasto recurrente a partir de un egreso
     * @param {Object} datos - { categoria, descripcion, monto_ars, dia_vencimiento }
     */
    crearGastoRecurrente: async (datos) => {
        const response = await api.post("/finanzas/gastos-recurrentes", datos);
        return response.data;
    },

    /**
     * Actualizar gasto recurrente
     */
    actualizarGastoRecurrente: async (id, datos) => {
        const response = await api.patch(`/finanzas/gastos-recurrentes/${id}`, datos);
        return response.data;
    },

    /**
     * Eliminar gasto recurrente
     */
    eliminarGastoRecurrente: async (id) => {
        const response = await api.delete(`/finanzas/gastos-recurrentes/${id}`);
        return response.data;
    },

    /**
     * Eliminar movimiento
     */
    eliminarMovimiento: async (id) => {
        const response = await api.delete(`/finanzas/${id}`);
        return response.data;
    },

    /**
     * Obtener movimientos recurrentes pendientes del mes
     */
    getPendientesMes: async () => {
        const response = await api.get("/finanzas/gastos-recurrentes/pendientes");
        return response.data;
    },

    /**
     * Marcar movimiento como pagado
     */
    marcarPagado: async (idMovimiento) => {
        const response = await api.patch(`/finanzas/gastos-recurrentes/movimientos/${idMovimiento}/pagar`);
        return response.data;
    },

    /**
     * Desmarcar movimiento pagado (undo)
     */
    desmarcarPagado: async (idMovimiento) => {
        const response = await api.patch(`/finanzas/gastos-recurrentes/movimientos/${idMovimiento}/despagar`);
        return response.data;
    },
};

export default finanzasService;
