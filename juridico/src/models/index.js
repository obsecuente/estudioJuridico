import sequelize from "../config/database.js";
import Cliente from "./cliente.js";
import Abogado from "./Abogado.js";
import Consulta from "./Consulta.js";
import Caso from "./Caso.js";
import Documento from "./Documento.js";
import Auditoria from "./Auditoria.js";
import ResumenIA from "./ResumenIA.js";
import Evento from "./Evento.js";
import Vencimiento from "./Vencimiento.js";

// relaciones de cliente
Cliente.hasMany(Consulta, {
  foreignKey: "id_cliente",
  as: "consultas",
});

Consulta.belongsTo(Cliente, {
  foreignKey: "id_cliente",
  as: "cliente",
});

Cliente.hasMany(Caso, {
  foreignKey: "id_cliente",
  as: "casos",
});

Caso.belongsTo(Cliente, {
  foreignKey: "id_cliente",
  as: "cliente",
});

// relaciones de abogado
Abogado.hasMany(Consulta, {
  foreignKey: "id_abogado_asignado",
  as: "consultas",
});

Consulta.belongsTo(Abogado, {
  foreignKey: "id_abogado_asignado",
  as: "abogado",
});

Abogado.hasMany(Caso, {
  foreignKey: "id_abogado",
  as: "casos",
});

Caso.belongsTo(Abogado, {
  foreignKey: "id_abogado",
  as: "abogado",
});

// relaciones de caso con documentos
Caso.hasMany(Documento, {
  foreignKey: "id_caso",
  as: "documentos",
});

Documento.belongsTo(Caso, {
  foreignKey: "id_caso",
  as: "caso",
});

// relaciones de auditoría
Abogado.hasMany(Auditoria, {
  foreignKey: "id_usuario",
  as: "auditorias",
});

Auditoria.belongsTo(Abogado, {
  foreignKey: "id_usuario",
  as: "usuario",
});

// relaciones de ResumenIA
ResumenIA.belongsTo(Documento, {
  foreignKey: "id_documento",
  as: "documento",
});

Documento.hasOne(ResumenIA, {
  foreignKey: "id_documento",
  as: "resumen",
});

ResumenIA.belongsTo(Abogado, {
  foreignKey: "id_usuario_creo",
  as: "usuario",
});

// relaciones de Evento
Evento.belongsTo(Caso, {
  foreignKey: "id_caso",
  as: "caso",
});

Caso.hasMany(Evento, {
  foreignKey: "id_caso",
  as: "eventos",
});

Evento.belongsTo(Cliente, {
  foreignKey: "id_cliente",
  as: "cliente",
});

Cliente.hasMany(Evento, {
  foreignKey: "id_cliente",
  as: "eventos",
});

Evento.belongsTo(Abogado, {
  foreignKey: "id_abogado",
  as: "abogado",
});

Abogado.hasMany(Evento, {
  foreignKey: "id_abogado",
  as: "eventos",
});

// relaciones de Vencimiento
Vencimiento.belongsTo(Caso, {
  foreignKey: "id_caso",
  as: "caso",
});

Caso.hasMany(Vencimiento, {
  foreignKey: "id_caso",
  as: "vencimientos",
});

Vencimiento.belongsTo(Abogado, {
  foreignKey: "id_abogado",
  as: "abogado",
});

Abogado.hasMany(Vencimiento, {
  foreignKey: "id_abogado",
  as: "vencimientos",
});

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
};
