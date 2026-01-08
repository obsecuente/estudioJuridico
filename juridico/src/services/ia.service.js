import Groq from "groq-sdk";
import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import ResumenIA from "../models/ResumenIA.js";
import Documento from "../models/Documento.js";

// ALTERNATIVA PARA WINDOWS: Usamos pdfjs-dist en vez de pdf-parse
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

class IAService {
  async extraerTextoPDF(rutaArchivo) {
    try {
      const dataBuffer = await fs.readFile(rutaArchivo);
      const data = new Uint8Array(dataBuffer);

      // Cargar el PDF
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;

      let textoCompleto = "";

      // Extraer texto de cada página
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        textoCompleto += pageText + "\n\n";
      }

      return textoCompleto;
    } catch (error) {
      throw new Error(`Error al extraer texto del PDF: ${error.message}`);
    }
  }

  async leerContenidoDocumento(rutaArchivo) {
    try {
      console.log("📄 Leyendo archivo:", rutaArchivo);

      const extension = path.extname(rutaArchivo).toLowerCase();
      console.log("🔍 Extensión:", extension);

      // PDFs usando pdfjs-dist
      if (extension === ".pdf") {
        console.log("📑 Procesando PDF con pdfjs-dist...");
        const texto = await this.extraerTextoPDF(rutaArchivo);

        console.log("✅ Texto extraído:", texto.length, "caracteres");
        console.log("📝 Muestra:", texto.substring(0, 200));

        if (!texto || texto.trim().length < 50) {
          throw new Error(
            "El PDF no contiene texto legible (posible imagen escaneada)"
          );
        }

        return texto;
      }

      // Word (.docx)
      if (extension === ".docx") {
        console.log("📘 Procesando DOCX...");
        const dataBuffer = await fs.readFile(rutaArchivo);
        console.log("✅ Buffer DOCX:", dataBuffer.length, "bytes");

        const result = await mammoth.extractRawText({ buffer: dataBuffer });
        console.log("✅ Texto extraído:", result.value.length, "caracteres");
        console.log("📝 Muestra:", result.value.substring(0, 200));

        if (!result.value || result.value.trim().length < 50) {
          throw new Error("El documento Word parece estar vacío");
        }

        return result.value;
      }

      // Archivos de texto
      const textExtensions = [".txt", ".md", ".html", ".htm", ".csv", ".json"];
      if (textExtensions.includes(extension)) {
        console.log("📄 Procesando texto plano...");
        const contenido = await fs.readFile(rutaArchivo, "utf-8");
        console.log("✅ Texto leído:", contenido.length, "caracteres");

        if (!contenido || contenido.trim().length < 50) {
          throw new Error("El archivo de texto está vacío");
        }

        return contenido;
      }

      throw new Error(
        `Formato no soportado: ${extension}. Solo PDF, Word (.docx) y texto plano.`
      );
    } catch (error) {
      console.error("❌ Error al leer documento:", error.message);

      if (error.code === "ENOENT") {
        throw new Error("Archivo no encontrado: " + rutaArchivo);
      }

      throw error;
    }
  }

  construirPrompt(texto, tipoDocumento) {
    const maxCaracteres = 20000;
    let textoProcesado = texto;

    if (texto.length > maxCaracteres) {
      const mitad = Math.floor(maxCaracteres / 2);
      const inicio = texto.substring(0, mitad);
      const fin = texto.substring(texto.length - mitad);
      textoProcesado = `${inicio}\n\n[... CONTENIDO INTERMEDIO OMITIDO ...]\n\n${fin}`;
    }

    return `Sos un asistente especializado en análisis de documentos.

**INSTRUCCIONES:**
1. Primero determiná QUÉ TIPO de documento es (legal, educativo, técnico, comercial, etc.)
2. Según el tipo, generá un resumen apropiado
3. NO fuerces un formato legal si el documento NO es legal
4. Sé conciso y preciso

**SI ES DOCUMENTO LEGAL (demanda, sentencia, contrato, etc.):**

Usá este formato:

### 📄 NATURALEZA Y OBJETO
(Tipo de documento legal y tema central)

### 👥 PARTES
- Actor: (nombre)
- Demandado: (nombre)

### 🔑 PUNTOS CLAVE
- (3-5 puntos jurídicos relevantes)

### 📅 FECHAS Y PLAZOS
- Fechas: (listado)
- Plazos: (si hay)

### ⚠️ ACCIÓN REQUERIDA
(Qué debe hacer el abogado)

---

**SI ES DOCUMENTO NO LEGAL (educativo, técnico, comercial, etc.):**

Usá este formato:

### 📄 TIPO DE DOCUMENTO
(Qué es: manual, tutorial, informe, etc.)

### 🎯 TEMA PRINCIPAL
(De qué trata en 2-3 oraciones)

### 📌 PUNTOS CLAVE
- (3-5 ideas principales del documento)

### 💡 INFORMACIÓN RELEVANTE
- Conceptos importantes
- Datos destacados
- Instrucciones si las hay

### 📝 CONCLUSIÓN
(Resumen breve del propósito del documento)

---

**DOCUMENTO A ANALIZAR:**
${textoProcesado}`;
  }

  async generarResumen(texto, tipoDocumento = "legal") {
    console.log("🤖 Generando resumen con Groq...");
    const inicioTiempo = Date.now();

    try {
      const prompt = this.construirPrompt(texto, tipoDocumento);
      console.log("📤 Enviando a Groq API...");
      console.log("📊 Tamaño prompt:", prompt.length, "caracteres");

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Sos un experto en derecho argentino. Tus respuestas son técnicas, precisas y fieles al documento original. NUNCA inventes información.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.15,
        max_tokens: 2500,
        top_p: 1,
      });

      const tiempoProcesamiento = Date.now() - inicioTiempo;

      console.log("✅ Respuesta recibida");
      console.log("⏱️  Tiempo:", tiempoProcesamiento, "ms");
      console.log("🎯 Tokens:", chatCompletion.usage.total_tokens);

      return {
        resumen: chatCompletion.choices[0].message.content,
        tokensUsados: chatCompletion.usage.total_tokens,
        tiempoProcesamiento,
        modelo: "llama-3.3-70b-versatile",
      };
    } catch (error) {
      console.error("❌ Error Groq:", error);

      if (error.status === 429) {
        throw new Error("Límite de requests alcanzado. Esperá unos minutos.");
      }

      throw new Error(`Error en Groq API: ${error.message}`);
    }
  }

  async resumirDocumento(idDocumento, idUsuario, forzarRegeneracion = false) {
    console.log("\n🚀 === INICIANDO RESUMEN ===");
    console.log("📋 ID Documento:", idDocumento);
    console.log("👤 ID Usuario:", idUsuario);
    console.log("🔄 Forzar regeneración:", forzarRegeneracion);

    try {
      console.log("\n1️⃣ Buscando documento en BD...");
      const documento = await Documento.findByPk(idDocumento);

      if (!documento) {
        throw new Error("Documento no encontrado en BD");
      }

      console.log("✅ Documento encontrado:");
      console.log("   - Nombre:", documento.nombre_archivo);
      console.log("   - Ruta:", documento.ruta);

      console.log("\n2️⃣ Verificando caché...");
      const resumenExistente = await ResumenIA.findOne({
        where: { id_documento: idDocumento },
      });

      // Si existe Y NO estamos forzando regeneración → retornar caché
      if (resumenExistente && !forzarRegeneracion) {
        console.log("✅ Resumen en caché encontrado");
        return {
          resumen: resumenExistente,
          mensaje: "Resumen cargado desde BD (sin usar IA)",
        };
      }

      // Si existe PERO estamos forzando regeneración → borrar el viejo
      if (resumenExistente && forzarRegeneracion) {
        console.log("🔄 Regenerando: borrando resumen anterior...");
        await resumenExistente.destroy();
        console.log("✅ Resumen anterior eliminado");
      }

      console.log("ℹ️  Generando nuevo resumen...");

      console.log("\n3️⃣ Leyendo archivo...");
      const rutaCompleta = path.resolve(documento.ruta);
      const contenido = await this.leerContenidoDocumento(rutaCompleta);

      if (!contenido || contenido.trim().length < 100) {
        throw new Error(
          "Documento vacío o muy corto (menos de 100 caracteres)"
        );
      }

      console.log("✅ Contenido extraído:", contenido.length, "caracteres");

      console.log("\n4️⃣ Generando resumen con IA...");
      const resultado = await this.generarResumen(contenido, "legal");

      console.log("\n5️⃣ Guardando en BD...");
      const nuevoResumen = await ResumenIA.create({
        id_documento: idDocumento,
        resumen_texto: resultado.resumen,
        modelo_usado: resultado.modelo,
        tokens_usados: resultado.tokensUsados,
        tiempo_procesamiento: resultado.tiempoProcesamiento,
        id_usuario_creo: idUsuario,
      });

      console.log("✅ Resumen guardado");
      console.log("🎉 === COMPLETADO ===\n");

      return {
        resumen: nuevoResumen,
        mensaje: forzarRegeneracion
          ? "Resumen regenerado exitosamente"
          : "Resumen generado exitosamente",
      };
    } catch (error) {
      console.error("\n❌ === ERROR ===");
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);
      throw error;
    }
  }

  async obtenerResumen(idDocumento) {
    return await ResumenIA.findOne({
      where: { id_documento: idDocumento },
      include: [
        {
          model: Documento,
          as: "documento",
          attributes: ["id_documento", "nombre_archivo"],
        },
      ],
    });
  }

  async eliminarResumen(idResumen) {
    const resumen = await ResumenIA.findByPk(idResumen);

    if (!resumen) {
      throw new Error("Resumen no encontrado");
    }

    await resumen.destroy();
    return { mensaje: "Resumen eliminado" };
  }
}

export default new IAService();
