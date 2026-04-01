// SEEDER: Feriados Puente 2026
// ─────────────────────────────────────────────────────────────────────────────
// Inyecta en la tabla 'feriados' los tres días no laborables con fines
// turísticos ("puentes") oficializados para el año 2026 por el Gobierno Nacional.
// Es IDEMPOTENTE: usa findOrCreate → se puede ejecutar varias veces sin duplicar.
//
// Ejecución: node migrations/seed_feriados_puente_2026.js
// ─────────────────────────────────────────────────────────────────────────────

import sequelize from "../src/config/database.js";
import Feriado from "../src/models/Feriado.js";

// Los tres puentes turísticos 2026 (Decreto del Poder Ejecutivo Nacional)
// La actividad judicial se paraliza igual que en cualquier feriado.
const FERIADOS_PUENTE_2026 = [
  {
    fecha: "2026-03-23",
    nombre: "Puente turístico — Día de la Memoria",
    tipo: "nacional",
    alcance: "ambos",
    es_trasladable: false,
    observaciones: "Lunes 23/03/2026 — Decreto PEN. Puente vinculado al Día Nacional de la Memoria (24/03).",
  },
  {
    fecha: "2026-07-10",
    nombre: "Puente turístico — Día de la Independencia",
    tipo: "nacional",
    alcance: "ambos",
    es_trasladable: false,
    observaciones: "Viernes 10/07/2026 — Decreto PEN. Puente vinculado al Día de la Independencia (09/07).",
  },
  {
    fecha: "2026-12-07",
    nombre: "Puente turístico — Inmaculada Concepción",
    tipo: "nacional",
    alcance: "ambos",
    es_trasladable: false,
    observaciones: "Lunes 07/12/2026 — Decreto PEN. Puente vinculado a la Inmaculada Concepción (08/12).",
  },
];

const seedFeriadosPuente = async () => {
  console.log("\n📅 SEEDER — Feriados Puente Turísticos 2026");
  console.log("=".repeat(55));

  try {
    console.log("\n📡 Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("   ✅ Conexión establecida");

    // Sincronizar modelo sin destruir datos
    await Feriado.sync({ force: false });

    console.log("\n🗓️  Insertando feriados puente...\n");

    let creados = 0;
    let existentes = 0;

    for (const feriado of FERIADOS_PUENTE_2026) {
      // findOrCreate usa fecha + tipo + localidad (null) como llave compuesta
      // coincidente con el UNIQUE INDEX del modelo Feriado
      const [registro, created] = await Feriado.findOrCreate({
        where: {
          fecha: feriado.fecha,
          tipo: feriado.tipo,
          localidad: null,
        },
        defaults: feriado,
      });

      if (created) {
        console.log(`   ✅ CREADO   → ${feriado.fecha} | ${feriado.nombre}`);
        creados++;
      } else {
        // Actualizar el nombre/observaciones si el registro ya existía con nombre genérico
        if (registro.nombre !== feriado.nombre || registro.observaciones !== feriado.observaciones) {
          await registro.update({
            nombre: feriado.nombre,
            alcance: feriado.alcance,
            observaciones: feriado.observaciones,
          });
          console.log(`   🔄 ACTUALIZADO → ${feriado.fecha} | ${feriado.nombre}`);
          creados++;
        } else {
          console.log(`   ⏭️  EXISTENTE  → ${feriado.fecha} | ${registro.nombre}`);
          existentes++;
        }
      }
    }

    console.log("\n" + "=".repeat(55));
    console.log(`✅ Seeder completado: ${creados} insertado/actualizado, ${existentes} sin cambios`);
    console.log(
      "\n💡 Estos feriados son tratados como días inhábiles judiciales\n" +
      "   por el motor de calculadora_service.js (alcance: 'ambos').\n"
    );

    await sequelize.close();
    console.log("🔌 Conexión cerrada\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR en el seeder:", error.message);
    console.error("\n💡 Verificá que:\n   1. MySQL esté corriendo\n   2. Las credenciales en .env sean correctas\n   3. La tabla 'feriados' exista (correr setup_calculadora.js primero)\n");
    process.exit(1);
  }
};

seedFeriadosPuente();
