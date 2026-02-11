// src/models/MovimientoFinanciero.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const MovimientoFinanciero = sequelize.define(
    "MovimientoFinanciero",
    {
        id_movimiento: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        tipo: {
            type: DataTypes.ENUM("ingreso", "egreso"),
            allowNull: false,
        },
        categoria: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: "otros",
            comment: "Ej: apertura_carpeta, honorarios, consulta, alquiler, matricula, etc.",
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        monto_ars: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        // Soporte para JUS
        monto_jus: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: "Cantidad de JUS al momento de la carga",
        },
        valor_jus_referencia: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: "Valor de 1 JUS en pesos al momento de la carga",
        },
        estado: {
            type: DataTypes.ENUM("pendiente", "pagado", "parcial", "anulado"),
            allowNull: false,
            defaultValue: "pendiente",
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
        // Aislamiento de datos: abogado dueño del movimiento
        id_abogado: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "abogados",
                key: "id_abogado",
            },
            comment: "Abogado dueño del movimiento (para aislamiento de datos)",
        },
    },

    {
        tableName: "movimientos_financieros",
        timestamps: true,
        underscored: true,
    }
);

export default MovimientoFinanciero;