// src/models/ConfiguracionEstudio.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ConfiguracionEstudio = sequelize.define(
    "ConfiguracionEstudio",
    {
        clave: {
            type: DataTypes.STRING(50),
            primaryKey: true,
        },
        valor: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    },
    {
        tableName: "configuracion_estudio",
        timestamps: true,
    }
);

export default ConfiguracionEstudio;