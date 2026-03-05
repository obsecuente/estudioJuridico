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

    // Fase 2: clasificacion procesal
    instancia: {
      type: DataTypes.ENUM("Extrajudicial", "Administrativa", "Judicial"),
      allowNull: true,
    },
    tipo_proceso: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    jurisdiccion: {
      type: DataTypes.ENUM("nacional", "neuquen", "rio_negro"),
      allowNull: true,
      defaultValue: null,
    },
    fuero: {
      type: DataTypes.ENUM("civil", "laboral", "penal", "familia", "comercial"),
      allowNull: true,
    },
    numero_expediente: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    etapa_actual: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Datos de la contraparte (demandado)
    demandado_nombre: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    demandado_dni_cuit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    demandado_domicilio: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    demandado_tipo: {
      type: DataTypes.ENUM("persona_fisica", "persona_juridica"),
      allowNull: true,
    },

    // Datos del conflicto
    monto_reclamado: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    objeto_del_juicio: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
  },
  {
    tableName: "casos",
    timestamps: false,
  }
);

export default Caso;
