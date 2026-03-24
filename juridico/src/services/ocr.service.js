// src/services/ocr.service.js
import Tesseract from "tesseract.js";
import Documento from "../models/Documento.js";
import path from "path";
import fs from "fs/promises";
import IAService from "./ia.service.js";
import { Op } from "sequelize";

/**
 * Servicio de OCR y búsqueda en documentos
 * Usa Tesseract.js para extraer texto de imágenes
 * Integra con el texto ya extraído por IAService para PDFs/DOCX
 */

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/tiff", "image/webp"];

class OCRService {
    /**
     * Extraer texto de una imagen usando Tesseract OCR
     */
    async extraerTextoImagen(rutaArchivo) {
        try {
            const { data: { text } } = await Tesseract.recognize(
                rutaArchivo,
                "spa", // Español
                {}
            );
            return text;
        } catch (error) {
            throw new Error(`Error en OCR: ${error.message}`);
        }
    }

    /**
     * Procesar documento: extraer texto según tipo
     * - Imágenes → Tesseract OCR
     * - PDF → pdfjs-dist (vía IAService)
     * - DOCX → mammoth (vía IAService)
     */
    async procesarDocumento(idDocumento) {
        const doc = await Documento.findByPk(idDocumento);
        if (!doc) throw new Error("Documento no encontrado");

        const rutaArchivo = doc.ruta;
        if (!rutaArchivo) throw new Error("Documento sin ruta de archivo");

        // Verificar que el archivo existe
        try {
            await fs.access(rutaArchivo);
        } catch {
            throw new Error("Archivo no encontrado en disco");
        }

        let textoExtraido = "";
        const tipoMime = doc.tipo_mime || "";
        const extension = path.extname(doc.nombre_archivo).toLowerCase();

        if (TIPOS_IMAGEN.includes(tipoMime) || [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"].includes(extension)) {
            // OCR para imágenes
            textoExtraido = await this.extraerTextoImagen(rutaArchivo);
        } else if (extension === ".pdf" || tipoMime === "application/pdf") {
            // PDF → usar extractor existente
            textoExtraido = await IAService.extraerTextoPDF(rutaArchivo);
        } else if ([".docx", ".doc"].includes(extension)) {
            // DOCX → usar lector existente
            textoExtraido = await IAService.leerContenidoDocumento(rutaArchivo);
        } else if ([".txt", ".csv"].includes(extension)) {
            textoExtraido = await fs.readFile(rutaArchivo, "utf-8");
        } else {
            throw new Error(`Tipo de archivo no soportado para extracción: ${extension}`);
        }

        // Guardar texto extraído en la BD
        await doc.update({ texto_extraido: textoExtraido });

        return {
            id_documento: doc.id_documento,
            nombre_archivo: doc.nombre_archivo,
            caracteres_extraidos: textoExtraido.length,
            preview: textoExtraido.substring(0, 500),
        };
    }

    /**
     * Buscar texto dentro de los documentos de un caso
     */
    async buscarEnDocumentos(idCaso, termino, limit = 10) {
        if (!termino || termino.trim().length < 2) return [];

        const docs = await Documento.findAll({
            where: {
                id_caso: idCaso,
                texto_extraido: { [Op.like]: `%${termino}%` },
            },
            attributes: ["id_documento", "nombre_archivo", "tipo_mime", "texto_extraido"],
            limit,
        });

        return docs.map(d => {
            const texto = d.texto_extraido || "";
            const idx = texto.toLowerCase().indexOf(termino.toLowerCase());
            const start = Math.max(0, idx - 80);
            const end = Math.min(texto.length, idx + termino.length + 80);
            const snippet = (start > 0 ? "..." : "") + texto.substring(start, end) + (end < texto.length ? "..." : "");

            return {
                id_documento: d.id_documento,
                nombre_archivo: d.nombre_archivo,
                tipo_mime: d.tipo_mime,
                snippet,
            };
        });
    }

    /**
     * Buscar texto en TODOS los documentos (global)
     */
    async buscarGlobal(termino, limit = 10) {
        if (!termino || termino.trim().length < 2) return [];

        const docs = await Documento.findAll({
            where: {
                texto_extraido: { [Op.like]: `%${termino}%` },
            },
            attributes: ["id_documento", "nombre_archivo", "tipo_mime", "id_caso", "texto_extraido"],
            limit,
        });

        return docs.map(d => {
            const texto = d.texto_extraido || "";
            const idx = texto.toLowerCase().indexOf(termino.toLowerCase());
            const start = Math.max(0, idx - 80);
            const end = Math.min(texto.length, idx + termino.length + 80);
            const snippet = (start > 0 ? "..." : "") + texto.substring(start, end) + (end < texto.length ? "..." : "");

            return {
                id_documento: d.id_documento,
                nombre_archivo: d.nombre_archivo,
                tipo_mime: d.tipo_mime,
                id_caso: d.id_caso,
                snippet,
            };
        });
    }
}

export default new OCRService();
