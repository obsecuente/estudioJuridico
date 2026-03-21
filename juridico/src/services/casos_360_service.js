// src/services/casos_360_service.js
import {
    Caso, Cliente, Abogado, Documento, Vencimiento,
    MovimientoFinanciero, Cuota, Etiqueta, HistorialCaso, EtapaLegal,
} from "../models/index.js";
import Evento from "../models/Evento.js";
import { Op } from "sequelize";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

// Limites para IA
const LIMITE_IA_BYTES = 10 * 1024 * 1024;
const TIPOS_IA = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Calcular tiene_ia on-the-fly para docs sin el campo
const calcularIaDisponible = (doc) => {
    if (doc.tiene_ia_disponible !== null && doc.tiene_ia_disponible !== undefined) {
        return {
            tiene_ia_disponible: doc.tiene_ia_disponible,
            motivo_ia_no_disponible: doc.motivo_ia_no_disponible,
        };
    }
    // Docs viejos sin campo: calcular desde tamanio_bytes y tipo_mime
    const size = doc.tamanio_bytes || 0;
    const mime = doc.tipo_mime || "";
    const tieneIa = size > 0 && size < LIMITE_IA_BYTES && TIPOS_IA.includes(mime);
    const motivo = !tieneIa
        ? (size >= LIMITE_IA_BYTES ? "Archivo pesado (+10MB)" : "Formato no compatible con IA")
        : null;
    return { tiene_ia_disponible: tieneIa, motivo_ia_no_disponible: motivo };
};

export const obtenerDetalle360 = async (idCaso) => {
    // 1. Caso con cliente, abogado, etiquetas
    const caso = await Caso.findByPk(idCaso, {
        include: [
            {
                model: Cliente,
                as: "cliente",
                attributes: [
                    "id_cliente", "nombre", "apellido", "telefono", "email",
                    "tipo_persona", "dni", "cuit", "domicilio_real", "razon_social",
                    "localidad", "provincia", "fecha_nacimiento", "domicilio_sede",
                ],
            },
            {
                model: Abogado,
                as: "abogado",
                attributes: ["id_abogado", "nombre", "apellido"],
            },
            {
                model: Etiqueta,
                as: "etiquetas",
                attributes: ["id_etiqueta", "nombre", "color_hex"],
                through: { attributes: [] },
            },
        ],
    });

    if (!caso) throw new AppError("Caso no encontrado", 404);

    // 2. Historial (ultimas 50 entradas)
    const historial = await HistorialCaso.findAll({
        where: { id_caso: idCaso },
        include: [{
            model: Abogado,
            as: "usuario",
            attributes: ["nombre", "apellido"],
        }],
        order: [["fecha_registro", "DESC"]],
        limit: 50,
    });

    // 3. Documentos
    const documentosRaw = await Documento.findAll({
        where: { id_caso: idCaso },
        order: [["id_documento", "DESC"]],
    });

    const documentos = documentosRaw.map(doc => {
        const plain = doc.toJSON();
        const ia = calcularIaDisponible(plain);
        return {
            id_documento: plain.id_documento,
            nombre_archivo: plain.nombre_archivo,
            tamanio_bytes: plain.tamanio_bytes,
            tipo_mime: plain.tipo_mime,
            tiene_ia_disponible: ia.tiene_ia_disponible,
            motivo_ia_no_disponible: ia.motivo_ia_no_disponible,
        };
    });

    // 4. Vencimientos proximos (7 dias)
    const hoy = new Date();
    const en7dias = new Date();
    en7dias.setDate(en7dias.getDate() + 7);

    const vencimientos_proximos = await Vencimiento.findAll({
        where: {
            id_caso: idCaso,
            fecha_limite: { [Op.gte]: hoy },
        },
        order: [["fecha_limite", "ASC"]],
        limit: 5,
    });

    // 5. Resumen financiero del caso
    // Traer el caso para obtener id_cliente
    const casoData = await Caso.findByPk(idCaso, { attributes: ["id_cliente"] });

    const movimientos = await MovimientoFinanciero.findAll({
        where: { id_caso: idCaso },
        include: [{ model: Cuota, as: "cuotas" }],
        order: [["id_movimiento", "DESC"]],
    });

    // Movimientos del cliente (consultas, etc.) sin id_caso — para ultimos movimientos
    const movimientosCliente = casoData?.id_cliente
        ? await MovimientoFinanciero.findAll({
            where: { id_cliente: casoData.id_cliente, id_caso: null },
            order: [["id_movimiento", "DESC"]],
            limit: 10,
        })
        : [];

    // Pendiente: calcular lo que falta cobrar realmente
    // Para movimientos con cuotas: sumar el monto de cuotas pendientes/parciales
    // Para movimientos sin cuotas: usar el monto si estado es pendiente/parcial
    let totalPendienteArs = 0;
    let totalCobradoArs = 0;

    for (const m of movimientos) {
        if (m.tipo !== "ingreso") continue;

        if (m.cuotas && m.cuotas.length > 0) {
            // Sumar cuotas pendientes de pago
            const pendienteCuotas = m.cuotas
                .filter(c => c.estado !== "pagado")
                .reduce((s, c) => s + parseFloat(c.monto_cuota || 0), 0);
            const cobradoCuotas = m.cuotas
                .filter(c => c.estado === "pagado")
                .reduce((s, c) => s + parseFloat(c.monto_cuota || 0), 0);
            totalPendienteArs += pendienteCuotas;
            totalCobradoArs += cobradoCuotas;
        } else {
            if (["pendiente", "parcial"].includes(m.estado)) {
                totalPendienteArs += parseFloat(m.monto_ars || 0);
            } else if (m.estado === "cobrado") {
                totalCobradoArs += parseFloat(m.monto_ars || 0);
            }
        }
    }

    // Cuotas pendientes del caso
    const cuotasPendientes = await Cuota.findAll({
        where: { estado: { [Op.ne]: "pagado" } },
        include: [{
            model: MovimientoFinanciero,
            as: "movimiento",
            where: { id_caso: idCaso, tipo: "ingreso" },
            attributes: ["id_movimiento", "descripcion", "categoria"],
        }],
        order: [["fecha_vencimiento", "ASC"]],
    });

    // Formatear categoria a texto legible
    const formatCat = (cat) => cat
        ? cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
        : "-";

    const todosMovimientos = [...movimientos, ...movimientosCliente]
        .sort((a, b) => b.id_movimiento - a.id_movimiento)
        .slice(0, 8);

    const movimientosRecientes = todosMovimientos.map(m => ({
        id_movimiento: m.id_movimiento,
        tipo: m.tipo,
        categoria: formatCat(m.categoria),
        descripcion: m.descripcion,
        monto_ars: parseFloat(m.monto_ars || 0),
        estado: m.estado,
    }));

    // 6. Etapa legal info
    let etapa_legal_info = null;
    if (caso.tipo_proceso && caso.etapa_actual) {
        const etapa = await EtapaLegal.findOne({
            where: {
                tipo_proceso: caso.tipo_proceso,
                numero_etapa: caso.etapa_actual,
            },
        });
        if (etapa) {
            etapa_legal_info = {
                descripcion: etapa.descripcion,
                numero_etapa: etapa.numero_etapa,
                porcentaje_honorarios: parseFloat(etapa.porcentaje_honorarios || 0),
            };
        }
    }

    // 7. Eventos / Agenda del caso
    const eventos_proximos = await Evento.findAll({
        where: {
            id_caso: idCaso,
            fecha_inicio: { [Op.gte]: new Date().toISOString().split("T")[0] },
            estado: { [Op.ne]: "cancelado" },
        },
        order: [["fecha_inicio", "ASC"], ["hora_inicio", "ASC"]],
        limit: 5,
    });

    return {
        caso,
        historial,
        documentos,
        vencimientos_proximos,
        eventos_proximos,
        resumen_financiero: {
            total_pendiente_ars: totalPendienteArs,
            total_cobrado_ars: totalCobradoArs,
            cuotas_pendientes: cuotasPendientes,
            movimientos_recientes: movimientosRecientes,
        },
        etapa_legal_info,
    };
};

export default { obtenerDetalle360 };
