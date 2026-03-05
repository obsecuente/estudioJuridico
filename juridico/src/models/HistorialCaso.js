// src/models/HistorialCaso.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const HistorialCaso = sequelize.define(
    "HistorialCaso",
    {
        id_historial: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        id_caso: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "casos",
                key: "id_caso",
            },
        },
        tipo_evento: {
            type: DataTypes.ENUM(
                "NOTA_MANUAL",
                "SISTEMA_DOCUMENTO",
                "SISTEMA_FINANZAS",
                "SISTEMA_VENCIMIENTO",
                "CAMBIO_ESTADO",
                "CAMBIO_ETAPA"
            ),
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "abogados",
                key: "id_abogado",
            },
        },
        fecha_registro: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        es_importante: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        tableName: "historial_casos",
        timestamps: false,
    }
);

export default HistorialCaso;
