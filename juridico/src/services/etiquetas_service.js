// src/services/etiquetas_service.js
import { Etiqueta, EtiquetaCaso, Caso } from "../models/index.js";

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

// Listar etiquetas del abogado
export const listar = async (idAbogado) => {
    return Etiqueta.findAll({
        where: { id_abogado: idAbogado },
        order: [["nombre", "ASC"]],
    });
};

// Crear etiqueta
export const crear = async (idAbogado, nombre, colorHex = "#6366f1") => {
    if (!nombre || !nombre.trim()) {
        throw new AppError("El nombre es obligatorio", 400);
    }
    return Etiqueta.create({
        nombre: nombre.trim(),
        color_hex: colorHex,
        id_abogado: idAbogado,
    });
};

// Eliminar etiqueta
export const eliminar = async (idEtiqueta, idAbogado) => {
    const etiqueta = await Etiqueta.findOne({
        where: { id_etiqueta: idEtiqueta, id_abogado: idAbogado },
    });
    if (!etiqueta) throw new AppError("Etiqueta no encontrada", 404);

    // Eliminar pivotes primero
    await EtiquetaCaso.destroy({ where: { id_etiqueta: idEtiqueta } });
    await etiqueta.destroy();

    return { message: "Etiqueta eliminada" };
};

// Asignar etiqueta a caso
export const asignarACaso = async (idCaso, idEtiqueta) => {
    const caso = await Caso.findByPk(idCaso);
    if (!caso) throw new AppError("Caso no encontrado", 404);

    const etiqueta = await Etiqueta.findByPk(idEtiqueta);
    if (!etiqueta) throw new AppError("Etiqueta no encontrada", 404);

    const [pivot, created] = await EtiquetaCaso.findOrCreate({
        where: { id_caso: idCaso, id_etiqueta: idEtiqueta },
    });

    return { pivot, created };
};

// Quitar etiqueta de caso
export const quitarDeCaso = async (idCaso, idEtiqueta) => {
    const deleted = await EtiquetaCaso.destroy({
        where: { id_caso: idCaso, id_etiqueta: idEtiqueta },
    });
    if (!deleted) throw new AppError("La etiqueta no estaba asignada a este caso", 404);
    return { message: "Etiqueta removida del caso" };
};

export default { listar, crear, eliminar, asignarACaso, quitarDeCaso };
