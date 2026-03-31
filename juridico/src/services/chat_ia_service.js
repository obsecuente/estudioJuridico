import { Groq } from "groq-sdk";
import { sequelize, Abogado, Cliente, Caso, Tarea, MovimientoFinanciero, Cuota, HistorialCaso, Evento, Vencimiento, ConfiguracionEstudio } from "../models/index.js";
import { Op } from "sequelize";

/**
 * 💡 CONFIGURACIÓN DE IA EXTERNA
 * =========================================================
 * Actualmente se está utilizando la API gratuita de Groq con el modelo 'llama-3.3-70b-versatile'.
 * Para utilizar un proveedor pago como OpenAI (GPT-4o) o Anthropic (Claude 3.5 Sonnet):
 * 
 * 1. OpenAI:
 *    - Instalar: npm install openai
 *    - Importar: import { OpenAI } from "openai"
 *    - Inicializar: const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
 *    - Llamar: await openai.chat.completions.create({ model: "gpt-4o", messages })
 * 
 * 2. Anthropic:
 *    - Instalar: npm install @anthropic-ai/sdk
 *    - Importar: import Anthropic from "@anthropic-ai/sdk"
 *    - Inicializar: const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
 *    - Llamar: await anthropic.messages.create({ model: "claude-3-5-sonnet-20240620", system, messages })
 */

// Inicializa Groq. Requiere agregar GROQ_API_KEY en el .env
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export const procesarMensaje = async (mensajesAnteriores, mensajeUsuario, id_abogado) => {
    if (!groq) {
        throw new Error("GROQ_API_KEY no está configurada en .env");
    }

    try {
        // 1. Obtener datos básicos del abogado
        const abogado = await Abogado.findByPk(id_abogado);
        if (!abogado) throw new Error("Abogado no encontrado");

        // 2. Extraer contexto dinámico (Smart RAG)
        const stopWords = ["caso", "casos", "cliente", "clientes", "sobre", "tiene", "este", "esta", "para", "como", "numero", "expediente", "actualmente", "estudio", "conserva", "seguro", "informacion", "tenes", "tiene"];
        const palabrasClave = mensajeUsuario.toLowerCase().replace(/[?,¿!¡.\n]/g, "").split(/\s+/).filter(p => p.length > 3 && !stopWords.includes(p));
        
        let contextoExtraido = {
            resumenGlobalEstudio: {},
            analiticasAvanzadas: null,
            clientesMencionados: [],
            casosMencionados: [],
            tareasPendientes: [],
            deudasGenerales: []
        };

        // A. SIEMPRE extraer un resumen global rápido del estudio (muy barato en BD) para poder responder "cómo está mi estudio"
        const totalClientes = await Cliente.count();
        const totalCasosActivos = await Caso.count({ where: { id_abogado, estado: 'abierto' } });
        
        const proximosVencimientos = await Vencimiento.findAll({
            where: { id_abogado, estado: 'pendiente' },
            order: [["fecha_limite", "ASC"]],
            limit: 5
        });

        const proximosEventos = await Evento.findAll({
            where: { id_abogado, estado: 'pendiente' },
            order: [["fecha_inicio", "ASC"]],
            limit: 5
        });

        // Ingresos cobrados este mes
        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const ingresosMes = await MovimientoFinanciero.findAll({
            where: { id_abogado, tipo: "ingreso", estado: "pagado", updatedAt: { [Op.gte]: inicioMes } }
        });
        const totalIngresosMes = ingresosMes.reduce((acc, curr) => acc + Number(curr.monto_ars), 0);

        contextoExtraido.resumenGlobalEstudio = {
            total_clientes_registrados: totalClientes,
            total_casos_abiertos: totalCasosActivos,
            ingresos_cobrados_este_mes_ars: totalIngresosMes,
            proximos_5_vencimientos_urgentes: proximosVencimientos.length > 0 ? proximosVencimientos.map(v => `${v.titulo} (${v.fecha_limite})`) : "Ninguno",
            proximos_5_eventos_urgentes: proximosEventos.length > 0 ? proximosEventos.map(e => `${e.titulo} (${e.fecha_inicio})`) : "Ninguno"
        };

        if (palabrasClave.length > 0) {
            // B. Buscar Clientes
            const condicionesCliente = palabrasClave.map(p => ({
                [Op.or]: [
                    { nombre: { [Op.like]: `%${p}%` } },
                    { apellido: { [Op.like]: `%${p}%` } }
                ]
            }));

            // Búsqueda cruzada de palabras
            const clientesMatches = await Cliente.findAll({
                where: {
                    [Op.and]: [
                        { [Op.or]: condicionesCliente }
                    ]
                },
                limit: 3
            });

            for (const c of clientesMatches) {
                // Traer también IDs de casos de este cliente para no perder deudas facturadas a la carpeta
                const casosDelC = await Caso.findAll({ where: { id_cliente: c.id_cliente } });
                const idsCasos = casosDelC.map(x => x.id_caso);

                // Calcular saldo pendiente (MovimientosFinancieros tipo 'ingreso' estado 'pendiente' o 'parcial')
                const cobrosPendientes = await MovimientoFinanciero.findAll({
                    where: { 
                        [Op.or]: [
                            { id_cliente: c.id_cliente },
                            { id_caso: { [Op.in]: idsCasos.length ? idsCasos : [0] } }
                        ],
                        tipo: "ingreso", 
                        estado: { [Op.in]: ["pendiente", "parcial"] } 
                    },
                    include: [{ model: Cuota, as: "cuotas", where: { estado: "pendiente" }, required: false }]
                });

                let totalDeuda = 0;
                let resumenDeudas = [];
                for (const cobro of cobrosPendientes) {
                    if (cobro.cuotas && cobro.cuotas.length > 0) {
                        const deudacuotas = cobro.cuotas.reduce((acc, obj) => acc + Number(obj.monto_cuota), 0);
                        totalDeuda += deudacuotas;
                        resumenDeudas.push(`Plan Cuotas (${cobro.descripcion || cobro.categoria}): $${deudacuotas} pendientes`);
                    } else {
                        totalDeuda += Number(cobro.monto_ars);
                        resumenDeudas.push(`${cobro.descripcion || cobro.categoria}: $${cobro.monto_ars}`);
                    }
                }

                // Append the client's cases to their context footprint!
                const descripcionesCasosDelCliente = casosDelC.map(x => `${x.numero_expediente ? `Exp: ${x.numero_expediente} - ` : ''}${x.descripcion} (Estado: ${x.estado})`);

                contextoExtraido.clientesMencionados.push({
                    nombre: `${c.nombre} ${c.apellido}`,
                    dni: c.dni,
                    contacto: c.telefono,
                    casos_adjudicados: descripcionesCasosDelCliente.length > 0 ? descripcionesCasosDelCliente : "Ninguno",
                    deuda_total_ars: totalDeuda,
                    detalle_deudas: resumenDeudas.length > 0 ? resumenDeudas : "Sin deuda pendiente"
                });
            }

            // C. Buscar Casos
            const condicionesCaso = palabrasClave.map(p => ({
                [Op.or]: [
                    { descripcion: { [Op.like]: `%${p}%` } },
                    { numero_expediente: { [Op.like]: `%${p}%` } }
                ]
            }));

            const casosMatches = await Caso.findAll({
                where: {
                    id_abogado,
                    [Op.or]: condicionesCaso
                },
                limit: 3
            });

            for (const caso of casosMatches) {
                // Obtener historial reciente
                const historial = await HistorialCaso.findAll({
                    where: { id_caso: caso.id_caso },
                    order: [["fecha_registro", "DESC"]],
                    limit: 5
                });
                
                // Extraer deudas asociadas al caso
                const cobrosCaso = await MovimientoFinanciero.findAll({
                    where: { id_caso: caso.id_caso, tipo: "ingreso", estado: { [Op.in]: ["pendiente", "parcial"] } },
                    include: [{ model: Cuota, as: "cuotas", where: { estado: "pendiente" }, required: false }]
                });

                let totalDeudaCaso = 0;
                let resumenDeudasCaso = [];
                for (const cobro of cobrosCaso) {
                    if (cobro.cuotas && cobro.cuotas.length > 0) {
                        const deudacuotas = cobro.cuotas.reduce((acc, obj) => acc + Number(obj.monto_cuota), 0);
                        totalDeudaCaso += deudacuotas;
                        resumenDeudasCaso.push(`Plan de Pago (${cobro.descripcion}): $${deudacuotas} pendientes`);
                    } else {
                        totalDeudaCaso += Number(cobro.monto_ars);
                        resumenDeudasCaso.push(`${cobro.descripcion || cobro.categoria}: $${cobro.monto_ars}`);
                    }
                }

                contextoExtraido.casosMencionados.push({
                    caratula_descripcion: caso.descripcion,
                    expediente: caso.numero_expediente || "Sin asignar",
                    estado_actual: caso.estado,
                    jurisdiccion: caso.jurisdiccion || "N/A",
                    fuero: caso.fuero || "N/A",
                    deuda_pendiente_ars: totalDeudaCaso,
                    detalle_log_deuda: resumenDeudasCaso.length > 0 ? resumenDeudasCaso : "Sin deuda asignada a este caso",
                    ultimos_movimientos: historial.map(h => `[${new Date(h.fecha).toLocaleDateString()}] ${h.etapa}: ${h.descripcion}`)
                });
            }
        }

        // C. Tareas Pendientes del abogado 
        if (palabrasClave.some(p => p.includes("tarea") || p.includes("pendiente") || p.includes("hacer") || p.includes("vencer"))) {
            const tareas = await Tarea.findAll({
                where: { id_abogado, completada: false },
                order: [["fecha_limite", "ASC"]],
                limit: 10
            });
            contextoExtraido.tareasPendientes = tareas.map(t => `${t.descripcion} (Vence: ${t.fecha_limite ? t.fecha_limite : 'Sin fecha'})`);
        }

        // D. Deudas Generales (si el usuario pide un panorama global y no matcheo clientes particulares, o lo pide igual)
        const pideDeudas = mensajeUsuario.toLowerCase().includes("deuda") || mensajeUsuario.toLowerCase().includes("cobrar") || mensajeUsuario.toLowerCase().includes("pago");
        if (pideDeudas) {
            const todasLasDeudas = await MovimientoFinanciero.findAll({
                where: { id_abogado, tipo: "ingreso", estado: { [Op.in]: ["pendiente", "parcial"] } },
                include: [{ model: Cuota, as: "cuotas", where: { estado: "pendiente" }, required: false }],
                order: [["createdAt", "DESC"]],
                limit: 15
            });
            let resumenGlobal = [];
            for (const c of todasLasDeudas) {
                let d = Number(c.monto_ars);
                if (c.cuotas && c.cuotas.length > 0) d = c.cuotas.reduce((a, o) => a + Number(o.monto_cuota), 0);
                resumenGlobal.push(`${c.descripcion || c.categoria || 'Cobro'} - $${d} restante`);
            }
            contextoExtraido.deudasGenerales = resumenGlobal.length > 0 ? resumenGlobal : "No hay ninguna deuda pendiente global registrada en el sistema.";
        }

        // E. Analíticas Avanzadas "Llave Maestra" (disparadas por palabras clave agresivas)
        const pideAnaliticas = palabrasClave.some(p => ["finanzas", "ingreso", "ingresos", "egreso", "egresos", "plata", "cobro", "cobros", "gasto", "gastos", "caja", "balance", "jus", "honorario", "honorarios"].includes(p)) || 
                               mensajeUsuario.toLowerCase().includes("cuanta plata") || mensajeUsuario.toLowerCase().includes("cuanto genero");
        
        if (pideAnaliticas) {
            // 1. Configuracion JUS
            const jusNQN = await ConfiguracionEstudio.findByPk("valor_jus_nqn");
            const jusRN = await ConfiguracionEstudio.findByPk("valor_jus_rn");

            // 2. Caja Mes Actual vs Mes Anterior
            const now = new Date();
            const inicioMesActual = new Date(now.getFullYear(), now.getMonth(), 1);
            const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const finMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

            const movsActual = await MovimientoFinanciero.findAll({ where: { updatedAt: { [Op.gte]: inicioMesActual }, estado: "pagado" }, raw: true });
            const movsAnterior = await MovimientoFinanciero.findAll({ where: { updatedAt: { [Op.between]: [inicioMesAnterior, finMesAnterior] }, estado: "pagado" }, raw: true });

            const ingresosActual = movsActual.filter(m => m.tipo === "ingreso").reduce((sum, m) => sum + Number(m.monto_ars), 0);
            const egresosActual = movsActual.filter(m => m.tipo === "egreso").reduce((sum, m) => sum + Number(m.monto_ars), 0);
            const cajaActual = ingresosActual - egresosActual;

            const ingresosAnterior = movsAnterior.filter(m => m.tipo === "ingreso").reduce((sum, m) => sum + Number(m.monto_ars), 0);
            const egresosAnterior = movsAnterior.filter(m => m.tipo === "egreso").reduce((sum, m) => sum + Number(m.monto_ars), 0);
            const cajaAnterior = ingresosAnterior - egresosAnterior;

            // 3. Top Movimientos de este mes
            const ingresosSorted = movsActual.filter(m => m.tipo === "ingreso").sort((a,b) => Number(b.monto_ars) - Number(a.monto_ars));
            const egresosSorted = movsActual.filter(m => m.tipo === "egreso").sort((a,b) => Number(b.monto_ars) - Number(a.monto_ars));
            const topIngreso = ingresosSorted.length > 0 ? ingresosSorted[0] : null;
            const topEgreso = egresosSorted.length > 0 ? egresosSorted[0] : null;

            // 4. Casos
            const totalCasosHistoricos = await Caso.count();
            const casosCerradosHist = await Caso.count({ where: { estado: { [Op.in]: ['cerrado', 'archivado'] } } });

            // 5. Gen por abogado (total)
            const abogadosList = await Abogado.findAll({ raw: true });
            let ingresosPorAbogado = [];
            for (const ab of abogadosList) {
                const movsAb = await MovimientoFinanciero.findAll({ where: { id_abogado: ab.id_abogado, tipo: "ingreso", estado: "pagado" }, raw: true });
                const countCasosAb = await Caso.count({ where: { id_abogado: ab.id_abogado } });
                const sum = movsAb.reduce((a,c) => a + Number(c.monto_ars), 0);
                ingresosPorAbogado.push(`${ab.nombre} ${ab.apellido}: $${sum} ARS generados históricamente en ${countCasosAb} casos asignados.`);
            }

            // 6. Eventos
            const eventosCompletados = await Evento.count({ where: { estado: 'completado' } });
            const eventosPendientes = await Evento.count({ where: { estado: 'pendiente' } });

            contextoExtraido.analiticasAvanzadas = {
                valores_del_jus_actuales: { neuquen: jusNQN ? jusNQN.valor : "No cargado", rio_negro: jusRN ? jusRN.valor : "No cargado" },
                balance_financiero_mes_actual: { ingresos: ingresosActual, egresos: egresosActual, caja_neta: cajaActual },
                balance_financiero_mes_anterior: { ingresos: ingresosAnterior, egresos: egresosAnterior, caja_neta: cajaAnterior },
                tops_del_mes_actual: {
                     ingreso_mas_fuerte: topIngreso ? `${topIngreso.descripcion || topIngreso.categoria} ($${topIngreso.monto_ars})` : "Ninguno",
                     gasto_mas_fuerte: topEgreso ? `${topEgreso.descripcion || topEgreso.categoria} ($${topEgreso.monto_ars})` : "Ninguno"
                },
                estadisticas_generales_casos: { total_historico: totalCasosHistoricos, activos_globales: totalCasosHistoricos - casosCerradosHist, cerrados_o_archivados: casosCerradosHist },
                estadisticas_generales_eventos: { eventos_completados_historia: eventosCompletados, eventos_pendientes_globales: eventosPendientes },
                recaudacion_historica_por_abogado: ingresosPorAbogado
            };
        }

        // 3. Construir el System Prompt Restrictivo
        const systemPrompt = `Eres el Asistente Legal de 'Broki', un software de gestión para abogados en Neuquén y Río Negro, Argentina.
Tu tono debe ser EXTREMADAMENTE NATURAL, profesional y conciso, como un colega humano en la oficina.
REGLA DE ORO DE PERSONALIDAD: NUNCA empieces con "Lo siento", "Hola [nombre]", "Según la información disponible". Responde directo al grano.
REGLA DE DESCONOCIMIENTO: Si el usuario te hace múltiples preguntas, responde detalladamente todas aquellas de las que SÍ tengas información en el bloque "CONTEXTO EXTRAÍDO". Si te pide datos que NO existen en el contexto (ej: balances de otros años, eventos de otros abogados), simplemente agrúpalos sutilmente al final diciendo que aún no tienes reportes profundos de esos temas. NO hagas una lista de todo lo que ignoras. NO repitas tu limitación constantemente. NO pidas perdón.

SOBRE CONSULTAS LEGALES GENERALES:
Si te preguntan sobre leyes o teoría (ej: legítima defensa), responde expertamente con tu conocimiento general del derecho argentino. Si no recuerdas el número exacto del artículo, no lo inventes, explica el concepto jurídico de forma impecable usando doctrina y jurisprudencia implícita.

SOBRE LA GESTIÓN DEL ESTUDIO (DATOS INTERNOS):
Para hablar de clientes, casos, finanzas o agenda, básate ÚNICAMENTE en el bloque "CONTEXTO EXTRAÍDO". Nunca inventes un dato del estudio.
---
DATOS DEL ABOGADO AUTENTICADO:
Nombre: ${abogado.nombre} ${abogado.apellido}
---
CONTEXTO EXTRAÍDO DE LA BASE DE DATOS (Solo úsalo si preguntan por el estudio):
${JSON.stringify(contextoExtraido, null, 2)}
---`;

        const messagesForGroq = [
            { role: "system", content: systemPrompt },
            ...mensajesAnteriores,
            { role: "user", content: mensajeUsuario }
        ];

        // 4. Llamada a la API de Groq
        const completacion = await groq.chat.completions.create({
            messages: messagesForGroq,
            model: "llama-3.3-70b-versatile",
            temperature: 0.2, // Baja temperatura para evitar alucinaciones
            max_tokens: 1024,
        });

        const respuestaGroq = completacion.choices[0]?.message?.content || "No obtuve respuesta del RAG.";

        return respuestaGroq;

    } catch (error) {
        console.error("Error en chat_ia_service procesarMensaje:", error);
        if (error.error && error.error.error && error.error.error.message) {
            throw new Error(`Error de Groq IA: ${error.error.error.message}`);
        } else if (error.message) {
            throw new Error(`Error procesando mensaje: ${error.message}`);
        }
        throw new Error("No se pudo contactar con la IA para procesar tu mensaje.");
    }
};

export default { procesarMensaje };
