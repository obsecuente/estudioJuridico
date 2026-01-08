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
// Importar modelos para establecer relaciones
import "./src/models/index.js";

// Importación de rutas CRUD
import clientesRoutes from "./src/routes/clientes.routes.js";
import consultasRoutes from "./src/routes/consultas.routes.js";
import casosRoutes from "./src/routes/casos.routes.js";
import documentosRoutes from "./src/routes/documentos.routes.js";
import abogadosRoutes from "./src/routes/abogados.routes.js";
import authRoutes from "./src/routes/auth.routes.js";

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);
app.use("/api/ia", iaRoutes);
// Middlewares de Express
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware de logging HTTP (NUEVO - agregar AQUÍ)
app.use(httpLogger);

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/casos", casosRoutes);
app.use("/api/documentos", documentosRoutes);
app.use("/api/abogados", abogadosRoutes);

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

startServer();

if (process.env.NODE_ENV !== "test") {
  startServer();
}

process.on("SIGINT", async () => {
  logger.info("Cerrando servidor..."); // NUEVO
  process.exit(0);
});

export default app;
