import { Cliente, Consulta, Caso, Abogado } from "../models/index.js";
import { Op } from "sequelize";
//* Service de consultas - panel ADMIN
//* Maneja la creacion y gestion de consultas desde el panel administrativo
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export const crear = async (datosConsulta) => {
  /**
   * Crea una nueva consulta en la base de datos
   *
   * @param {Object} datosConsulta - Datos de la consulta
   * @param {string} datosConsulta.mensaje - Mensaje de la consulta
   * @param {number} datosConsulta.id_cliente - ID del cliente que hace la consulta
   * @param {number} datosConsulta.id_abogado_asignado - ID del abogado asignado (opcional)
   * @param {string} datosConsulta.estado - Estado de la consulta (pendiente, en_progreso, resuelta)
   * @returns {Promise<Object>} Consulta creada
   * @throws {AppError} Si faltan datos o el cliente no existe
   */

  const { mensaje, id_cliente, id_abogado_asignado, estado } = datosConsulta;

  if (!mensaje || !id_cliente) {
    throw new AppError("El mensaje y el ID del cliente son obligatorios.", 400);
  }

  if (mensaje.trim().length < 10) {
    throw new AppError("El mensaje debe contener al menos 10 carácteres.", 400);
  }

  const clienteExiste = await Cliente.findByPk(id_cliente);
  if (!clienteExiste) {
    throw new AppError("El cliente especificado no existe", 404);
  }

  if (id_abogado_asignado) {
    const abogadoExiste = await Abogado.findByPk(id_abogado_asignado);
    if (!abogadoExiste) {
      throw new AppError("El abogado especificado no existe.", 404);
    }
  }

  const estadosValidos = ["pendiente", "en_progreso", "resuelta"];
  if (estado && !estadosValidos.includes(estado)) {
    //* si no coincide el estado con pendiente,progreso,resulto ingresa al if lanzando el error
    throw new AppError(
      `El estado debe ser alguno de estos procesos: ${estadosValidos.join(
        ", "
      )}`,
      400
    );
  }

  try {
    const nuevaConsulta = await Consulta.create({
      mensaje: mensaje.trim(),
      id_cliente,
      id_abogado_asignado: id_abogado_asignado || null,
      estado: estado || "pendiente",
      fecha_envio: new Date(),
    });

    // Traer la consulta con las relaciones incluidas
    const consultaCompleta = await Consulta.findByPk(
      nuevaConsulta.id_consulta,
      {
        include: [
          {
            model: Cliente, // indica que debe buscar y adjuntar la informacion del modelo
            as: "cliente",
            attributes: ["id_cliente", "nombre", "apellido", "email"], //solamente traerá las columnas especificas de la tabla cliente
          },
          {
            model: Abogado,
            as: "abogado",
            attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
          },
        ],
      }
    );

    return consultaCompleta;
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    throw new AppError(
      "Error al crear la consulta en la base de datos [consultas_service.js]",
      500
    );
  }
};

export default { crear };
