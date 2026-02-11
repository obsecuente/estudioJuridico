// src/controllers/configuracion_controller.js
import configuracionService from "../services/configuracion_service.js";

/**
 * Obtiene los valores de JUS configurados
 * GET /api/configuracion/jus
 */
export const obtenerJus = async (req, res) => {
    try {
        const valores = await configuracionService.obtenerValoresJus();
        return res.json({
            success: true,
            data: valores,
        });
    } catch (error) {
        console.error("Error al obtener valores JUS:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Actualiza el valor del JUS para una provincia
 * PUT /api/configuracion/jus
 * Body: { provincia: "NQN" | "RN", valor: number }
 */
export const actualizarJus = async (req, res) => {
    try {
        const { provincia, valor } = req.body;

        if (!provincia || !valor) {
            return res.status(400).json({
                success: false,
                error: "Provincia y valor son obligatorios",
            });
        }

        const resultado = await configuracionService.actualizarValorJus(provincia, valor);

        return res.json({
            success: true,
            message: `Valor JUS actualizado para ${resultado.provincia}`,
            data: resultado,
        });
    } catch (error) {
        console.error("Error al actualizar valor JUS:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Obtiene todas las configuraciones del estudio
 * GET /api/configuracion
 */
export const obtenerTodas = async (req, res) => {
    try {
        const configs = await configuracionService.obtenerTodas();
        return res.json({
            success: true,
            data: configs,
        });
    } catch (error) {
        console.error("Error al obtener configuraciones:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * Crea o actualiza una configuración genérica
 * PUT /api/configuracion
 * Body: { clave: string, valor: string }
 */
export const upsertConfiguracion = async (req, res) => {
    try {
        const { clave, valor } = req.body;

        if (!clave || !valor) {
            return res.status(400).json({
                success: false,
                error: "Clave y valor son obligatorios",
            });
        }

        const config = await configuracionService.upsert(clave, valor);

        return res.json({
            success: true,
            message: "Configuración guardada",
            data: config,
        });
    } catch (error) {
        console.error("Error al guardar configuración:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
};

export default {
    obtenerJus,
    actualizarJus,
    obtenerTodas,
    upsertConfiguracion,
};
