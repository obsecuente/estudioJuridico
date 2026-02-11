// src/services/tareas_service.js
import { Tarea, Abogado, Caso } from "../models/index.js";
import { Op } from "sequelize";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

/**
 * Crea una nueva tarea para un abogado
 * @param {Object} datos - Datos de la tarea
 * @param {string} datos.descripcion - Descripción de la tarea (obligatorio)
 * @param {number} datos.id_abogado - ID del abogado dueño (obligatorio)
 * @param {string} datos.prioridad - baja/media/alta (default: media)
 * @param {string} datos.fecha_limite - Fecha límite opcional (YYYY-MM-DD)
 * @param {number} datos.id_caso - ID del caso vinculado (opcional)
 * @returns {Promise<Object>} Tarea creada
 */
export const crear = async (datos) => {
    const { descripcion, id_abogado, prioridad, fecha_limite, id_caso, categoria, hora_limite } = datos;

    // Validaciones
    if (!descripcion || descripcion.trim().length === 0) {
        throw new AppError("La descripción es obligatoria", 400);
    }

    if (!id_abogado) {
        throw new AppError("El ID del abogado es obligatorio", 400);
    }

    // Validar que el abogado existe
    const abogadoExiste = await Abogado.findByPk(id_abogado);
    if (!abogadoExiste) {
        throw new AppError("El abogado especificado no existe", 404);
    }

    // Validar prioridad
    const prioridadesValidas = ["baja", "media", "alta"];
    if (prioridad && !prioridadesValidas.includes(prioridad)) {
        throw new AppError(`Prioridad inválida. Debe ser: ${prioridadesValidas.join(", ")}`, 400);
    }

    // Validar caso si se proporciona
    if (id_caso) {
        const casoExiste = await Caso.findByPk(id_caso);
        if (!casoExiste) {
            throw new AppError("El caso especificado no existe", 404);
        }
    }

    try {
        const tarea = await Tarea.create({
            descripcion: descripcion.trim(),
            id_abogado,
            prioridad: prioridad || "media",
            fecha_limite: fecha_limite || null,
            id_caso: id_caso || null,
            categoria: categoria || null,
            hora_limite: hora_limite || null,
            completada: false,
            en_plazo_gracia: false,
        });

        // Retornar con relaciones
        const tareaCompleta = await Tarea.findByPk(tarea.id_tarea, {
            include: [
                { model: Abogado, as: "abogado", attributes: ["id_abogado", "nombre", "apellido"] },
                { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
            ],
        });

        return tareaCompleta;
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            const mensajes = error.errors.map((e) => e.message).join(", ");
            throw new AppError(`Error de validación: ${mensajes}`, 400);
        }
        throw new AppError("Error al crear la tarea", 500);
    }
};

/**
 * Obtiene las tareas de un abogado con filtros
 * @param {number} id_abogado - ID del abogado
 * @param {Object} opciones - Opciones de filtrado
 * @param {boolean} opciones.completadas - Filtrar por estado (true/false/undefined=todas)
 * @param {string} opciones.prioridad - Filtrar por prioridad
 * @param {number} opciones.id_caso - Filtrar por caso
 * @param {boolean} opciones.vencidas - Solo tareas con fecha_limite vencida
 * @param {number} opciones.page - Página
 * @param {number} opciones.limit - Límite por página
 * @returns {Promise<Object>} Tareas con paginación
 */
export const obtenerPorAbogado = async (id_abogado, opciones = {}) => {
    const {
        completadas,
        prioridad,
        id_caso,
        vencidas,
        page = 1,
        limit = 50,
    } = opciones;

    const offset = (page - 1) * limit;
    const where = { id_abogado };

    // Filtro por estado
    if (completadas !== undefined) {
        where.completada = completadas === true || completadas === "true";
    }

    // Filtro por prioridad
    if (prioridad) {
        const prioridadesValidas = ["baja", "media", "alta"];
        if (prioridadesValidas.includes(prioridad)) {
            where.prioridad = prioridad;
        }
    }

    // Filtro por caso
    if (id_caso) {
        where.id_caso = id_caso;
    }

    // Filtro por vencidas
    if (vencidas === true || vencidas === "true") {
        where.fecha_limite = { [Op.lt]: new Date() };
        where.completada = false;
    }

    const { count, rows: tareas } = await Tarea.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
            ["completada", "ASC"], // Pendientes primero
            ["prioridad", "DESC"], // Alta prioridad primero
            ["fecha_limite", "ASC"], // Más urgentes primero
            ["createdAt", "DESC"],
        ],
        include: [
            { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
        ],
    });

    return {
        tareas,
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
        },
    };
};

/**
 * Obtiene una tarea por ID (verificando que pertenece al abogado)
 * @param {number} id_tarea - ID de la tarea
 * @param {number} id_abogado - ID del abogado (para validar propiedad)
 * @returns {Promise<Object>} Tarea encontrada
 */
export const obtenerPorId = async (id_tarea, id_abogado) => {
    const tarea = await Tarea.findByPk(id_tarea, {
        include: [
            { model: Abogado, as: "abogado", attributes: ["id_abogado", "nombre", "apellido"] },
            { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
        ],
    });

    if (!tarea) {
        throw new AppError("Tarea no encontrada", 404);
    }

    // Verificar que pertenece al abogado
    if (tarea.id_abogado !== id_abogado) {
        throw new AppError("No tienes permiso para ver esta tarea", 403);
    }

    return tarea;
};

/**
 * Actualiza una tarea
 * @param {number} id_tarea - ID de la tarea
 * @param {number} id_abogado - ID del abogado (para validar propiedad)
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} Tarea actualizada
 */
export const actualizar = async (id_tarea, id_abogado, datos) => {
    const tarea = await Tarea.findByPk(id_tarea);

    if (!tarea) {
        throw new AppError("Tarea no encontrada", 404);
    }

    if (tarea.id_abogado !== id_abogado) {
        throw new AppError("No tienes permiso para modificar esta tarea", 403);
    }

    const { descripcion, prioridad, fecha_limite, id_caso, completada, categoria, hora_limite, en_plazo_gracia } = datos;

    // Validar prioridad
    if (prioridad) {
        const prioridadesValidas = ["baja", "media", "alta"];
        if (!prioridadesValidas.includes(prioridad)) {
            throw new AppError(`Prioridad inválida. Debe ser: ${prioridadesValidas.join(", ")}`, 400);
        }
    }

    // Validar caso si se proporciona
    if (id_caso) {
        const casoExiste = await Caso.findByPk(id_caso);
        if (!casoExiste) {
            throw new AppError("El caso especificado no existe", 404);
        }
    }

    await tarea.update({
        ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
        ...(prioridad !== undefined && { prioridad }),
        ...(fecha_limite !== undefined && { fecha_limite }),
        ...(id_caso !== undefined && { id_caso }),
        ...(completada !== undefined && { completada }),
        ...(categoria !== undefined && { categoria }),
        ...(hora_limite !== undefined && { hora_limite }),
        ...(en_plazo_gracia !== undefined && { en_plazo_gracia }),
    });

    // Retornar actualizada con relaciones
    const tareaActualizada = await Tarea.findByPk(id_tarea, {
        include: [
            { model: Abogado, as: "abogado", attributes: ["id_abogado", "nombre", "apellido"] },
            { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
        ],
    });

    return tareaActualizada;
};

/**
 * Marca una tarea como completada o pendiente
 * @param {number} id_tarea - ID de la tarea
 * @param {number} id_abogado - ID del abogado
 * @param {boolean} completada - Nuevo estado
 * @returns {Promise<Object>} Tarea actualizada
 */
export const marcarCompletada = async (id_tarea, id_abogado, completada = true) => {
    return await actualizar(id_tarea, id_abogado, { completada });
};

/**
 * Elimina una tarea
 * @param {number} id_tarea - ID de la tarea
 * @param {number} id_abogado - ID del abogado
 * @returns {Promise<Object>} Mensaje de éxito
 */
export const eliminar = async (id_tarea, id_abogado) => {
    const tarea = await Tarea.findByPk(id_tarea);

    if (!tarea) {
        throw new AppError("Tarea no encontrada", 404);
    }

    if (tarea.id_abogado !== id_abogado) {
        throw new AppError("No tienes permiso para eliminar esta tarea", 403);
    }

    await tarea.destroy();

    return {
        message: "Tarea eliminada exitosamente",
        id: id_tarea,
    };
};

/**
 * Obtiene estadísticas de tareas de un abogado
 * @param {number} id_abogado - ID del abogado
 * @returns {Promise<Object>} Estadísticas
 */
export const obtenerEstadisticas = async (id_abogado) => {
    const [total, pendientes, completadas, vencidas, altaPrioridad] = await Promise.all([
        Tarea.count({ where: { id_abogado } }),
        Tarea.count({ where: { id_abogado, completada: false } }),
        Tarea.count({ where: { id_abogado, completada: true } }),
        Tarea.count({
            where: {
                id_abogado,
                completada: false,
                fecha_limite: { [Op.lt]: new Date() },
            },
        }),
        Tarea.count({
            where: {
                id_abogado,
                completada: false,
                prioridad: "alta",
            },
        }),
    ]);

    return {
        total,
        pendientes,
        completadas,
        vencidas,
        alta_prioridad: altaPrioridad,
        porcentaje_completado: total > 0 ? ((completadas / total) * 100).toFixed(1) : 0,
    };
};

/**
 * Obtiene las tareas organizadas para Mi Día (dashboard)
 * Retorna las tareas agrupadas por nivel de urgencia
 * @param {number} id_abogado - ID del abogado
 * @returns {Promise<Object>} Tareas organizadas por sección
 */
export const obtenerMiDia = async (id_abogado) => {
    // Usar fecha local del servidor (no UTC) para evitar desfasajes de timezone
    const ahora = new Date();
    const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

    // Obtener todas las tareas pendientes del abogado
    const tareasPendientes = await Tarea.findAll({
        where: {
            id_abogado,
            completada: false,
        },
        order: [
            ["prioridad", "DESC"],
            ["fecha_limite", "ASC"],
            ["createdAt", "DESC"],
        ],
        include: [
            { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
        ],
    });

    // Clasificar por urgencia usando comparación de strings (DATEONLY = "YYYY-MM-DD")
    const urgentes = [];       // Plazo de gracia
    const vencenHoy = [];      // Vencen hoy
    const atrasadas = [];      // Fecha límite pasada
    const pendientes = [];     // Resto

    for (const tarea of tareasPendientes) {
        if (tarea.en_plazo_gracia) {
            urgentes.push(tarea);
        } else if (tarea.fecha_limite) {
            // fecha_limite es DATEONLY → string "YYYY-MM-DD", comparar directo
            const fechaStr = String(tarea.fecha_limite);

            if (fechaStr === hoyStr) {
                vencenHoy.push(tarea);
            } else if (fechaStr < hoyStr) {
                atrasadas.push(tarea);
            } else {
                pendientes.push(tarea);
            }
        } else {
            pendientes.push(tarea);
        }
    }

    // Estadísticas
    const stats = await obtenerEstadisticas(id_abogado);

    return {
        fecha: hoyStr,
        urgentes,
        vencen_hoy: vencenHoy,
        atrasadas,
        pendientes,
        stats,
    };
};

/**
 * Pasa una tarea al plazo de gracia (Art. 124 CPCC)
 * Mueve la fecha_limite al próximo día hábil con hora 09:30
 * @param {number} id_tarea - ID de la tarea
 * @param {number} id_abogado - ID del abogado
 * @returns {Promise<Object>} Tarea actualizada
 */
export const pasarAPlazoDeGracia = async (id_tarea, id_abogado) => {
    const tarea = await Tarea.findByPk(id_tarea);

    if (!tarea) {
        throw new AppError("Tarea no encontrada", 404);
    }

    if (tarea.id_abogado !== id_abogado) {
        throw new AppError("No tienes permiso para modificar esta tarea", 403);
    }

    if (tarea.completada) {
        throw new AppError("No se puede pasar al plazo de gracia una tarea completada", 400);
    }

    // Calcular próximo día hábil (saltar fines de semana)
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    // Si cae sábado (6) → mover al lunes; domingo (0) → mover al lunes
    if (manana.getDay() === 6) manana.setDate(manana.getDate() + 2);
    if (manana.getDay() === 0) manana.setDate(manana.getDate() + 1);

    const fechaGracia = manana.toISOString().split("T")[0];

    await tarea.update({
        en_plazo_gracia: true,
        fecha_limite: fechaGracia,
        hora_limite: "09:30:00",
        prioridad: "alta",
    });

    const tareaActualizada = await Tarea.findByPk(id_tarea, {
        include: [
            { model: Abogado, as: "abogado", attributes: ["id_abogado", "nombre", "apellido"] },
            { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
        ],
    });

    return tareaActualizada;
};

export default {
    crear,
    obtenerPorAbogado,
    obtenerPorId,
    actualizar,
    marcarCompletada,
    eliminar,
    obtenerEstadisticas,
    obtenerMiDia,
    pasarAPlazoDeGracia,
};
