// SCRIPT TODO-EN-UNO: Configurar calculadora de plazos
// Este script hace TODO automáticamente:
// 1. Crea las 3 tablas (feriados, feria_judicial, tipos_plazo)
// 2. Carga todos los feriados 2026
// 3. Carga todos los tipos de plazo
// 4. Verifica que todo esté bien
//
// Ejecutar con: node migrations/setup_calculadora.js

import sequelize from "../src/config/database.js";
import Feriado from "../src/models/Feriado.js";
import FeriaJudicial from "../src/models/FeriaJudicial.js";
import TipoPlazo from "../src/models/TipoPlazo.js";

const setupCompleto = async () => {
  console.log("\n🚀 CONFIGURACIÓN AUTOMÁTICA - CALCULADORA DE PLAZOS");
  console.log("=".repeat(60));
  
  try {
    // paso 1: conectar a la base de datos
    console.log("\n📡 PASO 1: Conectando a la base de datos...");
    await sequelize.authenticate();
    console.log("   ✅ Conexión establecida");

    // paso 2: crear las tablas
    console.log("\n🗄️  PASO 2: Creando tablas...");
    await Feriado.sync({ force: false });
    console.log("   ✅ Tabla 'feriados' creada");
    
    await FeriaJudicial.sync({ force: false });
    console.log("   ✅ Tabla 'feria_judicial' creada");
    
    await TipoPlazo.sync({ force: false });
    console.log("   ✅ Tabla 'tipos_plazo' creada");

    // paso 3: cargar feriados nacionales 2026
    console.log("\n📅 PASO 3: Cargando feriados nacionales 2026...");
    
    const feriadosNacionales = [
      { fecha: "2026-01-01", nombre: "Año Nuevo", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-02-16", nombre: "Carnaval", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-02-17", nombre: "Carnaval", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-03-24", nombre: "Día Nacional de la Memoria por la Verdad y la Justicia", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-04-02", nombre: "Día del Veterano y de los Caídos en la Guerra de Malvinas", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-04-02", nombre: "Jueves Santo", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-04-03", nombre: "Viernes Santo", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-05-01", nombre: "Día del Trabajador", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-05-25", nombre: "Día de la Revolución de Mayo", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-06-15", nombre: "Paso a la Inmortalidad del General Martín Miguel de Güemes", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-06-20", nombre: "Paso a la Inmortalidad del General Manuel Belgrano", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-07-09", nombre: "Día de la Independencia", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-08-17", nombre: "Paso a la Inmortalidad del General José de San Martín", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-10-12", nombre: "Día del Respeto a la Diversidad Cultural", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-11-23", nombre: "Día de la Soberanía Nacional", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-12-08", nombre: "Inmaculada Concepción de María", tipo: "nacional", alcance: "ambos" },
      { fecha: "2026-12-25", nombre: "Navidad", tipo: "nacional", alcance: "ambos" },
    ];

    for (const feriado of feriadosNacionales) {
      await Feriado.findOrCreate({
        where: { fecha: feriado.fecha, tipo: feriado.tipo },
        defaults: feriado,
      });
    }
    console.log(`   ✅ ${feriadosNacionales.length} feriados nacionales cargados`);

    // paso 4: cargar feriados provinciales neuquen
    console.log("\n📅 PASO 4: Cargando feriados provinciales Neuquén...");
    
    const feriadosNeuquen = [
      { fecha: "2026-06-15", nombre: "Día de la Provincia de Neuquén", tipo: "neuquen", provincia: "neuquen", alcance: "judicial", observaciones: "Provincialización - 1955" },
      { fecha: "2026-06-23", nombre: "Wiñoy Xipantv - Año Nuevo Mapuche", tipo: "neuquen", provincia: "neuquen", alcance: "administrativo", observaciones: "Solo pueblos originarios" },
      { fecha: "2026-06-24", nombre: "Wiñoy Xipantv - Año Nuevo Mapuche", tipo: "neuquen", provincia: "neuquen", alcance: "administrativo", observaciones: "Solo pueblos originarios" },
      { fecha: "2026-06-27", nombre: "Día del Empleado Público", tipo: "neuquen", provincia: "neuquen", alcance: "administrativo", observaciones: "No es día inhábil judicial" },
      { fecha: "2026-09-12", nombre: "Aniversario de Neuquén Capital", tipo: "neuquen", provincia: "neuquen", alcance: "administrativo", observaciones: "Solo alcance municipal" },
    ];

    for (const feriado of feriadosNeuquen) {
      await Feriado.findOrCreate({
        where: { fecha: feriado.fecha, tipo: feriado.tipo },
        defaults: feriado,
      });
    }
    console.log(`   ✅ ${feriadosNeuquen.length} feriados de Neuquén cargados`);

    // paso 5: cargar feriados provinciales rio negro
    console.log("\n📅 PASO 5: Cargando feriados provinciales Río Negro...");
    
    const feriadosRioNegro = [
      { fecha: "2026-06-15", nombre: "Día de la Provincia de Río Negro", tipo: "rio_negro", provincia: "rio_negro", alcance: "judicial", observaciones: "Provincialización - 1955" },
      { fecha: "2026-06-27", nombre: "Día del Empleado Público", tipo: "rio_negro", provincia: "rio_negro", alcance: "administrativo", observaciones: "No es día inhábil judicial" },
      { fecha: "2026-04-22", nombre: "Aniversario de Viedma", tipo: "rio_negro", provincia: "rio_negro", localidad: "Viedma", alcance: "administrativo", observaciones: "Solo en Viedma" },
    ];

    for (const feriado of feriadosRioNegro) {
      await Feriado.findOrCreate({
        where: { fecha: feriado.fecha, tipo: feriado.tipo },
        defaults: feriado,
      });
    }
    console.log(`   ✅ ${feriadosRioNegro.length} feriados de Río Negro cargados`);

    // paso 6: cargar feria judicial
    console.log("\n🌴 PASO 6: Cargando períodos de feria judicial 2026...");
    
    const feriaJudicial = [
      { anio: 2026, periodo: "verano", fecha_inicio: "2026-01-01", fecha_fin: "2026-01-31", jurisdiccion: "todas", observaciones: "Todo enero" },
      { anio: 2026, periodo: "invierno", fecha_inicio: "2026-07-20", fecha_fin: "2026-07-31", jurisdiccion: "nacional", observaciones: "Fuero Nacional/Federal" },
      { anio: 2026, periodo: "invierno", fecha_inicio: "2026-07-06", fecha_fin: "2026-07-17", jurisdiccion: "neuquen", observaciones: "Neuquén" },
      { anio: 2026, periodo: "invierno", fecha_inicio: "2026-07-06", fecha_fin: "2026-07-17", jurisdiccion: "rio_negro", observaciones: "Río Negro" },
    ];

    for (const feria of feriaJudicial) {
      await FeriaJudicial.findOrCreate({
        where: { anio: feria.anio, periodo: feria.periodo, jurisdiccion: feria.jurisdiccion },
        defaults: feria,
      });
    }
    console.log(`   ✅ ${feriaJudicial.length} períodos cargados`);

    // paso 7: cargar tipos de plazo
    console.log("\n⚖️  PASO 7: Cargando tipos de plazo procesales...");
    
    const tiposPlazos = [
      // civil
      { codigo: "contestacion_demanda_civil", nombre: "Contestación de Demanda", dias_default: 15, tipo_dias: "habiles", fuero: "civil", base_legal: "Art. 338 CPCCN", descripcion: "Plazo para contestar demanda en proceso ordinario" },
      { codigo: "apelacion_civil", nombre: "Apelación (sentencia definitiva)", dias_default: 5, tipo_dias: "habiles", fuero: "civil", base_legal: "Art. 244 CPCCN", descripcion: "Plazo para apelar sentencias definitivas" },
      { codigo: "expresion_agravios_civil", nombre: "Expresión de Agravios", dias_default: 10, tipo_dias: "habiles", fuero: "civil", base_legal: "Art. 259 CPCCN", descripcion: "Plazo para fundamentar apelación ante Cámara" },
      { codigo: "replica_agravios_civil", nombre: "Réplica a Expresión de Agravios", dias_default: 10, tipo_dias: "habiles", fuero: "civil", base_legal: "Art. 259 CPCCN", descripcion: "Plazo para contestar expresión de agravios" },
      { codigo: "alegatos_civil", nombre: "Alegatos", dias_default: 6, tipo_dias: "habiles", fuero: "civil", base_legal: "Art. 482 CPCCN", descripcion: "Plazo para alegatos post-prueba" },
      { codigo: "traslado_generico_civil", nombre: "Traslado Genérico", dias_default: 5, tipo_dias: "habiles", fuero: "civil", base_legal: "Art. 138 CPCCN", descripcion: "Plazo de traslado cuando no hay plazo específico" },
      { codigo: "recurso_extraordinario", nombre: "Recurso Extraordinario Federal", dias_default: 10, tipo_dias: "habiles", fuero: "civil", base_legal: "Ley 48", descripcion: "Recurso ante CSJN" },
      
      // laboral
      { codigo: "contestacion_demanda_laboral", nombre: "Contestación de Demanda", dias_default: 10, tipo_dias: "habiles", fuero: "laboral", base_legal: "Ley 18.345", descripcion: "Plazo para contestar demanda laboral" },
      { codigo: "apelacion_laboral", nombre: "Apelación", dias_default: 5, tipo_dias: "habiles", fuero: "laboral", base_legal: "Ley 18.345", descripcion: "Plazo para apelar en fuero laboral" },
      { codigo: "expresion_agravios_laboral", nombre: "Expresión de Agravios", dias_default: 10, tipo_dias: "habiles", fuero: "laboral", base_legal: "Ley 18.345", descripcion: "Fundamentación de apelación laboral" },
      
      // familia
      { codigo: "contestacion_familia", nombre: "Contestación de Demanda", dias_default: 15, tipo_dias: "habiles", fuero: "familia", base_legal: "Según jurisdicción", descripcion: "Plazo para contestar en fuero de familia" },
      { codigo: "apelacion_familia", nombre: "Apelación", dias_default: 5, tipo_dias: "habiles", fuero: "familia", base_legal: "Según jurisdicción", descripcion: "Plazo para apelar en familia" },
      
      // genéricos
      { codigo: "prescripcion_2_años", nombre: "Prescripción - 2 años", dias_default: 730, tipo_dias: "corridos", fuero: "generico", base_legal: "Art. 2562 CCyC", descripcion: "Prescripción de acciones personales" },
      { codigo: "prescripcion_5_años", nombre: "Prescripción - 5 años", dias_default: 1825, tipo_dias: "corridos", fuero: "generico", base_legal: "Art. 2560 CCyC", descripcion: "Prescripción genérica de 5 años" },
      { codigo: "caducidad_instancia_6_meses", nombre: "Caducidad de Instancia - 6 meses", dias_default: 180, tipo_dias: "corridos", fuero: "generico", base_legal: "Art. 310 CPCCN", descripcion: "Caducidad en primera instancia" },
      { codigo: "caducidad_instancia_3_meses", nombre: "Caducidad de Instancia - 3 meses", dias_default: 90, tipo_dias: "corridos", fuero: "generico", base_legal: "Art. 310 CPCCN", descripcion: "Caducidad en segunda instancia" },
    ];

    for (const tipo of tiposPlazos) {
      await TipoPlazo.findOrCreate({
        where: { codigo: tipo.codigo },
        defaults: tipo,
      });
    }
    console.log(`   ✅ ${tiposPlazos.length} tipos de plazo cargados`);

    // paso 8: verificación final
    console.log("\n🔍 PASO 8: Verificando que todo esté correcto...");
    
    const totalFeriados = await Feriado.count();
    const totalFerias = await FeriaJudicial.count();
    const totalTipos = await TipoPlazo.count();

    console.log(`   ✅ Feriados: ${totalFeriados} registros`);
    console.log(`   ✅ Feria judicial: ${totalFerias} períodos`);
    console.log(`   ✅ Tipos de plazo: ${totalTipos} registros`);

    // resumen final
    console.log("\n" + "=".repeat(60));
    console.log("✅ CONFIGURACIÓN COMPLETADA EXITOSAMENTE");
    console.log("=".repeat(60));
    console.log("\n📊 RESUMEN:");
    console.log(`   • ${feriadosNacionales.length} feriados nacionales`);
    console.log(`   • ${feriadosNeuquen.length} feriados Neuquén`);
    console.log(`   • ${feriadosRioNegro.length} feriados Río Negro`);
    console.log(`   • ${feriaJudicial.length} períodos de feria judicial`);
    console.log(`   • ${tiposPlazos.length} tipos de plazo procesales`);
    console.log("\n🎉 La calculadora de plazos está lista para usar!");
    console.log("\n📝 Próximo paso:");
    console.log("   Agregá las rutas en server.js y arrancá el servidor\n");

    await sequelize.close();
    console.log("🔌 Conexión cerrada\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
    console.error("\n💡 Solución: Verificá que:");
    console.error("   1. MySQL esté corriendo");
    console.error("   2. Las credenciales en .env sean correctas");
    console.error("   3. La base de datos exista\n");
    process.exit(1);
  }
};

setupCompleto();
