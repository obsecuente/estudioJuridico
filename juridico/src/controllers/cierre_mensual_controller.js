
import cierreMensualService from "../services/cierre_mensual_service.js";

const obtenerCierres = async (req, res) => {
    try {
        const { id_abogado } = req.user;
        const { anio } = req.query;

        // Si es admin, permitir ver de otros?? Por ahora simplificado: ver los propios o filtros en el futuro
        // Asumimos ver los propios por ahora para estadísticas personales
        // O si es admin, ver todos? El requerimiento no especifica.
        // Vamos a permitir que el admin pase un id_abogado en query
        let idAbogadoTarget = id_abogado;
        if (req.user.rol === "admin" && req.query.id_abogado) {
            idAbogadoTarget = req.query.id_abogado;
        }

        const cierres = await cierreMensualService.obtenerCierres(idAbogadoTarget, anio);
        return res.json({ success: true, data: cierres });
    } catch (error) {
        console.error("Error al obtener cierres:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const generarCierreManual = async (req, res) => {
    try {
        const { mes, anio } = req.body;
        if (!mes || !anio) {
            return res.status(400).json({ success: false, error: "Mes y año son requeridos" });
        }

        // Solo admin puede forzar cierre manual? O cualquiera?
        // Dejemos que cualquiera pueda "recalcular" su cierre si quiere (aunque el job lo hace auto)
        // Pero la función genera para TODOS los abogados.
        // Entonces solo admin debería poder llamar a esto.
        if (req.user.rol !== "admin") {
            return res.status(403).json({ success: false, error: "Solo admin puede generar cierre manual global" });
        }

        await cierreMensualService.generarCierreMensual(mes, anio);
        return res.json({ success: true, message: "Cierre generado exitosamente" });
    } catch (error) {
        console.error("Error al generar cierre manual:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    obtenerCierres,
    generarCierreManual,
};
