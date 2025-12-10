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
      from: `"${process.env.EMAIL_FROM_NAME || "Estudio Jurídico"}" <${
        process.env.EMAIL_USER
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f4f4f4; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola ${nombre || ""},</p>
            <p>Recibimos una solicitud para recuperar tu contraseña.</p>
            <p>Hacé click en el siguiente botón para crear una nueva contraseña:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Resetear Contraseña</a>
            </p>
            <p>O copiá y pegá este link en tu navegador:</p>
            <p style="word-break: break-all; color: #3498db;">${resetLink}</p>
            <p><strong>Este link expira en 1 hora.</strong></p>
            <p>Si no solicitaste este cambio, podés ignorar este email.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>&copy; 2025 Estudio Jurídico. Todos los derechos reservados.</p>
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
            <p>Podés acceder al sistema en: <a href="${
              process.env.FRONTEND_URL || "http://localhost:3001"
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
