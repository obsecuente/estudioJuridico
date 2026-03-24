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

  // Constantes para chunking
  CHUNK_SIZE = 25000;         // 25K caracteres (~6K tokens)
  MAX_CONSOLIDADO = 15000;    // Si el consolidado supera esto, resumir de nuevo
  OVERLAP_CHARS = 500;        // Solapamiento entre chunks
  MAX_TEXTO_TOTAL = 150000;   // 150K chars máximo para evitar out of memory
  MAX_CHUNKS = 5;             // Máximo 5 chunks para no saturar la API

  /**
   * Divide texto largo en chunks manejables con overlap
   */
  dividirEnChunks(texto) {
    const chunks = [];
    let inicio = 0;

    while (inicio < texto.length && chunks.length < this.MAX_CHUNKS) {
      let fin = Math.min(inicio + this.CHUNK_SIZE, texto.length);

      // Intentar cortar en un punto natural (párrafo o punto)
      if (fin < texto.length) {
        const ultimoPunto = texto.lastIndexOf('.', fin);
        const ultimoParrafo = texto.lastIndexOf('\n\n', fin);
        const mejorCorte = Math.max(ultimoPunto, ultimoParrafo);

        if (mejorCorte > inicio + this.CHUNK_SIZE * 0.7) {
          fin = mejorCorte + 1;
        }
      }

      chunks.push(texto.substring(inicio, fin));
      inicio = fin - this.OVERLAP_CHARS; // Overlap para no perder contexto

      if (inicio < 0) inicio = fin; // Evitar loops infinitos
    }

    if (chunks.length >= this.MAX_CHUNKS && inicio < texto.length) {
      console.log(`⚠️ Documento muy largo, limitado a ${this.MAX_CHUNKS} chunks`);
    }

    return chunks;
  }

  /**
   * Genera prompt para resumir un chunk específico
   */
  construirPromptChunk(texto, indice, total) {
    return `Sos un asistente legal especializado. Este es el FRAGMENTO ${indice} de ${total} de un documento legal argentino.

**INSTRUCCIONES:**
1. Resumí SOLO este fragmento, extrayendo la información clave
2. Sé conciso pero no omitas datos importantes (montos, fechas, nombres, artículos)
3. Indicá si el fragmento parece estar incompleto o cortado
4. NO inventes información

**FRAGMENTO ${indice}/${total}:**
${texto}

**RESUMEN DEL FRAGMENTO:**`;
  }

  /**
   * Genera prompt para consolidar múltiples resúmenes parciales
   */
  construirPromptConsolidacion(resumenesPartes, longitudOriginal) {
    const partes = resumenesPartes.map((r, i) =>
      `### PARTE ${i + 1}/${resumenesPartes.length}\n${r}`
    ).join('\n\n---\n\n');

    return `Sos un experto en derecho argentino. Debés consolidar los siguientes RESÚMENES PARCIALES de un documento legal de ${longitudOriginal} caracteres.

**INSTRUCCIONES:**
1. Integrá la información de todas las partes en un resumen COHERENTE y ÚNICO
2. Eliminá redundancias pero NO pierdas información importante
3. Mantené el formato estructurado con secciones (PARTES, MONTOS, FECHAS, etc.)
4. El resumen final debe ser completo y profesional

**RESÚMENES PARCIALES A CONSOLIDAR:**

${partes}

**RESUMEN CONSOLIDADO FINAL:**`;
  }

  construirPrompt(texto, tipoDocumento) {
    // Este método ahora solo se usa para documentos cortos
    return `Sos un asistente legal especializado en análisis de documentos jurídicos argentinos.

**INSTRUCCIONES GENERALES:**
1. Primero determiná QUÉ TIPO de documento es (demanda, contestación, sentencia, contrato, dictamen, etc.)
2. Generá un resumen PROFESIONAL y COMPLETO orientado a abogados
3. NO omitas información crítica como montos, plazos o fundamentos legales
4. Sé preciso, técnico y fiel al documento original
5. NUNCA inventes información que no esté en el documento

**SI ES DOCUMENTO LEGAL (demanda, sentencia, contrato, etc.):**

Usá OBLIGATORIAMENTE este formato completo:

### NATURALEZA Y OBJETO
(Tipo exacto de documento legal y tema central en 2-3 oraciones)

### 👥 PARTES
- **Actor/Demandante:** (nombre completo y datos identificatorios)
- **Demandado:** (nombre completo, CUIT si figura, domicilio)
- **Patrocinio Letrado:** (nombre del abogado, tomo y folio si figura)

### 💰 MONTOS RECLAMADOS
(CRÍTICO - Listá TODOS los montos con su concepto)
- **Daño emergente:** (monto en la moneda original)
- **Lucro cesante:** (monto)
- **Daño moral:** (monto)
- **Monto total del reclamo:** (suma)
- **Monto del contrato original:** (si aplica)

### 🔑 PUNTOS CLAVE DEL CASO
- (5-7 puntos jurídicos relevantes, con hechos específicos)
- (Incluí porcentajes, cantidades, especificaciones técnicas si las hay)

### 📅 FECHAS Y PLAZOS IMPORTANTES
- (Listado cronológico de TODAS las fechas relevantes)
- Incluí: fecha del contrato, inicio de obra/relación, incumplimientos, intimaciones, rescisión, etc.

### 📍 DATOS DEL OBJETO
(Ubicación del inmueble, descripción del bien, expediente administrativo, etc.)

### ⚖️ FUNDAMENTO LEGAL
- **Código Civil y Comercial:** Arts. (listar artículos citados)
- **Otras normas:** (leyes, decretos, reglamentos técnicos mencionados)
- **Jurisprudencia:** (si se cita algún fallo)

### 📋 PRUEBAS OFRECIDAS
- **Documental:** (tipos de documentos acompañados)
- **Testimonial:** (cantidad de testigos, roles)
- **Pericial:** (tipo de pericia solicitada)
- **Otras:** (informes, reconocimiento judicial, etc.)

### ⚠️ ACCIÓN REQUERIDA
(Qué se solicita concretamente al juez - petitorio resumido)

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
${texto}`;
  }

  /**
   * Resume un chunk individual
   */
  async resumirChunk(texto, indice, total) {
    const prompt = this.construirPromptChunk(texto, indice, total);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Sos un experto en derecho argentino. Resumís fragmentos de documentos legales de forma precisa y concisa.",
        },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.15,
      max_tokens: 1500,
      top_p: 1,
    });

    return {
      resumen: completion.choices[0].message.content,
      tokens: completion.usage.total_tokens,
    };
  }

  /**
   * Consolida múltiples resúmenes parciales en uno final
   */
  async consolidarResumenes(resumenesPartes, longitudOriginal) {
    const prompt = this.construirPromptConsolidacion(resumenesPartes, longitudOriginal);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Sos un experto en derecho argentino. Tu tarea es consolidar resúmenes parciales en un documento coherente y completo.",
        },
        { role: "user", content: prompt },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 2500,
      top_p: 1,
    });

    return {
      resumen: completion.choices[0].message.content,
      tokens: completion.usage.total_tokens,
    };
  }

  async generarResumen(texto, tipoDocumento = "legal") {
    console.log("🤖 Generando resumen con Groq...");
    console.log("📊 Tamaño texto original:", texto.length, "caracteres");
    const inicioTiempo = Date.now();
    let tokensTotal = 0;
    let textoTruncado = false;

    // Si el texto es demasiado largo, truncar inteligentemente
    if (texto.length > this.MAX_TEXTO_TOTAL) {
      console.log(`⚠️ Texto muy largo (${texto.length} chars), truncando a ${this.MAX_TEXTO_TOTAL}...`);
      // Tomar principio (40%), medio (20%) y fin (40%)
      const partePrincipio = Math.floor(this.MAX_TEXTO_TOTAL * 0.4);
      const parteMedio = Math.floor(this.MAX_TEXTO_TOTAL * 0.2);
      const parteFin = Math.floor(this.MAX_TEXTO_TOTAL * 0.4);

      const inicio = texto.substring(0, partePrincipio);
      const medio = texto.substring(
        Math.floor(texto.length / 2) - Math.floor(parteMedio / 2),
        Math.floor(texto.length / 2) + Math.floor(parteMedio / 2)
      );
      const fin = texto.substring(texto.length - parteFin);

      texto = `${inicio}\n\n[... SECCIÓN INTERMEDIA 1 ...]\n\n${medio}\n\n[... SECCIÓN INTERMEDIA 2 ...]\n\n${fin}`;
      textoTruncado = true;
      console.log(`✂️ Texto truncado a ${texto.length} caracteres`);
    }

    try {
      // Si el texto es corto, resumir directo (método original)
      if (texto.length <= this.CHUNK_SIZE) {
        console.log("📄 Documento corto - resumen directo");
        const prompt = this.construirPrompt(texto, tipoDocumento);
        console.log("📤 Enviando a Groq API...");

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
      }

      // Documento largo - usar chunking
      console.log("🔄 Documento largo detectado - iniciando chunking...");
      const chunks = this.dividirEnChunks(texto);
      console.log(`📦 Dividido en ${chunks.length} chunks`);

      // Resumir cada chunk
      const resumenesPartes = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🤖 Procesando chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);

        const resultado = await this.resumirChunk(chunks[i], i + 1, chunks.length);
        resumenesPartes.push(resultado.resumen);
        tokensTotal += resultado.tokens;

        console.log(`✅ Chunk ${i + 1}/${chunks.length} completado (${resultado.tokens} tokens)`);

        // Pequeña pausa para no saturar la API
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Consolidar resúmenes
      console.log("🔗 Consolidando", resumenesPartes.length, "resúmenes parciales...");
      let resultadoFinal = await this.consolidarResumenes(resumenesPartes, texto.length);
      tokensTotal += resultadoFinal.tokens;

      // Si el consolidado es muy largo, resumir una vez más
      if (resultadoFinal.resumen.length > this.MAX_CONSOLIDADO) {
        console.log("📝 Consolidado muy largo, resumiendo nuevamente...");
        const resumenFinal = await this.resumirChunk(resultadoFinal.resumen, 1, 1);
        resultadoFinal.resumen = resumenFinal.resumen;
        tokensTotal += resumenFinal.tokens;
      }

      const tiempoProcesamiento = Date.now() - inicioTiempo;

      console.log("✅ Resumen chunked completado");
      console.log("⏱️  Tiempo total:", tiempoProcesamiento, "ms");
      console.log("🎯 Tokens totales:", tokensTotal);
      console.log("📊 Chunks procesados:", chunks.length);

      return {
        resumen: resultadoFinal.resumen,
        tokensUsados: tokensTotal,
        tiempoProcesamiento,
        modelo: "llama-3.3-70b-versatile",
        chunksUsados: chunks.length,
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

  async preguntarDocumento(idDocumento, pregunta) {
    console.log(`\n💬 === CONSULTA IA [Doc: ${idDocumento}] ===`);
    console.log("❓ Pregunta:", pregunta);

    try {
      // 1. Obtener documento y extraer texto
      const documento = await Documento.findByPk(idDocumento);
      if (!documento) throw new Error("Documento no encontrado");

      const rutaCompleta = path.resolve(documento.ruta);
      const contenido = await this.leerContenidoDocumento(rutaCompleta);

      // 2. Limitar texto para el prompt
      const maxCaracteres = 15000;
      const textoProcesado = contenido.length > maxCaracteres
        ? contenido.substring(0, maxCaracteres) + "\n...[Texto truncado para la consulta]..."
        : contenido;

      // 3. Llamada a Groq
      console.log("📤 Consultando a Groq...");
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Sos un asistente jurídico inteligente. Tu tarea es responder preguntas ESPECÍFICAS sobre el siguiente DOCUMENTO que te proveeré. 
            Instrucciones:
            - Basate ÚNICAMENTE en la información del documento.
            - Si la información no está, decilo honestamente.
            - Sé preciso, técnico y profesional (estilo abogado argentino).
            - Usá un tono atento pero formal.`,
          },
          {
            role: "user",
            content: `DOCUMENTO:\n${textoProcesado}\n\nPREGUNTA DEL USUARIO:\n${pregunta}`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2, // Más bajo para mayor precisión
        max_tokens: 1000,
      });

      console.log("✅ Respuesta recibida");
      return {
        respuesta: completion.choices[0].message.content,
        uso: completion.usage
      };
    } catch (error) {
      console.error("❌ Error en chat IA:", error);
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
  /**
   * Chat general con IA — Conversación libre sin documento
   * Usa Groq como proveedor gratuito.
   * ─────────────────────────────────────────────────
   * PARA CAMBIAR DE PROVEEDOR:
   *   1. Reemplazar 'groq-sdk' por el SDK del nuevo proveedor (e.g. OpenAI, Anthropic)
   *   2. Actualizar la variable de entorno GROQ_API_KEY → OPENAI_API_KEY (etc.)
   *   3. Ajustar el nombre del modelo en `model: "..."` abajo.
   *   4. Los mensajes siguen el formato OpenAI-compatible [{ role, content }]
   * ─────────────────────────────────────────────────
   */
  async chatGeneral(mensajes) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Sos un asistente legal argentino especializado en derecho procesal, civil, laboral y de familia. 
Respondé en español rioplatense. Sé conciso y práctico. 
Si te preguntan sobre plazos, citá artículos del CPCC si aplica.
Siempre aclará que tu respuesta es orientativa y no reemplaza el criterio profesional del abogado.
Si te preguntan algo fuera del ámbito legal, respondé brevemente y redirigí al tema jurídico.`,
          },
          ...mensajes,
        ],
        temperature: 0.4,
        max_tokens: 1024,
      });

      return {
        respuesta: completion.choices[0]?.message?.content || "Sin respuesta.",
        modelo: completion.model,
        tokens: completion.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error("Error chat general IA:", error);
      throw new Error(`Error de IA: ${error.message}`);
    }
  }
}

export default new IAService();
