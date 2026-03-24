// src/services/notificaciones.service.js
import nodemailer from "nodemailer";
import cron from "node-cron";
import { Abogado, Vencimiento, Caso, Cliente } from "../models/index.js";
import Tarea from "../models/Tarea.js";
import { Op } from "sequelize";

/**
 * Servicio de Notificaciones por Email
 * ─────────────────────────────────────
 * CONFIGURACIÓN:
 *   Variables de entorno necesarias:
 *   - MAIL_HOST     → SMTP host (ej: smtp.gmail.com)
 *   - MAIL_PORT     → SMTP port (ej: 587)
 *   - MAIL_USER     → Email emisor
 *   - MAIL_PASS     → Password o App Password
 *   - MAIL_FROM     → Nombre del remitente (opcional)
 *
 * Para Gmail:
 *   1. Habilitar "Acceso de apps menos seguras" o crear App Password
 *   2. MAIL_HOST=smtp.gmail.com, MAIL_PORT=587, MAIL_USER=tu@gmail.com
 */

// Crear transporter (inicialización lazy)
let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    const host = process.env.MAIL_HOST;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    if (!host || !user || !pass) {
        console.warn("⚠️ Notificaciones email: Variables MAIL_HOST/USER/PASS no configuradas. Emails deshabilitados.");
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.MAIL_PORT) || 587,
        secure: process.env.MAIL_SECURE === "true",
        auth: { user, pass },
    });

    return transporter;
};

/**
 * Construir HTML del resumen diario para un abogado
 */
const construirEmailResumen = (abogado, vencimientos, tareasVencidas, tareasHoy) => {
    const nombre = `${abogado.nombre} ${abogado.apellido}`;
    const fecha = new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:30px;max-width:600px;margin:0 auto;">
  <div style="border-bottom:3px solid #d4af37;padding-bottom:12px;margin-bottom:20px;">
    <h1 style="color:#f1f5f9;font-size:18px;margin:0;">⚖️ Resumen Diario</h1>
    <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">${fecha} · ${nombre}</p>
  </div>

  ${vencimientos.length > 0 ? `
  <div style="margin-bottom:24px;">
    <h2 style="color:#d4af37;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">📅 Vencimientos Próximos (${vencimientos.length})</h2>
    ${vencimientos.map(v => `
      <div style="background:#1a1f2b;border:1px solid #1e293b;border-radius:8px;padding:12px;margin:8px 0;">
        <div style="font-weight:600;color:#f1f5f9;">${v.titulo}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">
          📆 ${new Date(v.fecha_limite).toLocaleDateString("es-AR")}
          ${v.Caso ? ` · Caso: ${v.Caso.descripcion}` : ""}
          ${v.prioridad === "urgente" ? ' · <span style="color:#f87171;">⚠️ URGENTE</span>' : ""}
        </div>
      </div>
    `).join("")}
  </div>` : ""}

  ${tareasVencidas.length > 0 ? `
  <div style="margin-bottom:24px;">
    <h2 style="color:#ef4444;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">🔴 Tareas Vencidas (${tareasVencidas.length})</h2>
    ${tareasVencidas.map(t => `
      <div style="background:#1a1f2b;border:1px solid #7f1d1d;border-left:3px solid #ef4444;border-radius:8px;padding:12px;margin:8px 0;">
        <div style="font-weight:600;color:#f1f5f9;">${t.titulo}</div>
        <div style="font-size:12px;color:#f87171;margin-top:4px;">
          Venció: ${new Date(t.fecha_limite).toLocaleDateString("es-AR")}
        </div>
      </div>
    `).join("")}
  </div>` : ""}

  ${tareasHoy.length > 0 ? `
  <div style="margin-bottom:24px;">
    <h2 style="color:#60a5fa;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">📋 Tareas para Hoy (${tareasHoy.length})</h2>
    ${tareasHoy.map(t => `
      <div style="background:#1a1f2b;border:1px solid #1e293b;border-radius:8px;padding:12px;margin:8px 0;">
        <div style="font-weight:600;color:#f1f5f9;">${t.titulo}</div>
      </div>
    `).join("")}
  </div>` : ""}

  ${vencimientos.length === 0 && tareasVencidas.length === 0 && tareasHoy.length === 0 ? `
  <div style="text-align:center;color:#64748b;padding:30px;">
    <div style="font-size:30px;">✅</div>
    <p>No tenés pendientes urgentes para hoy. ¡Buen día!</p>
  </div>` : ""}

  <div style="margin-top:30px;padding-top:14px;border-top:2px solid #d4af37;font-size:11px;color:#475569;text-align:center;">
    Sistema Jurídico · Notificación automática
  </div>
</body>
</html>`;
};

/**
 * Enviar resumen diario a un abogado
 */
const enviarResumenDiario = async (abogado) => {
    const t = getTransporter();
    if (!t) return;

    if (!abogado.email) return;

    const hoy = new Date();
    const en3dias = new Date();
    en3dias.setDate(en3dias.getDate() + 3);
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

    // Vencimientos próximos 3 días
    const vencimientos = await Vencimiento.findAll({
        where: {
            id_abogado: abogado.id_abogado,
            fecha_limite: { [Op.between]: [hoy, en3dias] },
            completado: { [Op.or]: [false, null] },
        },
        include: [{ model: Caso, as: "caso", attributes: ["descripcion"] }],
        order: [["fecha_limite", "ASC"]],
        limit: 10,
    });

    // Tareas vencidas sin completar
    const tareasVencidas = await Tarea.findAll({
        where: {
            id_abogado: abogado.id_abogado,
            completada: false,
            fecha_limite: { [Op.lt]: hoy },
        },
        order: [["fecha_limite", "ASC"]],
        limit: 10,
    });

    // Tareas para hoy
    const tareasHoy = await Tarea.findAll({
        where: {
            id_abogado: abogado.id_abogado,
            completada: false,
            fecha_limite: {
                [Op.gte]: hoy.toISOString().split("T")[0],
                [Op.lt]: new Date(hoy.getTime() + 86400000).toISOString().split("T")[0],
            },
        },
        limit: 10,
    });

    // Solo enviar si hay algo que reportar
    if (vencimientos.length === 0 && tareasVencidas.length === 0 && tareasHoy.length === 0) {
        return;
    }

    const html = construirEmailResumen(abogado, vencimientos, tareasVencidas, tareasHoy);
    const from = process.env.MAIL_FROM || process.env.MAIL_USER;

    try {
        await t.sendMail({
            from: `"Sistema Jurídico" <${from}>`,
            to: abogado.email,
            subject: `⚖️ Resumen diario — ${tareasVencidas.length > 0 ? `${tareasVencidas.length} tarea(s) vencida(s)` : `${vencimientos.length} vencimiento(s) próximo(s)`}`,
            html,
        });
        console.log(`📧 Email enviado a ${abogado.email}`);
    } catch (error) {
        console.error(`❌ Error enviando email a ${abogado.email}:`, error.message);
    }
};

/**
 * Ejecutar el cron diario para todos los abogados
 */
const ejecutarResumenDiario = async () => {
    console.log("📧 Ejecutando resumen diario de notificaciones...");

    const abogados = await Abogado.findAll({
        where: { email: { [Op.ne]: null } },
    });

    for (const abogado of abogados) {
        await enviarResumenDiario(abogado);
    }

    console.log(`📧 Resumen diario completado para ${abogados.length} abogado(s)`);
};

/**
 * Iniciar el cron job
 * Se ejecuta todos los días a las 08:00 AM
 */
const iniciarCronNotificaciones = () => {
    if (!getTransporter()) {
        console.log("📧 Cron de emails NO iniciado (MAIL_* no configurado)");
        return;
    }

    // "0 8 * * *" = todos los días a las 8:00 AM
    cron.schedule("0 8 * * *", () => {
        ejecutarResumenDiario().catch(err =>
            console.error("Error en cron de notificaciones:", err)
        );
    }, {
        timezone: "America/Argentina/Buenos_Aires",
    });

    console.log("📧 Cron de notificaciones iniciado (08:00 AM diario)");
};

export default {
    iniciarCronNotificaciones,
    ejecutarResumenDiario,
    enviarResumenDiario,
};
