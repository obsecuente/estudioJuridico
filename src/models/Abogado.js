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
    dni: {
      type: DataTypes.STRING(8),
      allowNull: false, // ← OBLIGATORIO
      unique: {
        name: "unique_dni_abogado",
        msg: "Ya existe un abogado con este DNI",
      },
      validate: {
        is: {
          args: /^[0-9]{7,8}$/,
          msg: "El DNI debe tener 7 u 8 dígitos sin puntos ni guiones",
        },
        notEmpty: {
          msg: "El DNI no puede estar vacío",
        },
      },
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
      allowNull: false, // ← OBLIGATORIO
      validate: {
        is: {
          args: /^\+[1-9]\d{1,14}$/,
          msg: "Formato de teléfono inválido ",
        },
        notEmpty: {
          msg: "El teléfono no puede estar vacío",
        },
      },
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: true, // ← OPCIONAL (puede ser NULL)
      unique: true, // ← Pero si existe, debe ser único
      sparse: true, // ← IMPORTANTE: permite múltiples NULL pero emails únicos
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
  {
    tableName: "abogados",
    timestamps: false,
  }
);

export default Abogado;
