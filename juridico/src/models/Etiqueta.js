// src/models/Etiqueta.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Etiqueta = sequelize.define(
    "Etiqueta",
    {
        id_etiqueta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        nombre: {
            type: DataTypes.STRING(60),
            allowNull: false,
        },
        color_hex: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: "#6366f1",
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
        tableName: "etiquetas",
        timestamps: false,
    }
);

export default Etiqueta;
