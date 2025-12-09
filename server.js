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

//importacion de rutas CRUD

import clientesRoutes from "./src/routes/clientes.routes.js";
import consultasRoutes from "./src/routes/consultas.routes.js";
import abogadosRoutes from "./src/routes/abogados.routes.js";
import casosRoutes from "./src/routes/casos.routes.js";
import documentosRoutes from "./src/routes/documentos.routes.js";

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// MIDDLEWARES DE SEGURIDAD
// ====================

/**
 * HELMET: Protege contra vulnerabilidades web comunes
 * - Configura headers HTTP seguros
 * - Previene clickjacking, XSS, etc.
 */
app.use(helmet());

/**
 * CORS: Controla qué dominios pueden acceder a tu API
 * Configura esto según tus necesidades
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * RATE LIMITING: Limita solicitudes por IP
 * Previene ataques de fuerza bruta y DDoS
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 solicitudes por IP en 15 min
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

//middleware de express

// Parser de JSON (para req.body)
app.use(express.json({ limit: "10mb" }));

// Parser de URL-encoded (para formularios)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// rutas
//* todas las rutas de clientes tendran el prefijo /api/clientes
app.use("/api/clientes", clientesRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/abogados", abogadosRoutes);
app.use("/api/casos", casosRoutes);
app.use("/api/documentos", documentosRoutes);

// archivos estaticos

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Ruta de health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Aquí importarás tus rutas más adelante
// import clientesRoutes from './src/routes/clientes.routes.js';
// app.use('/api/clientes', clientesRoutes);

// ====================
// MANEJO DE ERRORES
// ====================

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ====================
// INICIAR SERVIDOR
// ====================

const startServer = async () => {
  try {
    // 1. Probar conexión a la base de datos
    console.log("Conectando a MySQL... [server.js]");
    const connected = await testConnection();

    if (!connected) {
      console.error(" No se pudo conectar a la base de datos [server.js]");
      process.exit(1);
    }
    // 2. Sincronizar modelos (opcional, ya que tienes las tablas creadas)
    console.log("Sincronizando modelos...");
    await syncDatabase();

    // 3. Iniciar servidor
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

// Iniciar
startServer();

// Manejar cierre graceful
process.on("SIGINT", async () => {
  console.log("\n Cerrando servidor... [server.js]");
  process.exit(0);
});

export default app;
