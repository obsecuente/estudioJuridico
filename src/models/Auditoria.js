import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Auditoria = sequelize.define(
  "Auditoria",
  {
    id_auditoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "abogados",
        key: "id_abogado",
      },
    },

    accion: {
      type: DataTypes.ENUM(
        "CREAR",
        "ACTUALIZAR",
        "ELIMINAR",
        "LOGIN",
        "LOGOUT",
        "CAMBIAR_PASSWORD",
        "RECUPERAR_PASSWORD",
        "ASIGNAR",
        "CAMBIAR_ESTADO"
      ),
      allowNull: false,
    },

    entidad: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "cliente, caso, consulta, documento, abogado",
    },

    id_entidad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID del registro afectado",
    },

    detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON con detalles de la acción",
    },

    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "auditoria",
    timestamps: false,
  }
);

export default Auditoria;
