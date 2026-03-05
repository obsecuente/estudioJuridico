import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Modelo Documento
 *
 * Almacena información de archivos relacionados con casos
 * (contratos, escritos, evidencias, etc.)
 */

const Documento = sequelize.define(
  "Documento",
  {
    id_documento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    nombre_archivo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "El nombre del archivo no puede estar vacío",
        },
      },
    },

    ruta: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Ruta completa donde se almacena el archivo",
    },

    // Fase 2: metadata de archivo
    tamanio_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tipo_mime: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tiene_ia_disponible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    motivo_ia_no_disponible: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    // FOREIGN KEY hacia Caso
    id_caso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "casos",
        key: "id_caso",
      },
    },
  },
  {
    tableName: "documentos",
    timestamps: false,
  }
);

export default Documento;
