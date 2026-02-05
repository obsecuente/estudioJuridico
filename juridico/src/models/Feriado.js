import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Feriado = sequelize.define(
  "Feriado",
  {
    id_feriado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('nacional', 'neuquen', 'rio_negro', 'otro'),
      allowNull: false,
    },
    alcance: {
      type: DataTypes.ENUM('administrativo', 'judicial', 'ambos'),
      allowNull: false,
      defaultValue: 'ambos',
    },
    es_trasladable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "feriados",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    freezeTableName: true,
    indexes: [
      { fields: ['fecha'] },
      { fields: ['tipo'] },
      { unique: true, fields: ['fecha', 'tipo'] }
    ]
  }
);

export default Feriado;
