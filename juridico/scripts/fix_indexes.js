/**
 * fix_indexes.js — Limpia índices y FKs duplicados generados por sync({ alter: true })
 *
 * Problema: Sequelize 6 + MySQL con alter:true crea nuevos FK constraints
 * en cada reinicio (ibfk_1, ibfk_2, ..., ibfk_115), acumulando basura hasta
 * superar el límite de 64 keys por tabla.
 *
 * Solución: Este script elimina TODOS los FK e índices no-primarios,
 * luego deja que Sequelize los recree limpios en el próximo arranque.
 *
 * USO: node scripts/fix_indexes.js
 */
import "dotenv/config";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: "mysql",
        logging: false,
    }
);

// Tablas que sabemos tienen problemas
const TABLAS_AFECTADAS = [
    "abogados",
    "consultas",
    "casos",
    "eventos",
    "tareas",
    "movimientos_financieros",
    "cuotas",
    "gastos_recurrentes",
    "documentos",
    "auditorias",
    "vencimientos",
    "resumenes_ia",
    "cierre_mensual",
];

async function limpiarTabla(tabla) {
    try {
        // 1. Obtener todas las FK constraints de esta tabla
        const [fks] = await sequelize.query(`
            SELECT CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
              AND TABLE_NAME = '${tabla}'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        `);

        if (fks.length > 0) {
            console.log(`  📋 ${tabla}: ${fks.length} FK constraints encontrados`);

            for (const fk of fks) {
                try {
                    await sequelize.query(`ALTER TABLE \`${tabla}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                    console.log(`    ✅ Eliminada FK: ${fk.CONSTRAINT_NAME}`);
                } catch (err) {
                    // Puede que ya no exista
                    console.log(`    ⚠️  FK ${fk.CONSTRAINT_NAME}: ${err.message.substring(0, 60)}`);
                }
            }
        }

        // 2. Obtener todos los índices no-primarios
        const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tabla}\` WHERE Key_name != 'PRIMARY'`);

        // Agrupar por nombre de índice
        const indexNames = [...new Set(indexes.map(i => i.Key_name))];

        if (indexNames.length > 0) {
            console.log(`  📋 ${tabla}: ${indexNames.length} índices no-primarios`);

            for (const idxName of indexNames) {
                try {
                    await sequelize.query(`ALTER TABLE \`${tabla}\` DROP INDEX \`${idxName}\``);
                    console.log(`    ✅ Eliminado índice: ${idxName}`);
                } catch (err) {
                    console.log(`    ⚠️  Índice ${idxName}: ${err.message.substring(0, 60)}`);
                }
            }
        }

        if (fks.length === 0 && indexNames.length === 0) {
            console.log(`  ✔️  ${tabla}: limpia`);
        }

    } catch (err) {
        if (err.message.includes("doesn't exist")) {
            console.log(`  ⏭️  ${tabla}: tabla no existe, skip`);
        } else {
            console.error(`  ❌ ${tabla}: ${err.message}`);
        }
    }
}

async function main() {
    try {
        await sequelize.authenticate();
        console.log("🔌 Conectado a:", process.env.DB_NAME);
        console.log("");
        console.log("🧹 LIMPIEZA DE ÍNDICES Y FK DUPLICADOS");
        console.log("═".repeat(50));
        console.log("");

        // Deshabilitar checks de FK temporalmente
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        for (const tabla of TABLAS_AFECTADAS) {
            await limpiarTabla(tabla);
            console.log("");
        }

        // Rehabilitar checks
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

        console.log("═".repeat(50));
        console.log("✅ LIMPIEZA COMPLETA");
        console.log("");
        console.log("👉 Ahora reiniciá el servidor para que Sequelize recree");
        console.log("   los índices y FK de forma limpia (solo 1 por relación).");

    } catch (err) {
        console.error("❌ Error fatal:", err.message);
    } finally {
        await sequelize.close();
    }
}

main();
