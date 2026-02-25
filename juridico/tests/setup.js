import { sequelize } from "../src/models/index.js";

beforeAll(async () => {
  try {
    console.log("🔧 Configurando base de datos para tests...");

    await sequelize.authenticate();
    console.log("✅ Conexión establecida");

    // Detectar dialecto
    const isMysql = sequelize.getDialect() === "mysql";

    if (isMysql) {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    }

    await sequelize.sync({ force: true });

    if (isMysql) {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    console.log("✅ Base de datos lista para tests\n");
  } catch (error) {
    console.error("❌ Error en setup:", error);
    throw error;
  }
});

// Deshabilitar FK checks antes de cada test para permitir limpieza segura
beforeEach(async () => {
  if (sequelize.getDialect() === "mysql") {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  }
});

afterEach(async () => {
  if (sequelize.getDialect() === "mysql") {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  }
});

afterAll(async () => {
  await sequelize.close();
  console.log("✅ Conexión cerrada");
});
