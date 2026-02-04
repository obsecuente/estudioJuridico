import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TipoPlazo = sequelize.define(
  "TipoPlazo",
  {
    id_tipo_plazo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    dias_default: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo_dias: {
      type: DataTypes.ENUM('habiles', 'corridos'),
      allowNull: false,
      defaultValue: 'habiles',
    },
    fuero: {
      type: DataTypes.ENUM('civil', 'laboral', 'familia', 'penal', 'comercial', 'generico'),
      defaultValue: 'generico',
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    base_legal: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "tipos_plazo",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    freezeTableName: true,
  }
);

export default TipoPlazo;
