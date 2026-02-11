import nodemailer from "nodemailer";
import logger from "./logger.js";

// Configurar transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Enviar email
 */
export const enviarEmail = async ({ to, subject, html, text }) => {
  try {
    // En desarrollo, mostrar en consola
    if (process.env.NODE_ENV === "development") {
      logger.info("EMAIL (DEV MODE):", {
        to,
        subject,
        preview: text?.substring(0, 100) || html?.substring(0, 100),
      });

      // Si no hay credenciales configuradas, solo loguear
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn("Credenciales de email no configuradas. Email no enviado.");
        return { success: true, dev: true };
      }
    }

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Estudio Jurídico"}" <${process.env.EMAIL_USER
        }>`,
      to,
      subject,
      text,
      html,
    });

    logger.info("Email enviado exitosamente", {
      messageId: info.messageId,
      to,
      subject,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Error al enviar email", {
      error: error.message,
      to,
      subject,
    });

    throw error;
  }
};

/**
 * Plantillas de emails
 */
export const plantillas = {
  recuperacionPassword: (nombre, resetLink) => ({
    subject: "Recuperación de contraseña - Estudio Jurídico",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #f1c40f; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
          .content { background-color: #f8fafc; padding: 40px 30px; }
          .content p { margin: 0 0 15px 0; color: #334155; }
          .button { display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #f1c40f 0%, #d4a90a 100%); color: #0f172a !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; box-shadow: 0 4px 15px rgba(241, 196, 15, 0.3); }
          .link-box { background: #e2e8f0; padding: 12px 15px; border-radius: 6px; word-break: break-all; color: #0f172a; font-size: 13px; margin: 15px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f1c40f; padding: 12px 15px; border-radius: 0 6px 6px 0; margin: 20px 0; }
          .footer { text-align: center; padding: 25px; font-size: 12px; color: #64748b; background: #f1f5f9; }
          .footer p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚖️ Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre || ""}</strong>,</p>
            <p>Recibimos una solicitud para recuperar tu contraseña del Sistema Jurídico.</p>
            <p>Hacé click en el siguiente botón para crear una nueva contraseña:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">🔐 Restablecer Contraseña</a>
            </p>
            <p>O copiá y pegá este link en tu navegador:</p>
            <div class="link-box">${resetLink}</div>
            <div class="warning">
              <strong>⏰ Este link expira en 1 hora.</strong><br>
              Si no solicitaste este cambio, podés ignorar este email.
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>© ${new Date().getFullYear()} Estudio Jurídico. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hola ${nombre || ""},
      
      Recibimos una solicitud para recuperar tu contraseña.
      
      Hacé click en el siguiente link para crear una nueva contraseña:
      ${resetLink}
      
      Este link expira en 1 hora.
      
      Si no solicitaste este cambio, podés ignorar este email.
    `,
  }),

  bienvenida: (nombre, email, passwordTemporal) => ({
    subject: "Bienvenido al Sistema - Estudio Jurídico",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 30px; }
          .credentials { background-color: white; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido!</h1>
          </div>
          <div class="content">
            <p>Hola ${nombre},</p>
            <p>Tu cuenta ha sido creada exitosamente en nuestro sistema.</p>
            <div class="credentials">
              <p><strong>Tus credenciales de acceso:</strong></p>
              <p>Email: <strong>${email}</strong></p>
              <p>Contraseña temporal: <strong>${passwordTemporal}</strong></p>
            </div>
            <p><strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña al iniciar sesión por primera vez.</p>
            <p>Podés acceder al sistema en: <a href="${process.env.FRONTEND_URL || "http://localhost:3001"
      }">${process.env.FRONTEND_URL || "http://localhost:3001"}</a></p>
          </div>
          <div class="footer">
            <p>Si tenés alguna duda, no dudes en contactarnos.</p>
            <p>&copy; 2025 Estudio Jurídico. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hola ${nombre},
      
      Tu cuenta ha sido creada exitosamente en nuestro sistema.
      
      Tus credenciales de acceso:
      Email: ${email}
      Contraseña temporal: ${passwordTemporal}
      
      Por seguridad, te recomendamos cambiar tu contraseña al iniciar sesión por primera vez.
    `,
  }),
};

export default {
  enviarEmail,
  plantillas,
};
