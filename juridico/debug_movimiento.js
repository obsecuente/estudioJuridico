import "dotenv/config";
import sequelize from "./src/config/database.js";
import MovimientoFinanciero from "./src/models/MovimientoFinanciero.js";

async function testMovimiento() {
    try {
        await sequelize.authenticate();
        console.log("Conectado.");

        console.log("Sincronizando MovimientoFinanciero...");
        await MovimientoFinanciero.sync({ alter: true });
        console.log("✅ MovimientoFinanciero OK");

    } catch (error) {
        console.error("❌ Error en MovimientoFinanciero:", error.message);
    } finally {
        await sequelize.close();
    }
}

testMovimiento();
