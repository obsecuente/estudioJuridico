// src/config/database.js
import "dotenv/config"; // ✅ Importa y ejecuta dotenv automáticamente
import { Sequelize } from "sequelize";
import logger from "./logger.js";

/**
 * Configuración de Sequelize
 *
 * Sequelize necesita saber:
 * 1. Nombre de la base de datos
 * 2. Usuario
 * 3. Contraseña
 * 4. Opciones de configuración (host, dialecto, pool, etc.)
 */

let sequelize;

const loggingOption = process.env.NODE_ENV === "test" ? false : (msg) => logger.debug(msg);

if (process.env.DB_NAME && process.env.DB_USER) {
  sequelize = new Sequelize(
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
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 1000,
      },

      // Logging
      logging: loggingOption,

      // Timezone
      timezone: "-03:00",

      // Define
      define: {
        timestamps: true,
        freezeTableName: true,
        underscored: true,
      },
    }
  );
} else {
  console.warn(
    "Variables de entorno de MySQL faltantes (DB_NAME/DB_USER). Usando SQLite como fallback para desarrollo."
  );

  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.SQLITE_FILE || "./database.sqlite",
    logging: loggingOption,
    define: {
      timestamps: true,
      freezeTableName: true,
      underscored: true,
    },
  });
}

/**
 * Función para verificar la conexión a la base de datos
 * Es importante llamar a esta función al iniciar el servidor
 */
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Conexión exitosa a la base de datos [database.js]");
    return true;
  } catch (error) {
    logger.error("Error al conectar a la base de datos [database.js]", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Si faltan variables de entorno, intentar fallback a SQLite (modo desarrollo)
    if (!process.env.DB_NAME || !process.env.DB_USER) {
      logger.warn(
        "Variables de entorno DB faltantes (DB_NAME/DB_USER). Intentando fallback a SQLite."
      );

      try {
        sequelize = new Sequelize({
          dialect: "sqlite",
          storage: process.env.SQLITE_FILE || "./database.sqlite",
          logging: loggingOption,
          define: {
            timestamps: true,
            freezeTableName: true,
            underscored: true,
          },
        });

        await sequelize.authenticate();
        logger.info("Fallback a SQLite exitoso [database.js]");
        return true;
      } catch (sqliteErr) {
        logger.error("Error al inicializar fallback SQLite:", {
          message: sqliteErr.message,
          stack: sqliteErr.stack,
        });
        return false;
      }
    }

    // Si tenemos configuración de MySQL pero falla la autenticación, no hacer fallback automático.
    if (error && (error.code === "ER_ACCESS_DENIED_ERROR" || error.name?.includes("AccessDenied"))) {
      logger.error(
        "Acceso denegado a MySQL. Verifica las credenciales en tu archivo .env o crea el usuario en MySQL Workbench."
      );
      return false;
    }

    // Para otros errores de conexión, devolver false para que el proceso trate el fallo.
    return false;
  }
};

export const syncDatabase = async () => {
  try {
    const forceSync = process.env.FORCE_SYNC === "true";
    const isTest = process.env.NODE_ENV === "test";

    if (isTest) {
      // En tests, setup.js maneja el sync con force: true
      console.log("⏭️  Sync saltado en modo test (setup.js lo maneja) [database.js]");
      return;
    }

    if (!forceSync) {
      // Verificar si las tablas principales ya existen
      try {
        const [tables] = await sequelize.query("SHOW TABLES");
        if (tables.length > 5) {
          console.log(`✅ ${tables.length} tablas detectadas. Sync con alter saltado.`);
          console.log("   (Usá FORCE_SYNC=true para forzar sincronización) [database.js]");
          return;
        }
      } catch {
        // Si falla SHOW TABLES (ej: SQLite), seguimos con sync normal
      }
    }

    console.log("🔄 Sincronizando modelos con ALTER TABLE...");
    // Sincronizar modelos uno por uno para evitar que un error detenga todo
    for (const modelName of Object.keys(sequelize.models)) {
      try {
        await sequelize.models[modelName].sync({ alter: true });
      } catch (error) {
        console.error(` Error al sincronizar ${modelName}:`, error.message);
      }
    }
    console.log("✅ Modelos sincronizados individualmente [database.js]");
  } catch (error) {
    console.error(
      "❌ Error general al sincronizar modelos:",
      error.message,
      "[database.js]"
    );
  }
};



export default sequelize;
