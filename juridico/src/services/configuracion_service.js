// src/services/configuracion_service.js
import { ConfiguracionEstudio } from "../models/index.js";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

// Claves predefinidas para valores JUS
const CLAVES_JUS = {
    NQN: "VALOR_JUS_NQN",
    RN: "VALOR_JUS_RN",
};

/**
 * Obtiene el valor del JUS para una provincia específica
 * @param {string} provincia - "NQN" o "RN"
 * @returns {Promise<number>} Valor del JUS en pesos
 * @throws {AppError} Si la provincia no es válida o no hay valor configurado
 */
export const obtenerValorJus = async (provincia) => {
    const provinciaUpper = provincia?.toUpperCase();

    if (!provinciaUpper || !CLAVES_JUS[provinciaUpper]) {
        throw new AppError("Provincia inválida. Debe ser NQN o RN", 400);
    }

    const config = await ConfiguracionEstudio.findByPk(CLAVES_JUS[provinciaUpper]);

    if (!config) {
        throw new AppError(
            `No se encontró valor JUS configurado para ${provinciaUpper}. Configure primero el valor.`,
            404
        );
    }

    return parseFloat(config.valor);
};

/**
 * Obtiene los valores JUS de todas las provincias configuradas
 * @returns {Promise<Object>} Objeto con valores JUS por provincia
 */
export const obtenerValoresJus = async () => {
    const configs = await ConfiguracionEstudio.findAll({
        where: {
            clave: Object.values(CLAVES_JUS),
        },
    });

    const resultado = {
        NQN: null,
        RN: null,
        actualizadoEn: null,
    };

    console.log("DEBUG: Configs found:", configs.map(c => ({ clave: c.clave, valor: c.valor })));

    for (const config of configs) {
        if (config.clave === CLAVES_JUS.NQN) {
            resultado.NQN = parseFloat(config.valor);
            resultado.actualizadoEn = config.updatedAt;
        } else if (config.clave === CLAVES_JUS.RN) {
            resultado.RN = parseFloat(config.valor);
            if (!resultado.actualizadoEn || config.updatedAt > resultado.actualizadoEn) {
                resultado.actualizadoEn = config.updatedAt;
            }
        }
    }

    console.log("DEBUG: Result objects:", resultado);

    return resultado;
};

/**
 * Actualiza o crea el valor del JUS para una provincia
 * @param {string} provincia - "NQN" o "RN"
 * @param {number} valor - Nuevo valor del JUS en pesos
 * @returns {Promise<Object>} Configuración actualizada
 * @throws {AppError} Si los datos son inválidos
 */
export const actualizarValorJus = async (provincia, valor) => {
    const provinciaUpper = provincia?.toUpperCase();

    if (!provinciaUpper || !CLAVES_JUS[provinciaUpper]) {
        throw new AppError("Provincia inválida. Debe ser NQN o RN", 400);
    }

    if (!valor || isNaN(valor) || valor <= 0) {
        throw new AppError("El valor del JUS debe ser un número positivo", 400);
    }

    const clave = CLAVES_JUS[provinciaUpper];

    // Upsert: crear o actualizar
    const [config, created] = await ConfiguracionEstudio.upsert(
        {
            clave,
            valor: valor.toString(),
        },
        {
            returning: true,
        }
    );

    return {
        provincia: provinciaUpper,
        clave,
        valor: parseFloat(config.valor),
        creado: created,
        actualizadoEn: config.updatedAt,
    };
};

/**
 * Obtiene todas las configuraciones del estudio
 * @returns {Promise<Array>} Lista de configuraciones
 */
export const obtenerTodas = async () => {
    const configs = await ConfiguracionEstudio.findAll({
        order: [["clave", "ASC"]],
    });

    return configs;
};

/**
 * Crea o actualiza una configuración genérica
 * @param {string} clave - Clave de configuración
 * @param {string} valor - Valor a guardar
 * @returns {Promise<Object>} Configuración guardada
 */
export const upsert = async (clave, valor) => {
    if (!clave || !valor) {
        throw new AppError("Clave y valor son obligatorios", 400);
    }

    const [config] = await ConfiguracionEstudio.upsert(
        { clave, valor },
        { returning: true }
    );

    return config;
};

/**
 * Obtiene una configuración por su clave
 * @param {string} clave - Clave a buscar
 * @returns {Promise<Object|null>} Configuración o null
 */
export const obtenerPorClave = async (clave) => {
    const config = await ConfiguracionEstudio.findByPk(clave);
    return config;
};

export default {
    obtenerValorJus,
    obtenerValoresJus,
    actualizarValorJus,
    obtenerTodas,
    upsert,
    obtenerPorClave,
    CLAVES_JUS,
};
