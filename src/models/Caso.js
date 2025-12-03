// src/models/Caso.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo Caso
 *
 * Representa los casos legales activos o cerrados
 * Relacionado con Cliente y Abogado
 */

const Caso = sequelize.define(
  "Caso",
  {
    id_caso: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM("abierto", "cerrado"),
      allowNull: true,
      defaultValue: "abierto",
      validate: {
        isIn: [["abierto", "cerrado"]],
      },
    },

    fecha_inicio: {
      type: DataTypes.DATEONLY, // Solo fecha (sin hora)
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },

    // FOREIGN KEY hacia Cliente
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "clientes",
        key: "id_cliente",
      },
    },

    // FOREIGN KEY hacia Abogado
    id_abogado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "abogados",
        key: "id_abogado",
      },
    },
  },
  {
    tableName: "casos",
    timestamps: false,
  }
);

export default Caso;
