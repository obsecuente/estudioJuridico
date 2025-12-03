import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Abogado = sequelize.define(
  "Abogado",
  {
    id_abogado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    nombre: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [2, 50],
        msg: "El nombre debe tener entre 2 y 50 caracteres",
      },
    },

    apellido: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [2, 50],
        msg: "El apellido debe tener entre 2 y 50 caracteres",
      },
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Debe ser un email válido",
        },
      },
    },

    especialidad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // ENUM: solo puede tener uno de estos valores
    rol: {
      type: DataTypes.ENUM("admin", "abogado", "asistente"),
      allowNull: true,
      defaultValue: "abogado",
      validate: {
        isIn: {
          args: [["admin", "abogado", "asistente"]],
          msg: "El rol debe ser: admin, abogado o asistente",
        },
      },
    },
  },
  { tableName: "abogados", timestamps: false }
);

export default Abogado;
