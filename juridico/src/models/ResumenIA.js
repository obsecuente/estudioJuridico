import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ResumenIA = sequelize.define(
  "ResumenIA",
  {
    id_resumen: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    id_documento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "documentos",
        key: "id_documento",
      },
      onDelete: "CASCADE",
    },

    resumen_texto: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    modelo_usado: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "llama-3.3-70b-versatile",
    },

    tokens_usados: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    tiempo_procesamiento: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Milisegundos",
    },

    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    id_usuario_creo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "abogados",
        key: "id_abogado",
      },
    },
  },
  {
    tableName: "resumenes_ia",
    timestamps: false,
  }
);

export default ResumenIA;
