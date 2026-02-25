// src/middleware/validateOwnership.js
import { MovimientoFinanciero } from "../models/index.js";

/**
 * Middleware que valida que el movimiento financiero pertenece al abogado autenticado.
 * Los admins pueden acceder a cualquier movimiento.
 * Se usa en rutas PATCH/DELETE de movimientos individuales.
 */
export const validateMovimientoOwnership = async (req, res, next) => {
    try {
        const id = req.params.id || req.params.id_movimiento;
        if (!id) return next();

        const movimiento = await MovimientoFinanciero.findByPk(id);
        if (!movimiento) {
            return res.status(404).json({
                success: false,
                error: "Movimiento no encontrado",
            });
        }

        // Admins pueden acceder a cualquier movimiento
        if (req.user.rol === "admin") {
            req.movimiento = movimiento;
            return next();
        }

        // Abogados solo pueden acceder a sus propios movimientos
        if (movimiento.id_abogado !== req.user.id_abogado) {
            return res.status(403).json({
                success: false,
                error: "No tenés permiso para acceder a este movimiento",
            });
        }

        req.movimiento = movimiento;
        next();
    } catch (error) {
        console.error("Error en validateMovimientoOwnership:", error);
        return res.status(500).json({
            success: false,
            error: "Error al validar permisos",
        });
    }
};

export default { validateMovimientoOwnership };
