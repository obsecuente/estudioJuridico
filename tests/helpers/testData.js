import "../setup.js"; // <-- AGREGAR ESTA LÍNEA PRIMERO
// ============================================
// DATOS DE PRUEBA PREDEFINIDOS
// ============================================

export const clienteValido = {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan.perez@test.com",
  telefono: "+5491123456789",
  consentimiento_datos: true,
};

export const clienteInvalido = {
  nombre: "J", // Muy corto
  apellido: "P",
  email: "email-invalido",
  telefono: "123", // Formato inválido
};

export const abogadoValido = {
  nombre: "María",
  apellido: "González",
  email: "maria.gonzalez@estudio.com",
  especialidad: "Derecho Civil",
  rol: "abogado",
};

export const consultaValida = {
  mensaje: "Necesito asesoría sobre un contrato de alquiler",
  estado: "pendiente",
};

export const casoValido = {
  descripcion: "Caso de divorcio contencioso",
  estado: "abierto",
};

// ============================================
// HELPERS PARA GENERAR DATOS ÚNICOS
// ============================================

/**
 * Genera un email único para evitar conflictos en tests
 * @returns {string} Email único
 */
export const generarEmailUnico = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test${timestamp}${random}@test.com`;
};

/**
 * Genera un teléfono único en formato internacional
 * @returns {string} Teléfono único con formato +549XXXXXXXX
 */
export const generarTelefonoUnico = () => {
  const random = Math.floor(Math.random() * 1000000000);
  return `+549${random}`;
};

/**
 * Genera datos de cliente completos con valores únicos
 * @param {Object} override - Valores a sobrescribir
 * @returns {Object} Datos de cliente
 */
export const generarDatosCliente = (override = {}) => {
  return {
    nombre: "Test",
    apellido: "Cliente",
    email: generarEmailUnico(),
    telefono: generarTelefonoUnico(),
    consentimiento_datos: true,
    ...override,
  };
};

/**
 * Genera datos de abogado completos con valores únicos
 * @param {Object} override - Valores a sobrescribir
 * @returns {Object} Datos de abogado
 */
export const generarDatosAbogado = (override = {}) => {
  return {
    nombre: "Test",
    apellido: "Abogado",
    email: generarEmailUnico(),
    especialidad: "Derecho Civil",
    rol: "abogado",
    ...override,
  };
};
