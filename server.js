// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { testConnection, syncDatabase } from "./src/config/database.js";
import path from "path";

// Importar modelos para establecer relaciones
import "./src/models/index.js";

// Importacion de rutas CRUD
import clientesRoutes from "./src/routes/clientes.routes.js";
import consultasRoutes from "./src/routes/consultas.routes.js";
import abogadosRoutes from "./src/routes/abogados.routes.js";
import casosRoutes from "./src/routes/casos.routes.js";
import documentosRoutes from "./src/routes/documentos.routes.js";
import authRoutes from "./src/routes/auth.routes.js"; // ← NUEVO
import httpLogger from "./src/middleware/loggerMiddleware.js";

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

// Middleware de express
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(httpLogger);

// Rutas
app.use("/api/auth", authRoutes); // ← NUEVO: Rutas de autenticación
app.use("/api/clientes", clientesRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/abogados", abogadosRoutes);
app.use("/api/casos", casosRoutes);
app.use("/api/documentos", documentosRoutes);

// Archivos estaticos
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    console.log("Conectando a MySQL... [server.js]");
    const connected = await testConnection();

    if (!connected) {
      console.error(" No se pudo conectar a la base de datos [server.js]");
      process.exit(1);
    }

    console.log("Sincronizando modelos...");
    await syncDatabase();

    app.listen(PORT, () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`Servidor corriendo en http://localhost:${PORT} [server.js]`);
      console.log(
        `Entorno: ${process.env.NODE_ENV || "development"} [server.js]`
      );
      console.log(`Base de datos: ${process.env.DB_NAME}`);
      console.log(`${"=".repeat(50)}\n`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error, " [server.js]");
    process.exit(1);
  }
};

startServer();

process.on("SIGINT", async () => {
  console.log("\n Cerrando servidor... [server.js]");
  process.exit(0);
});

export default app;
