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
        // Vinculación con gastos recurrentes
        id_gasto_recurrente: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "gastos_recurrentes",
                key: "id_gasto_recurrente",
            },
            comment: "Si fue generado automáticamente por un gasto recurrente",
        },
        es_recurrente: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: "Indica si este movimiento corresponde a un gasto fijo mensual",
        },
        es_plan_cuotas: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: "Indica si este ingreso tiene plan de cuotas",
        },
        cantidad_cuotas: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Cantidad de cuotas del plan de pago",
        },
        fecha_pago: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "Fecha real de pago (egreso) o cobro (ingreso)",
        },
        fecha_cobro: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "Legacy: Fecha de cobro para ingresos (se intentará unificar con fecha_pago)",
        },
    },

    {
        tableName: "movimientos_financieros",
        timestamps: true,
        underscored: true,
    }
);

export default MovimientoFinanciero;