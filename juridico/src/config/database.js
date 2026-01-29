// src/config/database.js
import "dotenv/config"; // ✅ Importa y ejecuta dotenv automáticamente
import { Sequelize } from "sequelize";

/**
 * Configuración de Sequelize
 *
 * Sequelize necesita saber:
 * 1. Nombre de la base de datos
 * 2. Usuario
 * 3. Contraseña
 * 4. Opciones de configuración (host, dialecto, pool, etc.)
 */

const sequelize = new Sequelize(
  process.env.DB_NAME, // Nombre de la base de datos
  process.env.DB_USER, // Usuario
  process.env.DB_PASS, // Contraseña
  {
    host: process.env.DB_HOST, // Host (127.0.0.1 o localhost)
    port: process.env.DB_PORT || 3306, // Puerto MySQL
    dialect: "mysql", // Tipo de base de datos

    // Pool de conexiones: gestiona múltiples conexiones simultáneas
    pool: {
      max: 10,
      min: 2, // Mantener al menos 2 conexiones abiertas
      acquire: 30000,
      idle: 10000,
      evict: 1000, // Revisar conexiones inactivas cada segundo
    },

    // Logging: útil para desarrollo, desactívalo en producción
    logging: process.env.NODE_ENV === "test" ? false : console.log, // Cambia a 'false' en producción

    // Timezone: importante para fechas
    timezone: "-03:00", // Argentina (UTC-3)

    // Define: configuración global de modelos
    define: {
      timestamps: true, // ✅ Activa createdAt y updatedAt para auditoría
      freezeTableName: true, // No pluraliza nombres de tablas
      underscored: true, // ✅ Usa snake_case (created_at, updated_at)
    },
  }
);

/**
 * Función para verificar la conexión a la base de datos
 * Es importante llamar a esta función al iniciar el servidor
 */
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión exitosa a MySQL [database.js]");
    return true;
  } catch (error) {
    console.error(" Error al conectar a MySQL: [database.js]");
    console.error("Mensaje:", error.message);
    console.error("Código:", error.code);
    console.error("Error completo:", error);
    return false;
  }
};

export const syncDatabase = async () => {
  try {
    // Como ya tienes las tablas creadas, usa sin opciones
    await sequelize.sync();
    console.log(" Modelos sincronizados con la base de datos [database.js]");
  } catch (error) {
    console.error(
      " Error al sincronizar modelos:",
      error.message,
      "[database.js]"
    );
  }
};

export default sequelize;
