// src/services/etapas_service.js
import { EtapaLegal, Caso } from "../models/index.js";
import historialService from "./historial_service.js";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

// Listar etapas legales (opcionalmente filtradas por tipo_proceso)
export const listar = async (tipoProceso = null) => {
    const where = {};
    if (tipoProceso) where.tipo_proceso = tipoProceso;

    return EtapaLegal.findAll({
        where,
        order: [["tipo_proceso", "ASC"], ["numero_etapa", "ASC"]],
    });
};

// Actualizar etapa procesal de un caso (dispara historial CAMBIO_ETAPA)
export const actualizarEtapaCaso = async (idCaso, datos, idUsuario = null) => {
    const caso = await Caso.findByPk(idCaso);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    const {
        instancia, tipo_proceso, fuero, jurisdiccion,
        numero_expediente, etapa_actual,
    } = datos;

    // Guardar valores anteriores para el historial
    const antes = {
        instancia: caso.instancia,
        tipo_proceso: caso.tipo_proceso,
        fuero: caso.fuero,
        jurisdiccion: caso.jurisdiccion,
        numero_expediente: caso.numero_expediente,
        etapa_actual: caso.etapa_actual,
    };

    // Actualizar solo los campos proporcionados
    const updates = {};
    if (instancia !== undefined) updates.instancia = instancia;
    if (tipo_proceso !== undefined) updates.tipo_proceso = tipo_proceso;
    if (fuero !== undefined) updates.fuero = fuero;
    if (jurisdiccion !== undefined) updates.jurisdiccion = jurisdiccion;
    if (numero_expediente !== undefined) updates.numero_expediente = numero_expediente;
    if (etapa_actual !== undefined) updates.etapa_actual = etapa_actual;

    await caso.update(updates);

    // Construir descripcion del cambio
    const cambios = [];
    if (instancia !== undefined && instancia !== antes.instancia) cambios.push(`Instancia: ${instancia}`);
    if (tipo_proceso !== undefined && tipo_proceso !== antes.tipo_proceso) cambios.push(`Proceso: ${tipo_proceso}`);
    if (fuero !== undefined && fuero !== antes.fuero) cambios.push(`Fuero: ${fuero}`);
    if (etapa_actual !== undefined && etapa_actual !== antes.etapa_actual) cambios.push(`Etapa: ${etapa_actual}`);
    if (numero_expediente !== undefined && numero_expediente !== antes.numero_expediente) cambios.push(`Expediente: ${numero_expediente}`);

    const desc = cambios.length > 0
        ? `Se actualizo la etapa procesal: ${cambios.join(", ")}`
        : "Se actualizo la configuracion procesal del caso";

    await historialService.crearEventoSistema(
        idCaso,
        "CAMBIO_ETAPA",
        desc,
        { antes, despues: updates },
        idUsuario
    );

    return caso.reload();
};

export default { listar, actualizarEtapaCaso };
