import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Modelo Cliente
const Cliente = sequelize.define(
  "Cliente",
  {
    id_cliente: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    // Tipo de persona — determina qué campos se requieren para apertura de carpeta
    tipo_persona: {
      type: DataTypes.ENUM("fisica", "juridica"),
      allowNull: true,
      defaultValue: "fisica",
    },

    nombre: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [2, 50], msg: "El nombre debe tener entre 2 y 50 caracteres" },
      },
    },
    apellido: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: { args: [2, 50], msg: "El apellido debe tener entre 2 y 50 caracteres" },
      },
    },

    telefono: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        is: { args: /^\+[1-9]\d{7,14}$/, msg: "Formato de telefono inválido" },
      },
    },

    // Email opcional — sin unique a nivel columna para permitir múltiples nulls en MySQL
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmailIfPresent(value) {
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            throw new Error("Debe ser un email válido");
          }
        },
      },
    },

    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    consentimiento_datos: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    // Identificacion — persona fisica
    dni: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },

    // Identificacion — persona juridica
    cuit: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },

    // Datos personales — persona fisica
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    estado_civil: {
      type: DataTypes.ENUM("soltero", "casado", "divorciado", "viudo", "union_convivencial"),
      allowNull: true,
    },
    profesion: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Domicilio real (persona fisica)
    domicilio_real: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    localidad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    provincia: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Neuquén",
    },

    // Datos empresa — persona juridica
    razon_social: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    domicilio_sede: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    // Contacto alternativo
    contacto_alternativo_nombre: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    contacto_alternativo_telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    // Virtual: calculado al leer, no persiste en DB
    perfil_completo_bool: {
      type: DataTypes.VIRTUAL,
      get() {
        const tipo = this.getDataValue("tipo_persona") || "fisica";
        if (tipo === "juridica") {
          return !!(
            this.getDataValue("cuit") &&
            this.getDataValue("razon_social") &&
            this.getDataValue("domicilio_sede")
          );
        }
        return !!(
          this.getDataValue("dni") &&
          this.getDataValue("domicilio_real") &&
          this.getDataValue("fecha_nacimiento")
        );
      },
    },
    porcentaje_perfil: {
      type: DataTypes.VIRTUAL,
      get() {
        const tipo = this.getDataValue("tipo_persona") || "fisica";
        const campos = tipo === "juridica"
          ? ["cuit", "razon_social", "domicilio_sede", "localidad"]
          : ["dni", "domicilio_real", "fecha_nacimiento", "estado_civil", "profesion", "localidad"];
        const completos = campos.filter(c => !!this.getDataValue(c)).length;
        if (campos.length === 0) return 0;
        return Math.round((completos / campos.length) * 100);
      }
    },
  },
  { tableName: "clientes", timestamps: false, freezeTableName: true }
);

export default Cliente;
