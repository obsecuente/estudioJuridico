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
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [7, 8],
          msg: "El DNI debe tener 7 u 8 dígitos.",
        },
      },
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true,
      validate: {
        is: {
          args: /^\+[1-9]\d{7,14}$/,
          msg: "Formato de telefono inválido",
        },
      },
      defaultValue: "+555555555555",
    },

    nombre: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [2, 50], //
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

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    especialidad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

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
    scopes: {
      defaultScope: {
        attributes: {
          exclude: ["password"],
        },
      },
      withPassword: {
        attributes: {
          include: ["password"],
        },
      },
    },
  }
);

export default Abogado;
