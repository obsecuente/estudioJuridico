// src/models/EtapaLegal.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EtapaLegal = sequelize.define(
    "EtapaLegal",
    {
        id_etapa: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        instancia: {
            type: DataTypes.ENUM("Extrajudicial", "Administrativa", "Judicial"),
            allowNull: false,
        },
        tipo_proceso: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        numero_etapa: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        descripcion_corta: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        porcentaje_honorarios: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
    },
    {
        tableName: "etapas_legales",
        timestamps: false,
    }
);

export default EtapaLegal;
