import sequelize from "../config/database.js";
import Cliente from "./cliente.js";
import Abogado from "./Abogado.js";
import Consulta from "./Consulta.js";
import Caso from "./Caso.js";
import Documento from "./Documento.js";
import Auditoria from "./Auditoria.js";

/**
 * DEFINICIÓN DE RELACIONES (ASOCIACIONES)
 *
 * Tipos de relaciones en Sequelize:
 * - hasMany: "tiene muchos" (1 a muchos)
 * - belongsTo: "pertenece a" (muchos a 1)
 * - hasOne: "tiene uno" (1 a 1)
 * - belongsToMany: "pertenece a muchos" (muchos a muchos)
 */

// ====================
// RELACIONES DE CLIENTE
// ====================

// Un Cliente puede tener muchas Consultas
Cliente.hasMany(Consulta, {
  foreignKey: "id_cliente",
  as: "consultas", // Alias para usar en queries
});

// Una Consulta pertenece a un Cliente
Consulta.belongsTo(Cliente, {
  foreignKey: "id_cliente",
  as: "cliente",
});

// Un Cliente puede tener muchos Casos
Cliente.hasMany(Caso, {
  foreignKey: "id_cliente",
  as: "casos",
});

// Un Caso pertenece a un Cliente
Caso.belongsTo(Cliente, {
  foreignKey: "id_cliente",
  as: "cliente",
});

// ====================
// RELACIONES DE ABOGADO
// ====================

// Un Abogado puede tener muchas Consultas asignadas
Abogado.hasMany(Consulta, {
  foreignKey: "id_abogado_asignado",
  as: "consultas",
});

// Una Consulta puede tener un Abogado asignado (o ninguno)
Consulta.belongsTo(Abogado, {
  foreignKey: "id_abogado_asignado",
  as: "abogado",
});

// Un Abogado puede tener muchos Casos
Abogado.hasMany(Caso, {
  foreignKey: "id_abogado",
  as: "casos",
});

// Un Caso pertenece a un Abogado
Caso.belongsTo(Abogado, {
  foreignKey: "id_abogado",
  as: "abogado",
});

// ====================
// RELACIONES DE CASO
// ====================

// Un Caso puede tener muchos Documentos
Caso.hasMany(Documento, {
  foreignKey: "id_caso",
  as: "documentos",
});

// Un Documento pertenece a un Caso
Documento.belongsTo(Caso, {
  foreignKey: "id_caso",
  as: "caso",
});

// Relación con Auditoría
Abogado.hasMany(Auditoria, {
  foreignKey: "id_usuario",
  as: "auditorias",
});

Auditoria.belongsTo(Abogado, {
  foreignKey: "id_usuario",
  as: "usuario",
});

export {
  sequelize,
  Cliente,
  Abogado,
  Consulta,
  Caso,
  Documento,
  Auditoria, // NUEVO
};

export default {
  sequelize,
  Cliente,
  Abogado,
  Consulta,
  Caso,
  Documento,
  Auditoria, // NUEVO
};
