// src/controllers/admin/clientes.controller.js

/**
 * CONTROLLER DE CLIENTES CON SERVICE
 *
 * El controller ahora solo maneja:
 * - Recibir datos de la request (req)
 * - Llamar al service (lógica de negocio)
 * - Enviar respuesta HTTP (res)
 */

import clientesService from "../services/clientes_service.js";

// ============================================
// CREATE - CREAR CLIENTE
// ============================================

export const crearCliente = async (req, res) => {
  try {
    //  Toda la lógica está en el service
    const cliente = await clientesService.crear(req.body);

    // Solo manejamos la respuesta HTTP
    return res.status(201).json({
      success: true,
      message: "Cliente creado exitosamente!",
      data: cliente,
    });
  } catch (error) {
    // El service lanza errores con statusCode
    console.error("Error al crear cliente:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// READ - OBTENER TODOS LOS CLIENTES
// ============================================

export const obtenerClientes = async (req, res) => {
  try {
    // Pasamos las opciones al service
    const resultado = await clientesService.obtenerTodos({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });

    res.json({
      success: true,
      data: resultado.clientes,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// READ - OBTENER UN CLIENTE POR ID
// ============================================

export const obtenerClientePorId = async (req, res) => {
  try {
    const cliente = await clientesService.obtenerPorId(req.params.id);

    res.json({
      success: true,
      data: cliente,
    });
  } catch (error) {
    console.error("Error al obtener cliente:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// READ - BUSCAR CLIENTES
// ============================================

export const buscarClientes = async (req, res) => {
  try {
    const clientes = await clientesService.buscar(req.query.q);

    res.json({
      success: true,
      total: clientes.length,
      data: clientes,
    });
  } catch (error) {
    console.error("Error al buscar clientes:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// UPDATE - ACTUALIZAR CLIENTE
// ============================================

export const actualizarCliente = async (req, res) => {
  try {
    const cliente = await clientesService.actualizar(req.params.id, req.body);

    res.json({
      success: true,
      message: "Cliente actualizado exitosamente",
      data: cliente,
    });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// DELETE - ELIMINAR CLIENTE
// ============================================

export const eliminarCliente = async (req, res) => {
  try {
    const resultado = await clientesService.eliminar(req.params.id);

    res.json({
      success: true,
      message: resultado.message,
    });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
