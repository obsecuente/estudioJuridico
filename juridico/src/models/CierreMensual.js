import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const CierreMensual = sequelize.define(
    "CierreMensual",
    {
        id_cierre: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        mes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 12 },
        },
        anio: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        total_ingresos: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        total_egresos: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        balance: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        cantidad_casos_nuevos: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        cantidad_casos_cerrados: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        id_abogado: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "abogados",
                key: "id_abogado",
            },
        },
        es_snapshot: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "Indica que es un registro histórico inmutable",
        },
    },
    {
        tableName: "cierres_mensuales",
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ["anio", "mes", "id_abogado"],
            },
        ],
    }
);

export default CierreMensual;
