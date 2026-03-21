import Feriado from "../models/Feriado.js";
import FeriaJudicial from "../models/FeriaJudicial.js";
import { Op } from "sequelize";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// verificar si una fecha es fin de semana
const esFinDeSemana = (fecha) => {
  const diaSemana = fecha.getDay();
  return diaSemana === 0 || diaSemana === 6;
};

// verificar si una fecha es feriado
export const esFeriado = async (fecha, jurisdiccion, soloJudicial = true, localidad = null) => {
  const fechaStr = fecha.toISOString().split("T")[0];
  const alcances = soloJudicial ? ["judicial", "ambos"] : ["judicial", "ambos", "administrativo"];

  // buscar feriado nacional o provincial
  const feriado = await Feriado.findOne({
    where: {
      fecha: fechaStr,
      [Op.or]: [
        { tipo: "nacional", alcance: { [Op.in]: alcances } },
        {
          tipo: jurisdiccion,
          alcance: { [Op.in]: alcances },
        },
      ],
    },
  });

  if (feriado) return feriado;

  // buscar feriado local si viene localidad
  if (localidad) {
    const feriadoLocal = await Feriado.findOne({
      where: {
        fecha: fechaStr,
        localidad,
        alcance: { [Op.in]: alcances },
      },
    });
    if (feriadoLocal) return feriadoLocal;
  }

  return null;
};

// verificar si una fecha está en feria judicial
export const estaEnFeriaJudicial = async (fecha, jurisdiccion) => {
  const fechaStr = fecha.toISOString().split("T")[0];
  const anio = fecha.getFullYear();

  const feria = await FeriaJudicial.findOne({
    where: {
      anio,
      fecha_inicio: { [Op.lte]: fechaStr },
      fecha_fin: { [Op.gte]: fechaStr },
      [Op.or]: [{ jurisdiccion }, { jurisdiccion: "todas" }],
    },
  });

  return feria;
};

// verificar si un día es hábil judicial
export const esDiaHabil = async (fecha, jurisdiccion, localidad = null) => {
  if (esFinDeSemana(fecha)) return false;

  const feriadoEncontrado = await esFeriado(fecha, jurisdiccion, true, localidad);
  if (feriadoEncontrado) return false;

  const feriaEncontrada = await estaEnFeriaJudicial(fecha, jurisdiccion);
  if (feriaEncontrada) return false;

  return true;
};

export const calcularVencimiento = async ({
  fecha_notificacion,
  dias_plazo,
  jurisdiccion = "nacional",
  incluir_plazo_gracia = false,
  localidad = null,
}) => {
  // validaciones
  if (!fecha_notificacion) {
    throw new AppError("La fecha de notificación es obligatoria", 400);
  }
  if (!dias_plazo || dias_plazo < 1) {
    throw new AppError("Los días del plazo deben ser al menos 1", 400);
  }
  if (!["nacional", "neuquen", "rio_negro"].includes(jurisdiccion)) {
    throw new AppError("Jurisdicción no válida", 400);
  }

  // convertir fecha de notificación a objeto Date
  const fechaNotif = new Date(fecha_notificacion + "T00:00:00");

  // el plazo empieza el día SIGUIENTE a la notificación
  let fechaActual = new Date(fechaNotif);
  fechaActual.setDate(fechaActual.getDate() + 1);

  let diasHabilesContados = 0;
  const diasExcluidos = {
    fines_de_semana: 0,
    feriados: 0,
    feria_judicial: 0,
  };
  const feriadosEncontrados = [];
  const calendario = [];

  // agregar día de notificación al calendario
  calendario.push({
    fecha: fechaNotif.toISOString().split("T")[0],
    tipo: "notificacion",
    es_habil: false,
    descripcion: "Día de notificación (no computa)",
  });

  // contar días hábiles
  while (diasHabilesContados < dias_plazo) {
    const fechaStr = fechaActual.toISOString().split("T")[0];
    let esHabil = true;
    let razon = "";

    // verificar fin de semana
    if (esFinDeSemana(fechaActual)) {
      diasExcluidos.fines_de_semana++;
      esHabil = false;
      razon = "Fin de semana";
    }
    // verificar feriado
    else {
      const feriadoEnc = await esFeriado(fechaActual, jurisdiccion, true, localidad);
      if (feriadoEnc) {
        diasExcluidos.feriados++;
        esHabil = false;
        razon = `Feriado: ${feriadoEnc.nombre}`;
        feriadosEncontrados.push({
          fecha: fechaStr,
          nombre: feriadoEnc.nombre,
          tipo: feriadoEnc.tipo,
        });
      }
      // verificar feria judicial
      else {
        const feriaEnc = await estaEnFeriaJudicial(fechaActual, jurisdiccion);
        if (feriaEnc) {
          diasExcluidos.feria_judicial++;
          esHabil = false;
          razon = `Feria judicial (${feriaEnc.periodo})`;
        }
      }
    }

    // si es día hábil, contar
    if (esHabil) {
      diasHabilesContados++;
      calendario.push({
        fecha: fechaStr,
        tipo: "habil",
        es_habil: true,
        numero_dia: diasHabilesContados,
        descripcion: `Día hábil ${diasHabilesContados} de ${dias_plazo}`,
      });

      // si completamos el plazo, esta es la fecha de vencimiento
      if (diasHabilesContados === dias_plazo) {
        break;
      }
    } else {
      // día inhábil
      calendario.push({
        fecha: fechaStr,
        tipo: "inhabill",
        es_habil: false,
        razon,
        descripcion: razon,
      });
    }

    // avanzar al siguiente día
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  // verificar si el vencimiento cayó en día inhábil y prorrogar
  let fechaVencimiento = new Date(fechaActual);
  while (!(await esDiaHabil(fechaVencimiento, jurisdiccion, localidad))) {
    const fechaVencStr = fechaVencimiento.toISOString().split("T")[0];
    let razon = "";

    if (esFinDeSemana(fechaVencimiento)) {
      razon = "Fin de semana - se prorroga";
      diasExcluidos.fines_de_semana++;
    } else {
      const feriadoEnc = await esFeriado(fechaVencimiento, jurisdiccion, true, localidad);
      if (feriadoEnc) {
        razon = `Feriado: ${feriadoEnc.nombre} - se prorroga`;
        diasExcluidos.feriados++;
        feriadosEncontrados.push({
          fecha: fechaVencStr,
          nombre: feriadoEnc.nombre,
          tipo: feriadoEnc.tipo,
        });
      } else {
        const feriaEnc = await estaEnFeriaJudicial(
          fechaVencimiento,
          jurisdiccion
        );
        if (feriaEnc) {
          razon = `Feria judicial (${feriaEnc.periodo}) - se prorroga`;
          diasExcluidos.feria_judicial++;
        }
      }
    }

    calendario.push({
      fecha: fechaVencStr,
      tipo: "prorroga",
      es_habil: false,
      descripcion: razon,
    });

    fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
  }

  // agregar fecha de vencimiento final al calendario
  calendario.push({
    fecha: fechaVencimiento.toISOString().split("T")[0],
    tipo: "vencimiento",
    es_habil: true,
    descripcion: "Fecha de vencimiento",
  });

  // calcular días corridos
  const diasCorridos = Math.floor(
    (fechaVencimiento - fechaNotif) / (1000 * 60 * 60 * 24)
  );

  // preparar resultado
  const resultado = {
    fecha_notificacion: fechaNotif.toISOString().split("T")[0],
    fecha_vencimiento: fechaVencimiento.toISOString().split("T")[0],
    dias_plazo_solicitado: dias_plazo,
    dias_habiles_computados: dias_plazo,
    dias_corridos_transcurridos: diasCorridos,
    jurisdiccion,
    dias_excluidos: diasExcluidos,
    feriados_encontrados: feriadosEncontrados,
    calendario,
  };

  // si se solicita plazo de gracia (nacional y rio_negro — Art. 124 CPCCN)
  if (incluir_plazo_gracia && (jurisdiccion === "nacional" || jurisdiccion === "rio_negro")) {
    const fechaConGracia = new Date(fechaVencimiento);
    fechaConGracia.setDate(fechaConGracia.getDate() + 1);

    // avanzar hasta día hábil si cae en finde o feriado
    while (!(await esDiaHabil(fechaConGracia, jurisdiccion, localidad))) {
      fechaConGracia.setDate(fechaConGracia.getDate() + 1);
    }

    resultado.plazo_gracia = {
      activo: true,
      fecha_con_gracia: fechaConGracia.toISOString().split("T")[0],
      observacion:
        "El plazo incluye las 2 primeras horas del día hábil siguiente",
    };
  }

  return resultado;
};

// obtener próximos feriados
export const obtenerProximosFeriados = async (
  jurisdiccion = "nacional",
  limite = 10
) => {
  const hoy = new Date().toISOString().split("T")[0];

  const feriados = await Feriado.findAll({
    where: {
      fecha: { [Op.gte]: hoy },
      [Op.or]: [{ tipo: "nacional" }, { tipo: jurisdiccion }],
      alcance: { [Op.in]: ["judicial", "ambos"] },
    },
    order: [["fecha", "ASC"]],
    limit,
  });

  return feriados;
};

// obtener feriados de un mes específico
export const obtenerFeriadosMes = async (anio, mes, jurisdiccion = "nacional") => {
  const mesStr = String(mes).padStart(2, '0');
  const primerDia = `${anio}-${mesStr}-01`;
  const ultimoDia = new Date(anio, mes, 0).toISOString().split('T')[0];

  const feriados = await Feriado.findAll({
    where: {
      fecha: {
        [Op.between]: [primerDia, ultimoDia]
      },
      [Op.or]: [{ tipo: "nacional" }, { tipo: jurisdiccion }],
      alcance: { [Op.in]: ["judicial", "ambos", "administrativo"] },
    },
    order: [["fecha", "ASC"]],
  });

  return feriados;
};

// obtener feria judicial actual o próxima
export const obtenerFeriaJudicialActual = async (
  jurisdiccion = "nacional"
) => {
  const hoy = new Date().toISOString().split("T")[0];

  // buscar feria actual
  let feria = await FeriaJudicial.findOne({
    where: {
      fecha_inicio: { [Op.lte]: hoy },
      fecha_fin: { [Op.gte]: hoy },
      [Op.or]: [{ jurisdiccion }, { jurisdiccion: "todas" }],
    },
  });

  // si no hay feria actual, buscar la próxima
  if (!feria) {
    feria = await FeriaJudicial.findOne({
      where: {
        fecha_inicio: { [Op.gt]: hoy },
        [Op.or]: [{ jurisdiccion }, { jurisdiccion: "todas" }],
      },
      order: [["fecha_inicio", "ASC"]],
    });
  }

  return feria;
};

// funcion para calcular dias entre dos fechas (para eventos simples)
export const calcularDiasEntreFechas = async ({
  fecha_inicio,
  fecha_fin,
  jurisdiccion = "nacional",
}) => {
  // validaciones
  if (!fecha_inicio || !fecha_fin) {
    throw new AppError("Las fechas de inicio y fin son obligatorias", 400);
  }

  const fechaIni = new Date(fecha_inicio + "T00:00:00");
  const fechaFin = new Date(fecha_fin + "T00:00:00");

  if (fechaFin < fechaIni) {
    throw new AppError("La fecha fin debe ser posterior a la fecha inicio", 400);
  }

  // verificar si la fecha fin es dia habil
  const fechaFinEsHabil = await esDiaHabil(fechaFin, jurisdiccion);
  let razonInhabil = null;
  let sugerenciasFechasHabiles = [];

  if (!fechaFinEsHabil) {
    // determinar por que no es habil
    if (esFinDeSemana(fechaFin)) {
      const diaNombre = fechaFin.getDay() === 0 ? "domingo" : "sábado";
      razonInhabil = `Es ${diaNombre}`;
    } else {
      const feriadoEnc = await esFeriado(fechaFin, jurisdiccion, false); // Buscamos cualquiera para avisar
      if (feriadoEnc) {
        razonInhabil = `Es feriado: ${feriadoEnc.nombre}`;
        if (feriadoEnc.alcance === 'administrativo') {
          razonInhabil += " (Alcance administrativo)";
        }
      } else {
        const feriaEnc = await estaEnFeriaJudicial(fechaFin, jurisdiccion);
        if (feriaEnc) {
          razonInhabil = `Feria judicial (${feriaEnc.periodo})`;
        }
      }
    }

    // sugerir fechas habiles cercanas
    const fechaAntes = new Date(fechaFin);
    fechaAntes.setDate(fechaAntes.getDate() - 1);
    while (!(await esDiaHabil(fechaAntes, jurisdiccion)) && fechaAntes > fechaIni) {
      fechaAntes.setDate(fechaAntes.getDate() - 1);
    }
    if (await esDiaHabil(fechaAntes, jurisdiccion)) {
      sugerenciasFechasHabiles.push(fechaAntes.toISOString().split("T")[0]);
    }

    const fechaDespues = new Date(fechaFin);
    fechaDespues.setDate(fechaDespues.getDate() + 1);
    let intentos = 0;
    while (!(await esDiaHabil(fechaDespues, jurisdiccion)) && intentos < 7) {
      fechaDespues.setDate(fechaDespues.getDate() + 1);
      intentos++;
    }
    if (await esDiaHabil(fechaDespues, jurisdiccion)) {
      sugerenciasFechasHabiles.push(fechaDespues.toISOString().split("T")[0]);
    }
  }

  // contar dias corridos
  const diasCorridos = Math.floor((fechaFin - fechaIni) / (1000 * 60 * 60 * 24));

  // contar dias habiles entre las dos fechas
  let fechaActual = new Date(fechaIni);
  let diasHabiles = 0;
  const feriadosEnMedio = [];

  while (fechaActual <= fechaFin) {
    const fechaStr = fechaActual.toISOString().split("T")[0];

    // Siempre buscamos si es feriado (judicial o administrativo) para la lista informativa
    const feriadoEnc = await esFeriado(fechaActual, jurisdiccion, false);
    if (feriadoEnc) {
      feriadosEnMedio.push({
        fecha: fechaStr,
        nombre: feriadoEnc.nombre,
        tipo: feriadoEnc.tipo,
        alcance: feriadoEnc.alcance
      });
    }

    // Contamos si es hábil judicial
    if (await esDiaHabil(fechaActual, jurisdiccion)) {
      diasHabiles++;
    }

    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return {
    fecha_inicio: fechaIni.toISOString().split("T")[0],
    fecha_fin: fechaFin.toISOString().split("T")[0],
    dias_corridos: diasCorridos,
    dias_habiles: diasHabiles,
    fecha_fin_es_habil: fechaFinEsHabil,
    razon_inhabill: razonInhabil,
    sugerencias_fechas_habiles: sugerenciasFechasHabiles,
    feriados_en_medio: feriadosEnMedio,
    jurisdiccion,
  };
};

export default {
  calcularVencimiento,
  obtenerFeriadosMes,
  calcularDiasEntreFechas,
  esFeriado,
  esDiaHabil,
  estaEnFeriaJudicial,
};
