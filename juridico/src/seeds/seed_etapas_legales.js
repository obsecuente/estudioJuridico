// src/seeds/seed_etapas_legales.js
import { EtapaLegal, Caso, Documento } from "../models/index.js";

// Seed idempotente: solo crea filas que no existen
const ETAPAS = [
    { instancia: "Judicial", tipo_proceso: "Ordinario", numero_etapa: 1, descripcion: "Demanda / Contestacion", descripcion_corta: "Etapa 1", porcentaje_honorarios: 33.33 },
    { instancia: "Judicial", tipo_proceso: "Ordinario", numero_etapa: 2, descripcion: "Prueba", descripcion_corta: "Etapa 2", porcentaje_honorarios: 33.33 },
    { instancia: "Judicial", tipo_proceso: "Ordinario", numero_etapa: 3, descripcion: "Alegatos / Sentencia", descripcion_corta: "Etapa 3", porcentaje_honorarios: 33.34 },

    { instancia: "Judicial", tipo_proceso: "Ejecutivo", numero_etapa: 1, descripcion: "Demanda / Prueba", descripcion_corta: "Etapa 1", porcentaje_honorarios: 50.00 },
    { instancia: "Judicial", tipo_proceso: "Ejecutivo", numero_etapa: 2, descripcion: "Sentencia / Ejecucion", descripcion_corta: "Etapa 2", porcentaje_honorarios: 50.00 },

    { instancia: "Judicial", tipo_proceso: "Sumarisimo", numero_etapa: 1, descripcion: "Demanda / Prueba", descripcion_corta: "Etapa 1", porcentaje_honorarios: 50.00 },
    { instancia: "Judicial", tipo_proceso: "Sumarisimo", numero_etapa: 2, descripcion: "Sentencia / Ejecucion", descripcion_corta: "Etapa 2", porcentaje_honorarios: 50.00 },

    { instancia: "Judicial", tipo_proceso: "Penal", numero_etapa: 1, descripcion: "Instruccion", descripcion_corta: "Etapa 1", porcentaje_honorarios: 33.33 },
    { instancia: "Judicial", tipo_proceso: "Penal", numero_etapa: 2, descripcion: "Defensa", descripcion_corta: "Etapa 2", porcentaje_honorarios: 33.33 },
    { instancia: "Judicial", tipo_proceso: "Penal", numero_etapa: 3, descripcion: "Sentencia", descripcion_corta: "Etapa 3", porcentaje_honorarios: 33.34 },

    { instancia: "Judicial", tipo_proceso: "Laboral", numero_etapa: 1, descripcion: "Demanda / Contestacion", descripcion_corta: "Etapa 1", porcentaje_honorarios: 33.33 },
    { instancia: "Judicial", tipo_proceso: "Laboral", numero_etapa: 2, descripcion: "Prueba / Audiencia", descripcion_corta: "Etapa 2", porcentaje_honorarios: 33.33 },
    { instancia: "Judicial", tipo_proceso: "Laboral", numero_etapa: 3, descripcion: "Sentencia", descripcion_corta: "Etapa 3", porcentaje_honorarios: 33.34 },
];

export const seedEtapasLegales = async () => {
    let created = 0;
    for (const etapa of ETAPAS) {
        const [, wasCreated] = await EtapaLegal.findOrCreate({
            where: {
                tipo_proceso: etapa.tipo_proceso,
                numero_etapa: etapa.numero_etapa,
            },
            defaults: etapa,
        });
        if (wasCreated) created++;
    }

    return { total: ETAPAS.length, created };
};

export default seedEtapasLegales;
