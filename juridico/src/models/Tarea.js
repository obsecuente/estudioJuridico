// src/models/Tarea.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Tarea = sequelize.define(
    "Tarea",
    {
        id_tarea: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "La descripción no puede estar vacía",
                },
            },
        },
        completada: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        prioridad: {
            type: DataTypes.ENUM("baja", "media", "alta"),
            allowNull: false,
            defaultValue: "media",
        },
        fecha_limite: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "Fecha límite opcional para completar la tarea",
        },
        id_abogado: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "abogados",
                key: "id_abogado",
            },
        },
        id_caso: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "casos",
                key: "id_caso",
            },
            comment: "Vinculación opcional a un expediente",
        },
        categoria: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "Categoría libre (procuración, escrito, comunicación, gestión, etc.)",
        },
        en_plazo_gracia: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: "Si la tarea fue pasada al plazo de gracia (Art. 124 CPCC)",
        },
        hora_limite: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: "Hora límite específica (ej: 09:30 para plazo de gracia)",
        },
    },
    {
        tableName: "tareas",
        timestamps: true,
        underscored: true,
    }
);

export default Tarea;
