/**
 * Script para forzar la sincronización de TODAS las tablas.
 * Ejecutar una sola vez: node force-sync.js
 */
import "dotenv/config";
import sequelize from "./src/config/database.js";
// Importar modelos y relaciones
import "./src/models/index.js";

async function forceSync() {
    try {
        await sequelize.authenticate();
        console.log("✅ Conectado a la base de datos");

        // Orden de sincronización respetando foreign keys
        const syncOrder = [
            "Abogado",
            "Cliente",
            "ConfiguracionEstudio",
            "Feriado",
            "FeriaJudicial",
            "TipoPlazo",
            "Consulta",
            "Caso",
            "Auditoria",
            "GastoRecurrente",
            "CierreMensual",
            "Evento",
            "Vencimiento",
            "Documento",
            "MovimientoFinanciero",
            "Tarea",
            "ResumenIA",
            "Cuota",
        ];

        console.log("🔄 Sincronizando modelos con ALTER TABLE...");

        for (const modelName of syncOrder) {
            if (sequelize.models[modelName]) {
                try {
                    await sequelize.models[modelName].sync({ alter: true });
                    console.log(`  ✅ ${modelName} sincronizado`);
                } catch (error) {
                    console.error(`  ❌ Error en ${modelName}:`, error.message);
                }
            } else {
                console.warn(`  ⚠️  Modelo ${modelName} no encontrado`);
            }
        }

        // Verificar tablas finales
        const [tables] = await sequelize.query("SHOW TABLES");
        console.log(`\n✅ Total de tablas: ${tables.length}`);
        tables.forEach((t) => {
            const tableName = Object.values(t)[0];
            console.log(`   📋 ${tableName}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

forceSync();
