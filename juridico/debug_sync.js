import "dotenv/config";
import sequelize from "./src/config/database.js";
import "./src/models/index.js";

async function testSync() {
    try {
        await sequelize.authenticate();
        console.log("Conectado.");

        const models = sequelize.models;
        for (const modelName of Object.keys(models)) {
            try {
                console.log(`Sincronizando ${modelName}...`);
                await models[modelName].sync({ alter: true });
                console.log(`✅ ${modelName} OK`);
            } catch (error) {
                console.error(`❌ Error en ${modelName}:`, error.message);
            }
        }
    } catch (error) {
        console.error("Error general:", error);
    } finally {
        await sequelize.close();
    }
}

testSync();
