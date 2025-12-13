import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo Cliente
 *
 * Define la estructura de la tabla 'clientes' en Sequelize
 * Cada propiedad representa una columna de la tabla
 */

const Cliente = sequelize.define(
  "Cliente",
  {
    id_cliente: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [2, 50],
          msg: "El nombre debe tener entre 2 y 50 caracteres",
        },
      },
    },
    apellido: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [2, 50],
          msg: "El apellido debe tener entre 2 y 50 caracteres",
        },
      },
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: false, //? el false lo hace obligatorio
      validate: {
        is: {
          args: /^\+[1-9]\d{7,14}$/,
          msg: "Formato de telefono inválido",
        },
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      sparse: true,
      validate: {
        isEmail: {
          msg: "Debe ser un email válido",
        },
      },
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    consentimiento_datos: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  { tableName: "clientes", timestamps: false, freezeTableName: true }
);

export default Cliente;
