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

// NUEVOS MODELOS FINANCIEROS
import MovimientoFinanciero from "./MovimientoFinanciero.js";
import Cuota from "./Cuota.js";
import ConfiguracionEstudio from "./ConfiguracionEstudio.js";
import GastoRecurrente from "./GastoRecurrente.js";

// MODELO DE TAREAS
import Tarea from "./Tarea.js";

// --- RELACIONES EXISTENTES ---

// Relaciones de Cliente
Cliente.hasMany(Consulta, { foreignKey: "id_cliente", as: "consultas" });
Consulta.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });

Cliente.hasMany(Caso, { foreignKey: "id_cliente", as: "casos" });
Caso.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });

// Relaciones de Abogado
Abogado.hasMany(Consulta, { foreignKey: "id_abogado_asignado", as: "consultas" });
Consulta.belongsTo(Abogado, { foreignKey: "id_abogado_asignado", as: "abogado" });

Abogado.hasMany(Caso, { foreignKey: "id_abogado", as: "casos" });
Caso.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });

// Relaciones de Caso con Documentos
Caso.hasMany(Documento, { foreignKey: "id_caso", as: "documentos" });
Documento.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });

// Relaciones de Auditoría
Abogado.hasMany(Auditoria, { foreignKey: "id_usuario", as: "auditorias" });
Auditoria.belongsTo(Abogado, { foreignKey: "id_usuario", as: "usuario" });

// Relaciones de ResumenIA
Documento.hasOne(ResumenIA, { foreignKey: "id_documento", as: "resumen" });
ResumenIA.belongsTo(Documento, { foreignKey: "id_documento", as: "documento" });
ResumenIA.belongsTo(Abogado, { foreignKey: "id_usuario_creo", as: "usuario" });

// Relaciones de Evento
Evento.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });
Caso.hasMany(Evento, { foreignKey: "id_caso", as: "eventos" });
Evento.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });
Cliente.hasMany(Evento, { foreignKey: "id_cliente", as: "eventos" });
Evento.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });
Abogado.hasMany(Evento, { foreignKey: "id_abogado", as: "eventos" });

// Relaciones de Vencimiento
Vencimiento.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });
Caso.hasMany(Vencimiento, { foreignKey: "id_caso", as: "vencimientos" });
Vencimiento.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });
Abogado.hasMany(Vencimiento, { foreignKey: "id_abogado", as: "vencimientos" });

// --- NUEVAS RELACIONES FINANCIERAS ---

// Movimientos vinculados a Clientes y Casos
Cliente.hasMany(MovimientoFinanciero, { foreignKey: "id_cliente", as: "movimientos" });
MovimientoFinanciero.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });

Caso.hasMany(MovimientoFinanciero, { foreignKey: "id_caso", as: "movimientos" });
MovimientoFinanciero.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });

// Relación Movimiento <-> Cuotas
MovimientoFinanciero.hasMany(Cuota, { foreignKey: "id_movimiento", as: "cuotas" });
Cuota.belongsTo(MovimientoFinanciero, { foreignKey: "id_movimiento", as: "movimiento" });

// --- RELACIONES GASTOS RECURRENTES ---
Abogado.hasMany(GastoRecurrente, { foreignKey: "id_abogado", as: "gastos_recurrentes" });
GastoRecurrente.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });

GastoRecurrente.hasMany(MovimientoFinanciero, { foreignKey: "id_gasto_recurrente", as: "movimientos" });
MovimientoFinanciero.belongsTo(GastoRecurrente, { foreignKey: "id_gasto_recurrente", as: "gasto_recurrente" });

// --- RELACIONES DE TAREAS ---

// Tareas vinculadas a Abogados (obligatorio)
Abogado.hasMany(Tarea, { foreignKey: "id_abogado", as: "tareas" });
Tarea.belongsTo(Abogado, { foreignKey: "id_abogado", as: "abogado" });

// Tareas vinculadas a Casos (opcional)
Caso.hasMany(Tarea, { foreignKey: "id_caso", as: "tareas" });
Tarea.belongsTo(Caso, { foreignKey: "id_caso", as: "caso" });

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
};