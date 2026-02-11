// src/models/Cuota.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Cuota = sequelize.define(
    "Cuota",
    {
        id_cuota: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        numero_cuota: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        monto_cuota: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        fecha_vencimiento: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: "Día que debería cobrarse",
        },
        fecha_pago_efectivo: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "Día en que se cobró realmente",
        },
        estado: {
            type: DataTypes.ENUM("pendiente", "pagado", "vencido"),
            allowNull: false,
            defaultValue: "pendiente",
        },
        id_movimiento: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "movimientos_financieros",
                key: "id_movimiento",
            },
        },
    },
    {
        tableName: "cuotas",
        timestamps: true,
        underscored: true,
    }
);

export default Cuota;