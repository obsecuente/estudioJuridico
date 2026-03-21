// src/services/calculadora_contextual_service.js
import { Caso } from "../models/index.js";
import calculadoraService from "./calculadora_service.js";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

// Plazos por tipo de proceso (facilmente actualizable para Ley 3430)
const PLAZOS_POR_PROCESO = {
    Ejecutivo: [
        { nombre: "Oponer Excepciones", dias: 5, legal: "Art. 544 CPCCN" },
        { nombre: "Sentencia / Ejecucion", dias: 10, legal: "Art. 551 CPCCN" },
    ],
    Ordinario: [
        { nombre: "Contestacion de Demanda", dias: 15, legal: "Art. 338 CPCCN" },
        { nombre: "Ofrecimiento de Prueba", dias: 10, legal: "Art. 367 CPCCN" },
        { nombre: "Alegatos", dias: 6, legal: "Art. 482 CPCCN" },
    ],
    Sumarísimo: [
        { nombre: "Contestacion de Demanda", dias: 5, legal: "Art. 498 CPCCN" },
    ],
    Laboral: [
        { nombre: "Contestacion de Demanda", dias: 10, legal: "Ley 18.345 Art. 75" },
        { nombre: "Ofrecimiento de Prueba", dias: 10, legal: "Ley 18.345" },
        { nombre: "Alegatos", dias: 5, legal: "Ley 18.345" },
    ],
};

export const calcularContextual = async (idCaso, fechaNotificacion) => {
    const caso = await Caso.findByPk(idCaso);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    const tipoProceso = caso.tipo_proceso;
    const jurisdiccion = caso.jurisdiccion || "nacional";

    if (!tipoProceso) {
        throw new AppError(
            "El caso no tiene tipo de proceso definido. Configure la etapa procesal primero.",
            400
        );
    }

    const plazos = PLAZOS_POR_PROCESO[tipoProceso];
    if (!plazos) {
        throw new AppError(`No hay plazos configurados para el tipo: ${tipoProceso}`, 400);
    }

    // Calcular cada plazo usando la calculadora existente
    const plazosSugeridos = [];
    for (const plazo of plazos) {
        try {
            const resultado = await calculadoraService.calcularVencimiento({
                fecha_notificacion: fechaNotificacion,
                dias_plazo: plazo.dias,
                jurisdiccion,
                incluir_plazo_gracia: false,
            });

            plazosSugeridos.push({
                nombre: plazo.nombre,
                dias: plazo.dias,
                fecha_vencimiento: resultado.fecha_vencimiento,
                legal: plazo.legal,
            });
        } catch (err) {
            // Si falla un calculo individual, incluir con error
            plazosSugeridos.push({
                nombre: plazo.nombre,
                dias: plazo.dias,
                fecha_vencimiento: null,
                legal: plazo.legal,
                error: err.message,
            });
        }
    }

    return {
        caso: {
            id_caso: caso.id_caso,
            tipo_proceso: tipoProceso,
            jurisdiccion,
            fuero: caso.fuero,
        },
        plazos_sugeridos: plazosSugeridos,
    };
};

export default { calcularContextual };
