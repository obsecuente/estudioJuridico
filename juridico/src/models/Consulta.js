import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo Consulta
 *
 * Representa las consultas/preguntas de los clientes
 * Tiene relaciones con Cliente y Abogado (Foreign Keys)
 */

const Consulta = sequelize.define(
  "Consulta",
  {
    id_consulta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    mensaje: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },

    estado: {
      type: DataTypes.ENUM("pendiente", "en_progreso", "resuelta"),
      allowNull: true,
      defaultValue: "pendiente",
      validate: {
        isIn: [["pendiente", "en_progreso", "resuelta"]],
      },
    },

    // FOREIGN KEY hacia Cliente
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "clientes", // Nombre de la tabla referenciada
        key: "id_cliente", // Columna referenciada
      },
    },

    // FOREIGN KEY hacia Abogado (puede ser null)
    id_abogado_asignado: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "abogados",
        key: "id_abogado",
      },
    },
  },
  {
    tableName: "consultas",
    timestamps: false,
  }
);

export default Consulta;
