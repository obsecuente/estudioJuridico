import {
  Cliente,
  Abogado,
  Consulta,
  Caso,
  Documento,
} from "../../src/models/index.js";
import { generarEmailUnico, generarTelefonoUnico } from "./testData.js";
import "../setup.js"; // <-- AGREGAR ESTA LÍNEA PRIMERO

// ============================================
// LIMPIEZA DE BASE DE DATOS
// ============================================

/**
 * Limpia todas las tablas en el orden correcto
 * para respetar las foreign keys
 */
export const limpiarTablas = async () => {
  try {
    // Orden: primero las tablas dependientes, luego las principales
    await Documento.destroy({ where: {}, force: true });
    await Caso.destroy({ where: {}, force: true });
    await Consulta.destroy({ where: {}, force: true });
    await Cliente.destroy({ where: {}, force: true });
    await Abogado.destroy({ where: {}, force: true });
  } catch (error) {
    console.error("Error limpiando tablas:", error);
    throw error;
  }
};

/**
 * Limpia solo la tabla de clientes
 */
export const limpiarClientes = async () => {
  await Cliente.destroy({ where: {}, force: true });
};

/**
 * Limpia solo la tabla de abogados
 */
export const limpiarAbogados = async () => {
  await Abogado.destroy({ where: {}, force: true });
};

// ============================================
// CREACIÓN DE DATOS DE PRUEBA
// ============================================

/**
 * Crea un cliente de prueba en la base de datos
 * @param {Object} datos - Datos personalizados (opcionales)
 * @returns {Promise<Cliente>} Cliente creado
 */
export const crearClientePrueba = async (datos = {}) => {
  return await Cliente.create({
    nombre: "Test",
    apellido: "Cliente",
    email: generarEmailUnico(),
    telefono: generarTelefonoUnico(),
    consentimiento_datos: true,
    ...datos,
  });
};

/**
 * Crea un abogado de prueba en la base de datos
 * @param {Object} datos - Datos personalizados (opcionales)
 * @returns {Promise<Abogado>} Abogado creado
 */
export const crearAbogadoPrueba = async (datos = {}) => {
  return await Abogado.create({
    nombre: "Test",
    apellido: "Abogado",
    email: generarEmailUnico(),
    especialidad: "Derecho Civil",
    rol: "abogado",
    ...datos,
  });
};

/**
 * Crea una consulta de prueba en la base de datos
 * @param {number} idCliente - ID del cliente
 * @param {number|null} idAbogado - ID del abogado (opcional)
 * @returns {Promise<Consulta>} Consulta creada
 */
export const crearConsultaPrueba = async (idCliente, idAbogado = null) => {
  return await Consulta.create({
    mensaje: "Consulta de prueba para testing",
    estado: "pendiente",
    id_cliente: idCliente,
    id_abogado_asignado: idAbogado,
  });
};

/**
 * Crea un caso de prueba en la base de datos
 * @param {number} idCliente - ID del cliente
 * @param {number} idAbogado - ID del abogado
 * @returns {Promise<Caso>} Caso creado
 */
export const crearCasoPrueba = async (idCliente, idAbogado) => {
  return await Caso.create({
    descripcion: "Caso de prueba para testing",
    estado: "abierto",
    id_cliente: idCliente,
    id_abogado: idAbogado,
  });
};

/**
 * Crea un documento de prueba en la base de datos
 * @param {number} idCaso - ID del caso
 * @param {Object} datos - Datos personalizados (opcionales)
 * @returns {Promise<Documento>} Documento creado
 */
export const crearDocumentoPrueba = async (idCaso, datos = {}) => {
  return await Documento.create({
    nombre_archivo: `documento_test_${Date.now()}.pdf`,
    ruta: "/uploads/test/",
    id_caso: idCaso,
    ...datos,
  });
};

// ============================================
// HELPERS PARA ESCENARIOS COMPLEJOS
// ============================================

/**
 * Crea un cliente con consultas asociadas
 * @param {number} numConsultas - Número de consultas a crear
 * @returns {Promise<{cliente: Cliente, consultas: Array}>}
 */
export const crearClienteConConsultas = async (numConsultas = 3) => {
  const cliente = await crearClientePrueba();
  const consultas = [];

  for (let i = 0; i < numConsultas; i++) {
    const consulta = await crearConsultaPrueba(cliente.id_cliente);
    consultas.push(consulta);
  }

  return { cliente, consultas };
};

/**
 * Crea un escenario completo: cliente, abogado y caso
 * @returns {Promise<{cliente: Cliente, abogado: Abogado, caso: Caso}>}
 */
export const crearEscenarioCompleto = async () => {
  const cliente = await crearClientePrueba();
  const abogado = await crearAbogadoPrueba();
  const caso = await crearCasoPrueba(cliente.id_cliente, abogado.id_abogado);

  return { cliente, abogado, caso };
};

/**
 * Crea múltiples clientes de prueba
 * @param {number} cantidad - Cantidad de clientes a crear
 * @returns {Promise<Array<Cliente>>} Array de clientes creados
 */
export const crearMultiplesClientes = async (cantidad = 5) => {
  const clientes = [];

  for (let i = 0; i < cantidad; i++) {
    const cliente = await crearClientePrueba({
      nombre: `Cliente${i}`,
      apellido: `Apellido${i}`,
    });
    clientes.push(cliente);
  }

  return clientes;
};
