import crypto from "crypto";

/**
 * Genera un token aleatorio seguro
 *
 * Este token se usa para:
 * - Recuperación de contraseña
 * - Verificación de email
 * - Cualquier operación que requiera un token temporal único
 *
 * El token es completamente aleatorio y criptográficamente seguro,
 * por lo que es imposible de adivinar o predecir.
 */
export const generarTokenSeguro = () => {
  // crypto.randomBytes(32) genera 32 bytes aleatorios
  // .toString('hex') los convierte a hexadecimal (64 caracteres)
  // Ejemplo resultado: "a3f5d8c9e2b1f4a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1"
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Genera una fecha de expiración
 *
 * @param {number} horas - Cantidad de horas hasta que expire
 * @returns {Date} Fecha de expiración
 */
export const generarExpiracion = (horas = 1) => {
  const ahora = new Date();
  ahora.setHours(ahora.getHours() + horas);
  return ahora;
};

export default {
  generarTokenSeguro,
  generarExpiracion,
};
