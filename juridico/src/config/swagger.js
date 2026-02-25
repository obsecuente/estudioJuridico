// src/config/swagger.js
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Sistema Jurídico — API",
            version: "1.0.0",
            description:
                "API REST del sistema de gestión de estudio jurídico. " +
                "Incluye módulos de Finanzas (JUS, cuotas, gastos recurrentes), " +
                "Tareas, Clientes, Casos y Calculadora de Plazos.",
            contact: {
                name: "Estudio Jurídico",
            },
        },
        servers: [
            {
                url: "http://localhost:3000/api",
                description: "Servidor de desarrollo",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Token JWT obtenido desde POST /api/auth/login",
                },
            },
            schemas: {
                // ═══ FINANZAS ═══
                MovimientoFinanciero: {
                    type: "object",
                    properties: {
                        id_movimiento: { type: "integer", example: 1 },
                        tipo: { type: "string", enum: ["ingreso", "egreso"], example: "ingreso" },
                        categoria: { type: "string", example: "apertura_carpeta" },
                        descripcion: { type: "string", example: "Apertura de carpeta - 3 JUS" },
                        monto_ars: { type: "number", format: "decimal", example: 240000 },
                        monto_jus: { type: "number", format: "decimal", nullable: true, example: 3 },
                        valor_jus_referencia: { type: "number", format: "decimal", nullable: true, example: 80000 },
                        estado: {
                            type: "string",
                            enum: ["pendiente", "pagado", "parcial", "anulado"],
                            example: "pendiente",
                        },
                        id_caso: { type: "integer", nullable: true, example: 5 },
                        id_cliente: { type: "integer", nullable: true, example: 12 },
                        id_abogado: { type: "integer", nullable: true, example: 1 },
                        es_plan_cuotas: { type: "boolean", example: false },
                        cantidad_cuotas: { type: "integer", nullable: true, example: null },
                    },
                },
                CrearMovimientoInput: {
                    type: "object",
                    required: ["tipo", "categoria"],
                    properties: {
                        tipo: { type: "string", enum: ["ingreso", "egreso"], example: "ingreso" },
                        categoria: { type: "string", example: "honorarios" },
                        descripcion: { type: "string", example: "Honorarios caso González" },
                        monto_ars: { type: "number", example: 150000 },
                        monto_jus: { type: "number", example: 3, description: "Si se indica, monto_ars se calcula automáticamente" },
                        provincia: { type: "string", enum: ["NQN", "RN"], default: "NQN" },
                        id_caso: { type: "integer", example: 5 },
                        id_cliente: { type: "integer", example: 12 },
                        estado: { type: "string", enum: ["pendiente", "pagado"], default: "pendiente" },
                        plan_cuotas: {
                            type: "object",
                            nullable: true,
                            properties: {
                                cantidad: { type: "integer", example: 3 },
                                fecha_primera: { type: "string", format: "date", example: "2026-03-01" },
                            },
                        },
                    },
                },
                DashboardFinanciero: {
                    type: "object",
                    properties: {
                        caja: {
                            type: "object",
                            properties: {
                                percibido: { type: "number", example: 450000 },
                                egresos: { type: "number", example: 120000 },
                                neto: { type: "number", example: 330000 },
                            },
                        },
                        cartera: {
                            type: "object",
                            properties: {
                                pendiente_ars_fijo: { type: "number", example: 250000 },
                                pendiente_jus: { type: "number", example: 15 },
                                pendiente_jus_actualizado: { type: "number", example: 1200000 },
                                total_pendiente_actualizado: { type: "number", example: 1450000 },
                            },
                        },
                        indicadores: {
                            type: "object",
                            properties: {
                                ratio_cobrabilidad: { type: "number", example: 31.03 },
                                valor_jus_actual: { type: "number", example: 80000 },
                            },
                        },
                    },
                },
                // ═══ TAREAS ═══
                Tarea: {
                    type: "object",
                    properties: {
                        id_tarea: { type: "integer", example: 1 },
                        descripcion: { type: "string", example: "Preparar escrito de demanda" },
                        completada: { type: "boolean", example: false },
                        prioridad: { type: "string", enum: ["baja", "media", "alta"], example: "alta" },
                        fecha_limite: { type: "string", format: "date", nullable: true, example: "2026-03-15" },
                        id_abogado: { type: "integer", example: 1 },
                        id_caso: { type: "integer", nullable: true, example: 5 },
                        categoria: { type: "string", nullable: true, example: "escrito" },
                        en_plazo_gracia: { type: "boolean", example: false },
                        hora_limite: { type: "string", nullable: true, example: "09:30:00" },
                    },
                },
                CrearTareaInput: {
                    type: "object",
                    required: ["descripcion"],
                    properties: {
                        descripcion: { type: "string", example: "Redactar contestación de demanda" },
                        prioridad: { type: "string", enum: ["baja", "media", "alta"], default: "media" },
                        fecha_limite: { type: "string", format: "date", example: "2026-03-20" },
                        id_caso: { type: "integer", example: 5 },
                        categoria: { type: "string", example: "escrito" },
                        hora_limite: { type: "string", example: "09:30" },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        error: { type: "string", example: "Mensaje de error descriptivo" },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        // ═══ PATHS INLINE ═══
        paths: {
            // ─── FINANZAS ───
            "/finanzas": {
                post: {
                    tags: ["Finanzas"],
                    summary: "Crear movimiento financiero",
                    description: "Crea un ingreso o egreso. Si se especifica monto_jus, el monto en ARS se calcula automáticamente con el valor JUS actual.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CrearMovimientoInput" },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "Movimiento creado",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean", example: true },
                                            data: { $ref: "#/components/schemas/MovimientoFinanciero" },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: "Error de validación", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
                    },
                },
                get: {
                    tags: ["Finanzas"],
                    summary: "Listar movimientos con filtros",
                    parameters: [
                        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
                        { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
                        { name: "tipo", in: "query", schema: { type: "string", enum: ["ingreso", "egreso"] } },
                        { name: "estado", in: "query", schema: { type: "string", enum: ["pendiente", "pagado", "parcial", "anulado"] } },
                        { name: "id_caso", in: "query", schema: { type: "integer" } },
                        { name: "categoria", in: "query", schema: { type: "string" } },
                    ],
                    responses: {
                        200: { description: "Lista paginada de movimientos" },
                    },
                },
            },
            "/finanzas/dashboard": {
                get: {
                    tags: ["Finanzas"],
                    summary: "Dashboard financiero",
                    description: "Resumen con caja mensual, cartera de deuda actualizada por JUS, y KPIs.",
                    parameters: [
                        { name: "provincia", in: "query", schema: { type: "string", enum: ["NQN", "RN"], default: "NQN" } },
                        { name: "id_abogado", in: "query", schema: { type: "integer" }, description: "Solo admin: filtrar por abogado" },
                    ],
                    responses: {
                        200: {
                            description: "Dashboard financiero completo",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean" },
                                            data: { $ref: "#/components/schemas/DashboardFinanciero" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            "/finanzas/{id}/cobrar": {
                patch: {
                    tags: ["Finanzas"],
                    summary: "Marcar ingreso como cobrado",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        fecha_cobro: { type: "string", format: "date", example: "2026-02-18" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Ingreso marcado como cobrado" },
                        400: { description: "Error (ya cobrado, tiene cuotas, etc.)" },
                    },
                },
            },
            "/finanzas/{id}": {
                delete: {
                    tags: ["Finanzas"],
                    summary: "Eliminar movimiento",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    responses: {
                        200: { description: "Movimiento eliminado" },
                        404: { description: "Movimiento no encontrado" },
                    },
                },
            },
            // ─── TAREAS ───
            "/tareas": {
                post: {
                    tags: ["Tareas"],
                    summary: "Crear tarea",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CrearTareaInput" },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: "Tarea creada",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            success: { type: "boolean" },
                                            data: { $ref: "#/components/schemas/Tarea" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                get: {
                    tags: ["Tareas"],
                    summary: "Listar tareas",
                    parameters: [
                        { name: "completada", in: "query", schema: { type: "boolean" } },
                        { name: "prioridad", in: "query", schema: { type: "string", enum: ["baja", "media", "alta"] } },
                        { name: "fecha", in: "query", schema: { type: "string", format: "date" }, description: "Filtrar por fecha (Mi Día)" },
                    ],
                    responses: {
                        200: { description: "Lista de tareas" },
                    },
                },
            },
            "/tareas/{id}": {
                patch: {
                    tags: ["Tareas"],
                    summary: "Actualizar tarea (completar, editar, etc.)",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        completada: { type: "boolean", example: true },
                                        descripcion: { type: "string" },
                                        prioridad: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: "Tarea actualizada" },
                    },
                },
                delete: {
                    tags: ["Tareas"],
                    summary: "Eliminar tarea",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                    responses: {
                        200: { description: "Tarea eliminada" },
                    },
                },
            },
        },
    },
    apis: [], // No usamos anotaciones JSDoc, todo inline arriba
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Monta Swagger UI en el Express app
 * @param {import('express').Express} app
 */
export const setupSwagger = (app) => {
    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customCss: ".swagger-ui .topbar { display: none }",
            customSiteTitle: "Sistema Jurídico — API Docs",
            swaggerOptions: {
                persistAuthorization: true,
            },
        })
    );

    // Endpoint para obtener el JSON spec
    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
};

export default { setupSwagger, swaggerSpec };
