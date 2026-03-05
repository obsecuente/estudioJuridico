// src/services/historial_service.js
import { HistorialCaso, Abogado } from "../models/index.js";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

// Crear nota manual
export const crearNota = async (idCaso, descripcion, esImportante = false, idUsuario = null) => {
    if (!descripcion || !descripcion.trim()) {
        throw new AppError("La descripcion es obligatoria", 400);
    }

    const entrada = await HistorialCaso.create({
        id_caso: idCaso,
        tipo_evento: "NOTA_MANUAL",
        descripcion: descripcion.trim(),
        es_importante: !!esImportante,
        id_usuario: idUsuario,
    });

    return entrada;
};

// Crear evento de sistema (para triggers automaticos)
export const crearEventoSistema = async (idCaso, tipoEvento, descripcion, metadata = null, idUsuario = null) => {
    try {
        await HistorialCaso.create({
            id_caso: idCaso,
            tipo_evento: tipoEvento,
            descripcion,
            metadata,
            id_usuario: idUsuario,
        });
    } catch (err) {
        // No fallar si el historial no se puede crear
        console.error("Error al crear evento de historial:", err.message);
    }
};

// Obtener historial paginado de un caso
export const obtenerHistorial = async (idCaso, page = 1, limit = 50) => {
    const offset = (page - 1) * limit;

    const { count, rows } = await HistorialCaso.findAndCountAll({
        where: { id_caso: idCaso },
        include: [{
            model: Abogado,
            as: "usuario",
            attributes: ["id_abogado", "nombre", "apellido"],
        }],
        order: [["fecha_registro", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
    });

    return {
        historial: rows,
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
        },
    };
};

export default { crearNota, crearEventoSistema, obtenerHistorial };
