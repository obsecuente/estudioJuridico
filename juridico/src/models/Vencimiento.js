import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Vencimiento = sequelize.define(
  "Vencimiento",
  {
    id_vencimiento: {
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

    tipo_vencimiento: {
      type: DataTypes.ENUM(
        "contestacion_demanda",
        "apelacion",
        "recurso",
        "traslado",
        "ofrecimiento_prueba",
        "alegato",
        "expresion_agravios",
        "prescripcion",
        "caducidad",
        "otro",
      ),
      allowNull: false,
      defaultValue: "otro",
    },

    fecha_limite: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    dias_alerta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: "Días antes de la fecha límite para alertar",
    },

    estado: {
      type: DataTypes.ENUM("pendiente", "cumplido", "vencido"),
      allowNull: false,
      defaultValue: "pendiente",
    },

    prioridad: {
      type: DataTypes.ENUM("alta", "media", "baja"),
      allowNull: false,
      defaultValue: "media",
    },

    id_caso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "casos",
        key: "id_caso",
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

    notificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Si ya se envió notificación de alerta",
    },

    fecha_cumplimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Fecha en que se marcó como cumplido",
    },

    notas_cumplimiento: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Notas al marcar como cumplido",
    },
  },
  {
    tableName: "vencimientos",
    timestamps: true,
    underscored: true,
  },
);

export default Vencimiento;
