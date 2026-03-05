// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { testConnection, syncDatabase } from "./src/config/database.js";
import logger from "./src/config/logger.js"; // NUEVO
import httpLogger from "./src/middleware/loggerMiddleware.js"; // NUEVO
import iaRoutes from "./src/routes/ia.routes.js";
import eventosRoutes from "./src/routes/eventos.routes.js";
import vencimientosRoutes from "./src/routes/vencimientos.routes.js";
import calculadoraRoutes from "./src/routes/calculadora.routes.js";
// Importar modelos para establecer relaciones
import "./src/models/index.js";

// Importación de rutas CRUD
import clientesRoutes from "./src/routes/clientes.routes.js";
import consultasRoutes from "./src/routes/consultas.routes.js";
import casosRoutes from "./src/routes/casos.routes.js";
import documentosRoutes from "./src/routes/documentos.routes.js";
import abogadosRoutes from "./src/routes/abogados.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import auditoriaRoutes from "./src/routes/auditoria.routes.js";
import finanzasRoutes from "./src/routes/finanzas.routes.js";
import configuracionRoutes from "./src/routes/configuracion.routes.js";
import tareasRoutes from "./src/routes/tareas.routes.js";
import gastosRecurrentesRoutes from "./src/routes/gastos_recurrentes.routes.js";
import cierresRoutes from "./src/routes/cierres.routes.js";
import etiquetasRoutes from "./src/routes/etiquetas.routes.js";
import etapasLegalesRoutes from "./src/routes/etapas_legales.routes.js";
import gastosRecurrentesService from "./src/services/gastos_recurrentes_service.js";
import { setupSwagger } from "./src/config/swagger.js";

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad — eximir Swagger de CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 0 : 1000, // Sin límite en test, 1000 en producción
  skip: () => process.env.NODE_ENV === "test", // Saltar completamente en modo test
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de Express (Configurar ANTES de las rutas)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Middleware de logging HTTP
app.use(httpLogger);

// Aplicar Rate Limit después de los parsers básicos pero antes de las rutas de datos
app.use("/api/", limiter);

// Rutas
app.use("/api/ia", iaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/casos", casosRoutes);
app.use("/api/documentos", documentosRoutes);
app.use("/api/abogados", abogadosRoutes);
app.use("/api/auditoria", auditoriaRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/vencimientos", vencimientosRoutes);
app.use("/api/calculadora", calculadoraRoutes);
app.use("/api/finanzas", finanzasRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/cierres", cierresRoutes);
app.use("/api/tareas", tareasRoutes);
app.use("/api/finanzas/gastos-recurrentes", gastosRecurrentesRoutes);
app.use("/api/etiquetas", etiquetasRoutes);
app.use("/api/etapas-legales", etapasLegalesRoutes);

// Swagger API Docs (antes de 404 handler)
setupSwagger(app);

// Ruta de health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Manejo de errores
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  logger.error("Error no manejado", {
    // NUEVO - usar logger
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
  });

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Iniciar servidor
import iniciarJobLimpieza from "./src/jobs/limpieza_diaria.js";
import iniciarJobCierreMensual from "./src/jobs/cierre_mensual.js";
import seedEtapasLegales from "./src/seeds/seed_etapas_legales.js";

const startServer = async () => {
  try {
    logger.info("Conectando a MySQL..."); // NUEVO
    const connected = await testConnection();

    if (!connected) {
      logger.error("No se pudo conectar a la base de datos"); // NUEVO
      process.exit(1);
    }

    logger.info("Sincronizando modelos..."); // NUEVO
    await syncDatabase();

    // Seed de etapas legales + alter de Caso/Documento (Fase 2)
    try {
      const seedResult = await seedEtapasLegales();
      if (seedResult.created > 0) {
        logger.info(`Seed etapas legales: ${seedResult.created} creadas de ${seedResult.total}`);
      }
    } catch (err) {
      logger.error("Error en seed etapas legales (no detiene arranque):", { error: err.message });
    }

    // Generar movimientos mensuales de gastos recurrentes (antes de listen)
    try {
      const resultado = await gastosRecurrentesService.generarMovimientosMensuales();
      logger.info(`Gastos recurrentes: ${resultado.message}`);
    } catch (err) {
      logger.error("Error al generar gastos recurrentes:", { error: err.message });
    }

    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en http://localhost:${PORT}`); // NUEVO
      logger.info(`Entorno: ${process.env.NODE_ENV || "development"}`); // NUEVO
      logger.info(`Base de datos: ${process.env.DB_NAME}`); // NUEVO
    });
  } catch (error) {
    logger.error("Error al iniciar el servidor", {
      // NUEVO
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

process.on("SIGINT", async () => {
  logger.info("Cerrando servidor..."); // NUEVO
  process.exit(0);
});

export default app;
