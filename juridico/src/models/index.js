// src/models/index.js
import sequelize from "../config/database.js";
import Cliente from "./Cliente.js";
import Abogado from "./Abogado.js";
import Consulta from "./Consulta.js";
import Caso from "./Caso.js";
import Documento from "./Documento.js";
import Auditoria from "./Auditoria.js";
import ResumenIA from "./ResumenIA.js";
import Evento from "./Evento.js";
import Vencimiento from "./Vencimiento.js";
import Feriado from "./Feriado.js";
import FeriaJudicial from "./FeriaJudicial.js";
import TipoPlazo from "./TipoPlazo.js";

// Modelos financieros
import MovimientoFinanciero from "./MovimientoFinanciero.js";
import Cuota from "./Cuota.js";
import ConfiguracionEstudio from "./ConfiguracionEstudio.js";
import GastoRecurrente from "./GastoRecurrente.js";

import CierreMensual from "./CierreMensual.js";

// Modelo de tareas
import Tarea from "./Tarea.js";

// Fase 2: nuevos modelos
import EtapaLegal from "./EtapaLegal.js";
import Etiqueta from "./Etiqueta.js";
import EtiquetaCaso from "./EtiquetaCaso.js";
import HistorialCaso from "./HistorialCaso.js";

// --- Relaciones existentes ---

// CierreMensual
CierreMensual.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });
Abogado.hasMany(CierreMensual, { foreignKey: "id_abogado", as: "cierres" });

// Cliente
Cliente.hasMany(Consulta, { foreignKey: "id_cliente", as: "consultas" });
Consulta.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });

Cliente.hasMany(Caso, { foreignKey: "id_cliente", as: "casos" });
Caso.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });

// Abogado
Abogado.hasMany(Consulta, { foreignKey: "id_abogado_asignado", as: "consultas" });
Consulta.belongsTo(Abogado, { foreignKey: "id_abogado_asignado", as: "abogado" });

Abogado.hasMany(Caso, { foreignKey: "id_abogado", as: "casos" });
Caso.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });

// Caso con Documentos
Caso.hasMany(Documento, { foreignKey: "id_caso", as: "documentos" });
Documento.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });

// Auditoria
Abogado.hasMany(Auditoria, { foreignKey: "id_usuario", as: "auditorias" });
Auditoria.belongsTo(Abogado, { foreignKey: "id_usuario", as: "usuario" });

// ResumenIA
Documento.hasOne(ResumenIA, { foreignKey: "id_documento", as: "resumen" });
ResumenIA.belongsTo(Documento, { foreignKey: "id_documento", as: "documento" });
ResumenIA.belongsTo(Abogado, { foreignKey: "id_usuario_creo", as: "usuario" });

// Evento
Evento.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });
Caso.hasMany(Evento, { foreignKey: "id_caso", as: "eventos" });
Evento.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });
Cliente.hasMany(Evento, { foreignKey: "id_cliente", as: "eventos" });
Evento.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });
Abogado.hasMany(Evento, { foreignKey: "id_abogado", as: "eventos" });

// Vencimiento
Vencimiento.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });
Caso.hasMany(Vencimiento, { foreignKey: "id_caso", as: "vencimientos" });
Vencimiento.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });
Abogado.hasMany(Vencimiento, { foreignKey: "id_abogado", as: "vencimientos" });

// --- Relaciones financieras ---

Cliente.hasMany(MovimientoFinanciero, { foreignKey: "id_cliente", as: "movimientos" });
MovimientoFinanciero.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });

Caso.hasMany(MovimientoFinanciero, { foreignKey: "id_caso", as: "movimientos" });
MovimientoFinanciero.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });

MovimientoFinanciero.hasMany(Cuota, { foreignKey: "id_movimiento", as: "cuotas" });
Cuota.belongsTo(MovimientoFinanciero, { foreignKey: "id_movimiento", as: "movimiento" });

// Gastos recurrentes
Abogado.hasMany(GastoRecurrente, { foreignKey: "id_abogado", as: "gastos_recurrentes" });
GastoRecurrente.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });

GastoRecurrente.hasMany(MovimientoFinanciero, { foreignKey: "id_gasto_recurrente", as: "movimientos" });
MovimientoFinanciero.belongsTo(GastoRecurrente, { foreignKey: "id_gasto_recurrente", as: "gasto_recurrente" });

// --- Relaciones de tareas ---

Abogado.hasMany(Tarea, { foreignKey: "id_abogado", as: "tareas" });
Tarea.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });

Caso.hasMany(Tarea, { foreignKey: "id_caso", as: "tareas" });
Tarea.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });

// --- Fase 2: relaciones nuevas ---

// Etiquetas por abogado
Abogado.hasMany(Etiqueta, { foreignKey: "id_abogado", as: "etiquetas" });
Etiqueta.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });

// Caso <-> Etiqueta (many-to-many via EtiquetaCaso)
Caso.belongsToMany(Etiqueta, { through: EtiquetaCaso, foreignKey: "id_caso", as: "etiquetas" });
Etiqueta.belongsToMany(Caso, { through: EtiquetaCaso, foreignKey: "id_etiqueta", as: "casos" });

// Historial de caso
Caso.hasMany(HistorialCaso, { foreignKey: "id_caso", as: "historial" });
HistorialCaso.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });
HistorialCaso.belongsTo(Abogado, { foreignKey: "id_usuario", as: "usuario" });

export {
  sequelize,
  Cliente,
  Abogado,
  Consulta,
  Caso,
  Documento,
  Auditoria,
  ResumenIA,
  Evento,
  Vencimiento,
  Feriado,
  FeriaJudicial,
  TipoPlazo,
  MovimientoFinanciero,
  Cuota,
  ConfiguracionEstudio,
  Tarea,
  GastoRecurrente,
  EtapaLegal,
  Etiqueta,
  EtiquetaCaso,
  HistorialCaso,
};

export default {
  sequelize,
  Cliente,
  Abogado,
  Consulta,
  Caso,
  Documento,
  Auditoria,
  ResumenIA,
  Evento,
  Vencimiento,
  Feriado,
  FeriaJudicial,
  TipoPlazo,
  MovimientoFinanciero,
  Cuota,
  ConfiguracionEstudio,
  Tarea,
  GastoRecurrente,
  EtapaLegal,
  Etiqueta,
  EtiquetaCaso,
  HistorialCaso,
};