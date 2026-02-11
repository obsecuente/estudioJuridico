// src/models/GastoRecurrente.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const GastoRecurrente = sequelize.define(
    "GastoRecurrente",
    {
        id_gasto_recurrente: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        categoria: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: "Ej: alquiler, internet, matricula, aportes, caja_forense, etc.",
        },
        descripcion: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: "Descripción personalizada del gasto",
        },
        monto_ars: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        dia_vencimiento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 28,
            },
            comment: "Día del mes en que vence (1-28 para evitar problemas con feb)",
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        tableName: "gastos_recurrentes",
        timestamps: true,
        underscored: true,
    }
);

export default GastoRecurrente;
