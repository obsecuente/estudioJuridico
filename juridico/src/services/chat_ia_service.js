import { Groq } from "groq-sdk";
import {
  Abogado, Cliente, Caso, Tarea,
  MovimientoFinanciero, Cuota,
  HistorialCaso, Documento, Evento, Vencimiento
} from "../models/index.js";
import { Op } from "sequelize";

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  CHAT IA GENERAL — Arquitectura de Function Calling (Tools)  ║
 * ╠═══════════════════════════════════════════════════════════════╣
 * ║  Proveedor actual: Groq (gratuito) con llama-3.3-70b        ║
 * ║                                                               ║
 * ║  PARA MIGRAR A OTRO PROVEEDOR:                               ║
 * ║                                                               ║
 * ║  1. OpenAI (GPT-4o / GPT-4o-mini):                          ║
 * ║     - npm install openai                                      ║
 * ║     - import OpenAI from "openai"                             ║
 * ║     - const client = new OpenAI({ apiKey: OPENAI_API_KEY })  ║
 * ║     - client.chat.completions.create({ model, messages, tools })║
 * ║     - El formato de tools y tool_calls es IDÉNTICO (OpenAI   ║
 * ║       compatible). Solo cambiás el client y el model.         ║
 * ║                                                               ║
 * ║  2. Anthropic (Claude 3.5 Sonnet / Claude 4):                ║
 * ║     - npm install @anthropic-ai/sdk                           ║
 * ║     - import Anthropic from "@anthropic-ai/sdk"               ║
 * ║     - const client = new Anthropic({ apiKey: ANTHROPIC_KEY })║
 * ║     - client.messages.create({ model, system, messages, tools })║
 * ║     - IMPORTANTE: Anthropic usa un formato de tools distinto: ║
 * ║       { name, description, input_schema } en vez de           ║
 * ║       { type:"function", function: { name, parameters } }    ║
 * ║     - Los tool_calls vienen en content con type:"tool_use"    ║
 * ║       y se responden con role:"user" + type:"tool_result"     ║
 * ║                                                               ║
 * ║  3. Google Gemini:                                            ║
 * ║     - npm install @google/generative-ai                       ║
 * ║     - Usa functionDeclarations en vez de tools                ║
 * ║     - Los tool_calls vienen como functionCall en parts        ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

// ─── Inicialización del cliente IA ───────────────────────────────
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const MODEL = "llama-3.3-70b-versatile";
const MAX_TOOL_ROUNDS = 3; // evitar loops infinitos de tool calls

// ═══════════════════════════════════════════════════════════════
// 1. DEFINICIÓN DE TOOLS (formato OpenAI-compatible)
// ═══════════════════════════════════════════════════════════════

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "buscar_cliente_por_nombre",
      description:
        "Busca clientes del estudio jurídico por nombre o apellido. Retorna datos de contacto y un resumen básico. Usala cuando el usuario pregunte por un cliente específico.",
      parameters: {
        type: "object",
        properties: {
          nombre: {
            type: "string",
            description:
              "Nombre, apellido o fragmento del nombre del cliente a buscar",
          },
        },
        required: ["nombre"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_casos_cliente",
      description:
        "Obtiene todos los casos/expedientes de un cliente específico, incluyendo estado, jurisdicción, etapa y saldo pendiente de cobro. Usala después de buscar un cliente para ver sus casos.",
      parameters: {
        type: "object",
        properties: {
          id_cliente: {
            type: "number",
            description: "ID del cliente obtenido de buscar_cliente_por_nombre",
          },
        },
        required: ["id_cliente"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_historial_caso",
      description:
        "Obtiene el historial completo de eventos de un caso/expediente: notas, cambios de etapa, documentos subidos, movimientos financieros. Ordenado por fecha descendente (más reciente primero). Usala cuando pregunten qué pasó en un caso o cuál fue la última novedad.",
      parameters: {
        type: "object",
        properties: {
          id_caso: {
            type: "number",
            description: "ID del caso/expediente",
          },
        },
        required: ["id_caso"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_documentos_caso",
      description:
        "Lista los documentos subidos a un caso/expediente (contratos, escritos, evidencias). Ordenados por fecha descendente. Usala cuando pregunten por documentos, archivos o el último escrito de un caso.",
      parameters: {
        type: "object",
        properties: {
          id_caso: {
            type: "number",
            description: "ID del caso/expediente",
          },
        },
        required: ["id_caso"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_tareas_pendientes",
      description:
        "Obtiene las tareas pendientes (no completadas) del abogado autenticado, ordenadas por urgencia (fecha de vencimiento ascendente). Usala cuando pregunten qué tienen que hacer, su agenda, pendientes o tareas.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_resumen_estudio",
      description:
        "Obtiene un panorama general del estudio: total de clientes, casos abiertos, ingresos del mes, próximos vencimientos y eventos. Usala cuando pregunten cómo está el estudio, un resumen general, o datos financieros globales.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_vencimientos_proximos",
      description:
        "Obtiene los próximos vencimientos procesales pendientes (plazos de contestación, apelación, etc.) del abogado autenticado. Ordenados por fecha ascendente. Usala cuando pregunten por plazos, vencimientos, qué vence pronto o deadlines.",
      parameters: {
        type: "object",
        properties: {
          dias: {
            type: "number",
            description: "Cantidad de días hacia adelante para buscar vencimientos. Default: 30",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "obtener_eventos_proximos",
      description:
        "Obtiene los próximos eventos/audiencias/reuniones pendientes del abogado autenticado. Ordenados por fecha ascendente. Usala cuando pregunten por audiencias, reuniones, agenda o eventos próximos.",
      parameters: {
        type: "object",
        properties: {
          dias: {
            type: "number",
            description: "Cantidad de días hacia adelante para buscar eventos. Default: 30",
          },
        },
        required: [],
      },
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// 2. EJECUTORES DE TOOLS (Queries a Sequelize)
//    Cada función recibe (args, id_abogado) y retorna datos JSON
// ═══════════════════════════════════════════════════════════════

const TOOL_EXECUTORS = {
  /**
   * Busca clientes por nombre/apellido.
   * Seguridad: filtra clientes que tienen al menos un caso del abogado autenticado.
   */
  buscar_cliente_por_nombre: async ({ nombre }, id_abogado) => {
    const palabras = nombre
      .toLowerCase()
      .replace(/[?,¿!¡.\n]/g, "")
      .split(/\s+/)
      .filter((p) => p.length > 1);

    if (palabras.length === 0) return { clientes: [], mensaje: "Nombre de búsqueda vacío" };

    const condiciones = palabras.map((p) => ({
      [Op.or]: [
        { nombre: { [Op.like]: `%${p}%` } },
        { apellido: { [Op.like]: `%${p}%` } },
      ],
    }));

    // Obtener IDs de clientes que tienen casos del abogado autenticado
    const casosDelAbogado = await Caso.findAll({
      where: { id_abogado },
      attributes: ["id_cliente"],
      raw: true,
    });
    const idsClientesPermitidos = [...new Set(casosDelAbogado.map((c) => c.id_cliente))];

    if (idsClientesPermitidos.length === 0) {
      return { clientes: [], mensaje: "No tenés clientes con casos asignados" };
    }

    const clientes = await Cliente.findAll({
      where: {
        id_cliente: { [Op.in]: idsClientesPermitidos },
        [Op.and]: [{ [Op.or]: condiciones }],
      },
      attributes: ["id_cliente", "nombre", "apellido", "dni", "cuit", "telefono", "email", "tipo_persona"],
      limit: 5,
    });

    return {
      resultados: clientes.length,
      clientes: clientes.map((c) => ({
        id_cliente: c.id_cliente,
        nombre_completo: `${c.nombre} ${c.apellido}`,
        dni: c.dni,
        cuit: c.cuit,
        telefono: c.telefono,
        email: c.email,
        tipo: c.tipo_persona,
      })),
    };
  },

  /**
   * Obtiene casos de un cliente con saldo pendiente.
   * Seguridad: solo devuelve casos del abogado autenticado.
   */
  obtener_casos_cliente: async ({ id_cliente }, id_abogado) => {
    const casos = await Caso.findAll({
      where: { id_cliente, id_abogado },
      include: [{ model: Cliente, as: "cliente", attributes: ["nombre", "apellido"] }],
      order: [["id_caso", "DESC"]],
      limit: 15,
    });

    if (casos.length === 0) {
      return { casos: [], mensaje: "No se encontraron casos para este cliente" };
    }

    // Calcular saldo pendiente por caso
    const resultado = [];
    for (const caso of casos) {
      const cobrosPendientes = await MovimientoFinanciero.findAll({
        where: {
          id_caso: caso.id_caso,
          tipo: "ingreso",
          estado: { [Op.in]: ["pendiente", "parcial"] },
        },
        include: [{ model: Cuota, as: "cuotas", where: { estado: "pendiente" }, required: false }],
      });

      let saldoPendiente = 0;
      for (const cobro of cobrosPendientes) {
        if (cobro.cuotas && cobro.cuotas.length > 0) {
          saldoPendiente += cobro.cuotas.reduce((a, c) => a + Number(c.monto_cuota), 0);
        } else {
          saldoPendiente += Number(cobro.monto_ars);
        }
      }

      resultado.push({
        id_caso: caso.id_caso,
        descripcion: caso.descripcion,
        expediente: caso.numero_expediente || "Sin asignar",
        estado: caso.estado,
        jurisdiccion: caso.jurisdiccion || "N/A",
        fuero: caso.fuero || "N/A",
        instancia: caso.instancia || "N/A",
        saldo_pendiente_ars: saldoPendiente,
        cliente: caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido}` : "N/A",
      });
    }

    return { total: resultado.length, casos: resultado };
  },

  /**
   * Obtiene el historial de eventos de un caso.
    * Seguridad: verifica que el caso pertenezca al abogado.
   */
  obtener_historial_caso: async ({ id_caso }, id_abogado) => {
    // Verificar propiedad del caso
    const caso = await Caso.findOne({
      where: { id_caso, id_abogado },
      include: [{ model: Cliente, as: "cliente", attributes: ["nombre", "apellido"] }],
    });
    if (!caso) return { error: "Caso no encontrado o no tenés acceso" };

    const historial = await HistorialCaso.findAll({
      where: { id_caso },
      order: [["fecha_registro", "DESC"]],
      limit: 30,
    });

    return {
      caso: {
        id_caso: caso.id_caso,
        descripcion: caso.descripcion,
        expediente: caso.numero_expediente,
        estado: caso.estado,
        cliente: caso.cliente ? `${caso.cliente.nombre} ${caso.cliente.apellido}` : "N/A",
      },
      total_eventos: historial.length,
      eventos: historial.map((h) => ({
        tipo: h.tipo_evento,
        descripcion: h.descripcion,
        fecha: h.fecha_registro,
        importante: h.es_importante,
      })),
    };
  },

  /**
   * Obtiene documentos subidos a un caso.
   * Seguridad: verifica que el caso pertenezca al abogado.
   */
  obtener_documentos_caso: async ({ id_caso }, id_abogado) => {
    const caso = await Caso.findOne({ where: { id_caso, id_abogado } });
    if (!caso) return { error: "Caso no encontrado o no tenés acceso" };

    const documentos = await Documento.findAll({
      where: { id_caso },
      attributes: ["id_documento", "nombre_archivo", "tipo_mime", "tamanio_bytes"],
      order: [["id_documento", "DESC"]],
      limit: 20,
    });

    return {
      caso: { id_caso: caso.id_caso, descripcion: caso.descripcion },
      total: documentos.length,
      documentos: documentos.map((d) => ({
        id_documento: d.id_documento,
        nombre: d.nombre_archivo,
        tipo: d.tipo_mime || "desconocido",
        tamanio_kb: d.tamanio_bytes ? Math.round(d.tamanio_bytes / 1024) : null,
      })),
    };
  },

  /**
   * Obtiene tareas pendientes del abogado autenticado.
   * El id_abogado se inyecta automáticamente del token (no es parámetro del modelo).
   */
  obtener_tareas_pendientes: async (_args, id_abogado) => {
    const tareas = await Tarea.findAll({
      where: { id_abogado, completada: false },
      include: [{ model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] }],
      order: [["fecha_limite", "ASC"]],
      limit: 20,
    });

    return {
      total: tareas.length,
      tareas: tareas.map((t) => ({
        id_tarea: t.id_tarea,
        descripcion: t.descripcion,
        prioridad: t.prioridad,
        fecha_limite: t.fecha_limite || "Sin fecha",
        categoria: t.categoria || "General",
        caso: t.caso ? `#${t.caso.id_caso} - ${t.caso.descripcion}` : "Sin caso",
        en_plazo_gracia: t.en_plazo_gracia,
      })),
    };
  },

  /**
   * Obtiene un resumen general del estudio para el abogado autenticado.
   */
  obtener_resumen_estudio: async (_args, id_abogado) => {
    const totalCasosActivos = await Caso.count({ where: { id_abogado, estado: "abierto" } });
    const totalCasosCerrados = await Caso.count({ where: { id_abogado, estado: { [Op.in]: ["cerrado", "archivado"] } } });

    // Clientes (a través de los casos del abogado)
    const casosAbogado = await Caso.findAll({ where: { id_abogado }, attributes: ["id_cliente"], raw: true });
    const clientesUnicos = new Set(casosAbogado.map((c) => c.id_cliente));

    // Ingresos del mes
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ingresosMes = await MovimientoFinanciero.findAll({
      where: { id_abogado, tipo: "ingreso", estado: "pagado", updatedAt: { [Op.gte]: inicioMes } },
      raw: true,
    });
    const totalIngresosMes = ingresosMes.reduce((a, c) => a + Number(c.monto_ars), 0);

    // Egresos del mes
    const egresosMes = await MovimientoFinanciero.findAll({
      where: { id_abogado, tipo: "egreso", estado: "pagado", updatedAt: { [Op.gte]: inicioMes } },
      raw: true,
    });
    const totalEgresosMes = egresosMes.reduce((a, c) => a + Number(c.monto_ars), 0);

    // Vencimientos próximos
    const vencimientos = await Vencimiento.findAll({
      where: { id_abogado, estado: "pendiente" },
      order: [["fecha_limite", "ASC"]],
      limit: 5,
    });

    // Eventos próximos
    const eventos = await Evento.findAll({
      where: { id_abogado, estado: "pendiente" },
      order: [["fecha_inicio", "ASC"]],
      limit: 5,
    });

    // Tareas pendientes count
    const tareasPendientes = await Tarea.count({ where: { id_abogado, completada: false } });

    return {
      clientes_con_casos: clientesUnicos.size,
      casos_abiertos: totalCasosActivos,
      casos_cerrados: totalCasosCerrados,
      tareas_pendientes: tareasPendientes,
      finanzas_mes_actual: {
        ingresos: totalIngresosMes,
        egresos: totalEgresosMes,
        caja_neta: totalIngresosMes - totalEgresosMes,
      },
      proximos_vencimientos: vencimientos.map((v) => ({
        titulo: v.titulo,
        fecha: v.fecha_limite,
      })),
      proximos_eventos: eventos.map((e) => ({
        titulo: e.titulo,
        fecha: e.fecha_inicio,
      })),
    };
  },

  /**
   * Obtiene vencimientos próximos del abogado.
   */
  obtener_vencimientos_proximos: async ({ dias = 30 }, id_abogado) => {
    const hasta = new Date();
    hasta.setDate(hasta.getDate() + dias);

    const vencimientos = await Vencimiento.findAll({
      where: {
        id_abogado,
        estado: "pendiente",
        fecha_limite: { [Op.between]: [new Date(), hasta] },
      },
      include: [
        { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
      ],
      order: [["fecha_limite", "ASC"]],
      limit: 20,
    });

    return {
      total: vencimientos.length,
      periodo: `Próximos ${dias} días`,
      vencimientos: vencimientos.map((v) => ({
        id_vencimiento: v.id_vencimiento,
        titulo: v.titulo,
        tipo: v.tipo_vencimiento,
        prioridad: v.prioridad,
        fecha_limite: v.fecha_limite,
        caso: v.caso ? `#${v.caso.id_caso} - ${v.caso.descripcion}` : "Sin caso",
      })),
    };
  },

  /**
   * Obtiene eventos próximos del abogado.
   */
  obtener_eventos_proximos: async ({ dias = 30 }, id_abogado) => {
    const hasta = new Date();
    hasta.setDate(hasta.getDate() + dias);

    const eventos = await Evento.findAll({
      where: {
        id_abogado,
        estado: "pendiente",
        fecha_inicio: { [Op.between]: [new Date(), hasta] },
      },
      include: [
        { model: Caso, as: "caso", attributes: ["id_caso", "descripcion"] },
      ],
      order: [["fecha_inicio", "ASC"]],
      limit: 20,
    });

    return {
      total: eventos.length,
      periodo: `Próximos ${dias} días`,
      eventos: eventos.map((e) => ({
        id_evento: e.id_evento,
        titulo: e.titulo,
        tipo: e.tipo,
        fecha: e.fecha_inicio,
        hora: e.hora_inicio ? e.hora_inicio.substring(0, 5) : null,
        ubicacion: e.ubicacion,
        caso: e.caso ? `#${e.caso.id_caso} - ${e.caso.descripcion}` : "Sin caso",
      })),
    };
  },
};

// ═══════════════════════════════════════════════════════════════
// 3. SYSTEM PROMPT — Restrictivo + Instrucciones de Tools
// ═══════════════════════════════════════════════════════════════

const buildSystemPrompt = (abogado) => `Eres el Asistente Legal de 'Broki', un software de gestión para abogados en Neuquén y Río Negro, Argentina.

PERSONALIDAD:
- Tono NATURAL, profesional y conciso, como un colega de la oficina.
- NUNCA empieces con "Lo siento", "Hola [nombre]", "Según la información disponible".
- Respondé directo al grano, sin rodeos.

REGLA DE CERO ALUCINACIONES (CRÍTICA):
- Para datos del estudio (clientes, casos, finanzas, documentos, tareas): OBLIGATORIO usar las tools disponibles. NUNCA inventes datos.
- Si una tool retorna error o datos vacíos, informalo honestamente sin inventar alternativas.
- Si no sabés un dato del estudio, decí que no lo encontrás y sugerí cómo buscarlo.

CONSULTAS LEGALES GENERALES:
- SI te preguntan sobre leyes, doctrina o teoría jurídica argentina, respondé con tu conocimiento general.
- Si no recordás el número exacto de un artículo, explicá el concepto sin inventar la cita.
- Siempre aclarás que tu respuesta es orientativa y no reemplaza el criterio profesional.

RESTRICCIÓN DE DOMINIO:
- Si te preguntan algo completamente fuera del ámbito jurídico o del estudio (ej: recetas de cocina, código de programación), rechazá amablemente y redirigí al tema legal/gestión.

USO DE TOOLS:
- Cuando el usuario pregunte por datos específicos del estudio, usá las tools para consultar la base de datos en tiempo real.
- Podés encadenar tools: primero buscar un cliente, luego sus casos, luego el historial de un caso.
- Siempre que muestres datos numéricos (montos), formateá en pesos argentinos con separador de miles.

DATOS DEL ABOGADO AUTENTICADO:
- Nombre: ${abogado.nombre} ${abogado.apellido}
- ID: ${abogado.id_abogado}
- Las tools de tareas y resumen del estudio se ejecutan automáticamente sobre TU cuenta.`;

// ═══════════════════════════════════════════════════════════════
// 4. TOOL CALL LOOP — El corazón de la arquitectura
// ═══════════════════════════════════════════════════════════════

/**
 * Ejecuta una tool call individual.
 * @returns {string} JSON stringificado del resultado
 */
const ejecutarToolCall = async (toolCall, id_abogado) => {
  const fnName = toolCall.function.name;
  let args = {};

  try {
    args = JSON.parse(toolCall.function.arguments || "{}");
  } catch {
    return JSON.stringify({ error: "Argumentos inválidos en tool call" });
  }

  const executor = TOOL_EXECUTORS[fnName];
  if (!executor) {
    return JSON.stringify({ error: `Tool "${fnName}" no implementada` });
  }

  try {
    console.log(`🔧 Tool Call: ${fnName}(${JSON.stringify(args)})`);
    const resultado = await executor(args, id_abogado);
    console.log(`✅ Tool "${fnName}" → ${JSON.stringify(resultado).length} chars`);
    return JSON.stringify(resultado);
  } catch (err) {
    console.error(`❌ Tool "${fnName}" error:`, err.message);
    return JSON.stringify({ error: `Error ejecutando ${fnName}: ${err.message}` });
  }
};

// ═══════════════════════════════════════════════════════════════
// 5. FUNCIÓN PRINCIPAL — procesarMensaje
// ═══════════════════════════════════════════════════════════════

export const procesarMensaje = async (mensajesAnteriores, mensajeUsuario, id_abogado) => {
  if (!groq) {
    throw new Error("GROQ_API_KEY no está configurada en .env");
  }

  try {
    // 1. Obtener datos del abogado autenticado
    const abogado = await Abogado.findByPk(id_abogado);
    if (!abogado) throw new Error("Abogado no encontrado");

    // 2. Construir la conversación
    const messages = [
      { role: "system", content: buildSystemPrompt(abogado) },
      ...mensajesAnteriores,
      { role: "user", content: mensajeUsuario },
    ];

    // 3. Tool Call Loop
    let ronda = 0;

    while (ronda < MAX_TOOL_ROUNDS) {
      ronda++;
      console.log(`\n🤖 Chat IA — Ronda ${ronda}/${MAX_TOOL_ROUNDS}`);

      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 1536,
      });

      const responseMsg = completion.choices[0]?.message;

      if (!responseMsg) {
        throw new Error("No se obtuvo respuesta del modelo");
      }

      // ¿El modelo quiere llamar tools?
      if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
        console.log(`🔧 Modelo solicitó ${responseMsg.tool_calls.length} tool(s)`);

        // Agregar el mensaje del asistente con los tool_calls
        messages.push(responseMsg);

        // Ejecutar cada tool y agregar los resultados
        for (const toolCall of responseMsg.tool_calls) {
          const resultado = await ejecutarToolCall(toolCall, id_abogado);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultado,
          });
        }

        // Volver al inicio del loop para que el modelo procese los resultados
        continue;
      }

      // El modelo respondió sin pedir tools → respuesta final
      const respuesta = responseMsg.content || "No obtuve respuesta.";
      console.log(`✅ Chat IA — Respuesta final (${respuesta.length} chars, ${ronda} ronda(s))`);
      return respuesta;
    }

    // Si se agotan las rondas, hacer una última llamada SIN tools
    console.log("⚠️ Se alcanzaron las rondas máximas de tools. Generando respuesta final...");
    const finalCompletion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1536,
    });

    return finalCompletion.choices[0]?.message?.content || "No pude completar la consulta.";

  } catch (error) {
    console.error("❌ Error en chat_ia_service procesarMensaje:", error);

    if (error.error?.error?.message) {
      throw new Error(`Error de Groq IA: ${error.error.error.message}`);
    } else if (error.message) {
      throw new Error(`Error procesando mensaje: ${error.message}`);
    }
    throw new Error("No se pudo contactar con la IA para procesar tu mensaje.");
  }
};

export default { procesarMensaje };
