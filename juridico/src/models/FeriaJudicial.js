import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const FeriaJudicial = sequelize.define(
  "FeriaJudicial",
  {
    id_feria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    periodo: {
      type: DataTypes.ENUM('verano', 'invierno'),
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    jurisdiccion: {
      type: DataTypes.ENUM('nacional', 'neuquen', 'rio_negro', 'todas'),
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "feria_judicial",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    freezeTableName: true,
    indexes: [
      { fields: ['anio'] },
      { fields: ['jurisdiccion'] },
      { unique: true, fields: ['anio', 'periodo', 'jurisdiccion'] }
    ]
  }
);

export default FeriaJudicial;
