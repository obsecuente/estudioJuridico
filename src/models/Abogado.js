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
      allowNull: false,
      validate: {
        is: {
          args: /^\+[1-9]\d{1,14}$/,
          msg: "Formato de teléfono inválido",
        },
        notEmpty: {
          msg: "El teléfono no puede estar vacío",
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
      allowNull: true,
      comment: "Contraseña hasheada con bcrypt",
    },

    // Campos para recuperación de contraseña
    reset_password_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Token temporal para resetear contraseña",
    },

    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de expiración del token de reseteo",
    },

    // Campos para refresh token
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Token para renovar el access token",
    },

    refresh_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de expiración del refresh token",
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

    // Scope por defecto: excluye campos sensibles
    defaultScope: {
      attributes: {
        exclude: [
          "password",
          "reset_password_token",
          "reset_password_expires",
          "refresh_token",
          "refresh_token_expires",
        ],
      },
    },

    // Scopes especiales para cuando necesitamos esos campos
    scopes: {
      withPassword: {
        attributes: { include: ["password"] },
      },
      withResetToken: {
        attributes: {
          include: ["reset_password_token", "reset_password_expires"],
        },
      },
      withRefreshToken: {
        attributes: {
          include: ["refresh_token", "refresh_token_expires"],
        },
      },
    },
  }
);

export default Abogado;
