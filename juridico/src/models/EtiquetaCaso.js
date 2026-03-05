// src/models/EtiquetaCaso.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const EtiquetaCaso = sequelize.define(
    "EtiquetaCaso",
    {
        id: {
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
        id_etiqueta: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "etiquetas",
                key: "id_etiqueta",
            },
        },
    },
    {
        tableName: "etiquetas_casos",
        timestamps: false,
    }
);

export default EtiquetaCaso;
