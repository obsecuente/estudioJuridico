import { Documento, Caso, Cliente, Abogado } from "../models/index.js";
import path from "path";
import fs from "fs";

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
export const crear = async (datosDocumento, archivo) => {
  /**
   * Crea un registro de documento y guarda el archivo
   *
   * @param {Object} datosDocumento - Datos del documento
   * @param {number} datosDocumento.id_caso - ID del caso (OBLIGATORIO)
   * @param {Object} archivo - Archivo subido por Multer
   * @returns {Promise<Object>} Documento creado
   * @throws {AppError} Si falta el caso o el archivo
   */

  const { id_caso } = datosDocumento;

  if (!id_caso) {
    throw new AppError("El ID del caso es obligatorio", 400);
  }

  if (!archivo) {
    throw new AppError("Debe proporcionar un archivo", 400);
  }

  // Validar que el caso existe
  const casoExiste = await Caso.findByPk(id_caso);
  if (!casoExiste) {
    throw new AppError("El caso especificado no existe", 404);
  }

  // Mover archivo de /temp a /casos/{id_caso}
  const rutaDestino = path.join(
    process.cwd(),
    "uploads",
    "casos",
    id_caso.toString()
  );

  // Crear carpeta del caso si no existe
  if (!fs.existsSync(rutaDestino)) {
    fs.mkdirSync(rutaDestino, { recursive: true });
  }

  // Ruta final del archivo
  const rutaFinal = path.join(rutaDestino, archivo.filename);

  // Mover archivo de temp a casos/{id_caso}
  try {
    fs.renameSync(archivo.path, rutaFinal);
  } catch (error) {
    console.error("Error al mover archivo:", error);
    throw new AppError("Error al guardar el archivo", 500);
  }

  // Crear registro en la base de datos con la ruta final
  const nuevoDocumento = await Documento.create({
    nombre_archivo: archivo.filename,
    ruta: rutaFinal,
    id_caso,
  });

  // Devolver documento con info del caso
  const documentoCompleto = await Documento.findByPk(
    nuevoDocumento.id_documento,
    {
      include: [
        {
          model: Caso,
          as: "caso",
          attributes: ["id_caso", "descripcion", "estado"],
          include: [
            {
              model: Cliente,
              as: "cliente",
              attributes: ["id_cliente", "nombre", "apellido"],
            },
            {
              model: Abogado,
              as: "abogado",
              attributes: ["id_abogado", "nombre", "apellido"],
            },
          ],
        },
      ],
    }
  );

  return documentoCompleto;
};
export const obtenerPorCaso = async (id_caso) => {
  /**
   * Obtiene todos los documentos de un caso
   *
   * @param {number} id_caso - ID del caso
   * @returns {Promise<Array>} Lista de documentos
   */

  const documentos = await Documento.findAll({
    where: { id_caso },
    order: [["id_documento", "DESC"]],
  });

  return documentos;
};
export const obtenerPorId = async (id) => {
  /**
   * Obtiene un documento específico
   *
   * @param {number} id - ID del documento
   * @returns {Promise<Object>} Documento con info del caso
   * @throws {AppError} Si el documento no existe
   */

  const documento = await Documento.findByPk(id, {
    include: [
      {
        model: Caso,
        as: "caso",
        attributes: ["id_caso", "descripcion", "estado"],
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: ["id_cliente", "nombre", "apellido", "email"],
          },
          {
            model: Abogado,
            as: "abogado",
            attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
          },
        ],
      },
    ],
  });

  if (!documento) {
    throw new AppError("Documento no encontrado", 404);
  }

  return documento;
};
export const eliminar = async (id) => {
  /**
   * Elimina un documento de la BD y del filesystem
   *
   * @param {number} id - ID del documento
   * @returns {Promise<Object>} Mensaje de éxito
   * @throws {AppError} Si el documento no existe o hay error al eliminar archivo
   */

  const documento = await Documento.findByPk(id);

  if (!documento) {
    throw new AppError("Documento no encontrado", 404);
  }

  // Guardar ruta antes de eliminar de BD
  const rutaArchivo = documento.ruta;

  // Eliminar registro de BD
  await documento.destroy();

  // Eliminar archivo físico
  try {
    if (fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
    }
  } catch (error) {
    console.error("Error al eliminar archivo físico:", error);
    // No lanzar error porque ya se eliminó de BD
  }

  return {
    message: "Documento eliminado exitosamente",
    id: id,
  };
};
export const descargar = async (id) => {
  /**
   * Obtiene la ruta del archivo para descarga
   *
   * @param {number} id - ID del documento
   * @returns {Promise<Object>} { ruta, nombre_archivo }
   * @throws {AppError} Si el documento no existe o el archivo no se encuentra
   */

  const documento = await Documento.findByPk(id);

  if (!documento) {
    throw new AppError("Documento no encontrado", 404);
  }

  // Verificar que el archivo existe físicamente
  if (!fs.existsSync(documento.ruta)) {
    throw new AppError("El archivo físico no existe en el servidor", 404);
  }

  return {
    ruta: documento.ruta,
    nombre_archivo: documento.nombre_archivo,
  };
};
export const obtenerTodos = async (opciones = {}) => {
  /**
   * Obtiene lista de documentos con paginación
   *
   * @param {Object} opciones - Opciones de consulta
   * @param {number} opciones.page - Página actual
   * @param {number} opciones.limit - Documentos por página
   * @returns {Promise<Object>} { documentos, pagination }
   */

  const { page = 1, limit = 20 } = opciones;

  const offset = (page - 1) * limit;

  const { count, rows: documentos } = await Documento.findAndCountAll({
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["id_documento", "DESC"]],
    include: [
      {
        model: Caso,
        as: "caso",
        attributes: ["id_caso", "descripcion", "estado"],
        include: [
          {
            model: Cliente,
            as: "cliente",
            attributes: ["id_cliente", "nombre", "apellido"],
          },
          {
            model: Abogado,
            as: "abogado",
            attributes: ["id_abogado", "nombre", "apellido"],
          },
        ],
      },
    ],
  });

  return {
    documentos,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};
export default {
  crear,
  obtenerPorCaso,
  obtenerPorId,
  eliminar,
  descargar,
  obtenerTodos,
};
