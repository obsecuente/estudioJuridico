import { sequelize } from "../src/models/index.js";

beforeAll(async () => {
  try {
    console.log("🔧 Configurando base de datos para tests...");

    await sequelize.authenticate();
    console.log("✅ Conexión establecida");

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.sync({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("✅ Base de datos lista para tests\n");
  } catch (error) {
    console.error("❌ Error en setup:", error);
    throw error;
  }
});

afterAll(async () => {
  await sequelize.close();
  console.log("✅ Conexión cerrada");
});
