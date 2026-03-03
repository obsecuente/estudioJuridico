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

    // ── Lead Management Fields ──
    // Nombre del contacto (para leads sin cliente formal)
    nombre_contacto: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    // Teléfono del contacto (para leads sin cliente formal)
    telefono_contacto: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    // FOREIGN KEY hacia Cliente (NULLABLE para leads)
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: true, // ← Ahora nullable para soportar leads
      references: {
        model: "clientes",
        key: "id_cliente",
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
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Consulta;
