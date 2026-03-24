// src/services/busqueda_service.js
import { Cliente, Caso, Consulta } from "../models/index.js";
import { Op } from "sequelize";

/**
 * Búsqueda global cross-entidad
 * Busca en clientes, casos y consultas simultáneamente
 * @param {string} query - Término de búsqueda
 * @param {number} limit - Máximo resultados por entidad (default: 5)
 * @returns {Promise<Object>} Resultados agrupados por entidad
 */
export const buscarGlobal = async (query, limit = 5) => {
    if (!query || query.trim().length < 2) {
        return { clientes: [], casos: [], consultas: [] };
    }

    const termino = `%${query.trim()}%`;

    const [clientes, casos, consultas] = await Promise.all([
        // Buscar en clientes por nombre, apellido, DNI, CUIT, email, razón social
        Cliente.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.like]: termino } },
                    { apellido: { [Op.like]: termino } },
                    { dni: { [Op.like]: termino } },
                    { cuit: { [Op.like]: termino } },
                    { email: { [Op.like]: termino } },
                    { razon_social: { [Op.like]: termino } },
                ],
            },
            attributes: ["id_cliente", "nombre", "apellido", "dni", "cuit", "email", "tipo_persona"],
            limit: parseInt(limit),
            order: [["nombre", "ASC"]],
        }),

        // Buscar en casos por descripción, número de expediente, demandado
        Caso.findAll({
            where: {
                [Op.or]: [
                    { descripcion: { [Op.like]: termino } },
                    { numero_expediente: { [Op.like]: termino } },
                    { demandado_nombre: { [Op.like]: termino } },
                    { objeto_del_juicio: { [Op.like]: termino } },
                ],
            },
            include: [{
                model: Cliente,
                as: "cliente",
                attributes: ["nombre", "apellido"],
            }],
            attributes: ["id_caso", "descripcion", "numero_expediente", "estado", "demandado_nombre"],
            limit: parseInt(limit),
            order: [["id_caso", "DESC"]],
        }),

        // Buscar en consultas por mensaje, nombre contacto
        Consulta.findAll({
            where: {
                [Op.or]: [
                    { mensaje: { [Op.like]: termino } },
                    { nombre_contacto: { [Op.like]: termino } },
                ],
            },
            include: [{
                model: Cliente,
                as: "cliente",
                attributes: ["nombre", "apellido"],
                required: false,
            }],
            attributes: ["id_consulta", "mensaje", "nombre_contacto", "fecha_envio", "estado"],
            limit: parseInt(limit),
            order: [["fecha_envio", "DESC"]],
        }),
    ]);

    return {
        clientes,
        casos,
        consultas,
        total: clientes.length + casos.length + consultas.length,
    };
};

export default { buscarGlobal };
