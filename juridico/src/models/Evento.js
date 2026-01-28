import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Evento = sequelize.define(
  "Evento",
  {
    id_evento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El título es obligatorio",
        },
        len: {
          args: [3, 150],
          msg: "El título debe tener entre 3 y 150 caracteres",
        },
      },
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tipo: {
      type: DataTypes.ENUM(
        "audiencia",
        "reunion",
        "tarea",
        "vencimiento",
        "otro",
      ),
      allowNull: false,
      defaultValue: "otro",
    },

    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    hora_fin: {
      type: DataTypes.TIME,
      allowNull: true,
    },

    todo_el_dia: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    estado: {
      type: DataTypes.ENUM("pendiente", "completado", "cancelado"),
      allowNull: false,
      defaultValue: "pendiente",
    },

    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#3b82f6",
      validate: {
        is: {
          args: /^#[0-9A-Fa-f]{6}$/,
          msg: "El color debe ser un código hexadecimal válido",
        },
      },
    },

    ubicacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    recordatorio: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 60,
      comment: "Minutos antes del evento para recordar",
    },

    recordatorio_enviado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    id_caso: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "casos",
        key: "id_caso",
      },
    },

    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "clientes",
        key: "id_cliente",
      },
    },

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
    tableName: "eventos",
    timestamps: true,
    underscored: true,
  },
);

export default Evento;
