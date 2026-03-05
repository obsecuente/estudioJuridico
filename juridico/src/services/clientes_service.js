import { Cliente, Consulta, Caso, Abogado, MovimientoFinanciero, Cuota } from "../models/index.js";
import { Op } from "sequelize";
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export const crear = async (datosCliente) => {
  const {
    nombre, apellido, telefono, email, consentimiento_datos,
    tipo_persona, dni, cuit, fecha_nacimiento, estado_civil, profesion,
    domicilio_real, localidad, provincia, razon_social, domicilio_sede,
    contacto_alternativo_nombre, contacto_alternativo_telefono,
  } = datosCliente;

  // Normalizacion
  const nombreLimpio = nombre ? nombre.trim() : nombre;
  const apellidoLimpio = apellido ? apellido.trim() : apellido;
  const emailNormalizado = email ? email.trim().toLowerCase() : null;

  // Campos obligatorios: nombre, apellido, telefono (email ya NO es obligatorio)
  if (!nombreLimpio || !apellidoLimpio || !telefono) {
    throw new AppError("Nombre, Apellido y Teléfono son obligatorios", 400);
  }

  // Validar email solo si viene
  if (emailNormalizado) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      throw new AppError("El formato del email no es válido", 400);
    }
    const existeEmail = await Cliente.findOne({ where: { email: emailNormalizado } });
    if (existeEmail) {
      throw new AppError("Ya existe un cliente con este email", 409);
    }
  }

  // Validar telefono
  const telefonoValidation = /^\+[1-9]\d{7,14}$/;
  if (!telefonoValidation.test(telefono)) {
    throw new AppError("El formato del numero de telefono no es válido (ej: +5492995001234)", 400);
  }
  const existeTelefono = await Cliente.findOne({ where: { telefono } });
  if (existeTelefono) {
    throw new AppError("Ya existe un cliente con este número de teléfono", 409);
  }

  // Creacion de cliente
  try {
    const nuevoCliente = await Cliente.create({
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      telefono,
      email: emailNormalizado,
      fecha_registro: new Date(),
      consentimiento_datos: consentimiento_datos || false,
      tipo_persona: tipo_persona || "fisica",
      dni: dni || null,
      cuit: cuit || null,
      fecha_nacimiento: fecha_nacimiento || null,
      estado_civil: estado_civil || null,
      profesion: profesion || null,
      domicilio_real: domicilio_real || null,
      localidad: localidad || null,
      provincia: provincia || "Neuquén",
      razon_social: razon_social || null,
      domicilio_sede: domicilio_sede || null,
      contacto_alternativo_nombre: contacto_alternativo_nombre || null,
      contacto_alternativo_telefono: contacto_alternativo_telefono || null,
    });

    return nuevoCliente;
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const mensajes = error.errors.map((e) => e.message).join(", ");
      throw new AppError(`Error de validación: ${mensajes}`, 400);
    }
    throw new AppError("Error al crear el cliente en la base de datos [clientes_service.js]", 500);
  }
};
export const obtenerTodos = async (opciones = {}) => {
  /* ... código de obtenerTodos sin cambios ... */

  const { page = 1, limit = 20, search } = opciones;

  // Calcular offset
  const offset = (page - 1) * limit;

  // Construir filtro de búsqueda
  const where = {};

  if (search) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${search}%` } },
      { apellido: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  // Consultar base de datos
  const { count, rows: clientes } = await Cliente.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["fecha_registro", "DESC"]],
    attributes: [
      "id_cliente",
      "nombre",
      "apellido",
      "email",
      "telefono",
      "fecha_registro",
      "consentimiento_datos",
    ],
  });

  // Retornar datos con paginación
  return {
    clientes,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
    },
  };
};
export const obtenerPorId = async (id) => {
  /* ... código de obtenerPorId sin cambios ... */

  const cliente = await Cliente.findByPk(id, {
    include: [
      {
        model: Consulta,
        as: "consultas",
        attributes: ["id_consulta", "mensaje", "estado", "fecha_envio"],
        include: [
          {
            model: Abogado,
            as: "abogado",
            attributes: ["id_abogado", "nombre", "apellido", "especialidad"],
          },
        ],
        order: [["fecha_envio", "DESC"]],
      },
      {
        model: Caso,
        as: "casos",
        attributes: ["id_caso", "descripcion", "estado", "fecha_inicio"],
        order: [["fecha_inicio", "DESC"]],
      },
    ],
  });

  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }

  // Total cobrado del cliente: movimientos cobrados sin cuotas
  // + cuotas pagadas de movimientos del cliente
  const movimientosCliente = await MovimientoFinanciero.findAll({
    where: { id_cliente: id, tipo: "ingreso" },
    include: [{ model: Cuota, as: "cuotas" }],
  });

  let totalCobradoCliente = 0;
  for (const m of movimientosCliente) {
    if (m.cuotas && m.cuotas.length > 0) {
      totalCobradoCliente += m.cuotas
        .filter(c => c.estado === "pagado")
        .reduce((s, c) => s + parseFloat(c.monto_cuota || 0), 0);
    } else if (m.estado === "cobrado") {
      totalCobradoCliente += parseFloat(m.monto_ars || 0);
    }
  }

  return { ...cliente.toJSON(), total_cobrado: totalCobradoCliente };
};
export const buscar = async (termino) => {
  /* ... código de buscar sin cambios ... */

  if (!termino || termino.length < 2) {
    throw new AppError(
      "Debe proporcionar al menos 2 caracteres para buscar",
      400
    );
  }

  const clientes = await Cliente.findAll({
    where: {
      [Op.or]: [
        { nombre: { [Op.like]: `%${termino}%` } },
        { apellido: { [Op.like]: `%${termino}%` } },
        { email: { [Op.like]: `%${termino}%` } },
        { telefono: { [Op.like]: `%${termino}%` } },
      ],
    },
    limit: 10,
    attributes: ["id_cliente", "nombre", "apellido", "email", "telefono"],
  });

  return clientes;
};
export const actualizar = async (id, datosActualizacion) => {
  /* ... código de actualizar sin cambios ... */

  const { nombre, apellido, telefono, email, consentimiento_datos } =
    datosActualizacion;

  // Buscar el cliente
  const cliente = await Cliente.findByPk(id);

  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }

  // Verificar email único (si se quiere cambiar)
  if (email && email.trim().toLowerCase() !== cliente.email) {
    // <--- LIMPIAR Y COMPARAR
    const emailNormalizado = email.trim().toLowerCase(); // <--- LIMPIAR
    const existeEmail = await Cliente.findOne({
      where: { email: emailNormalizado },
    });
    if (existeEmail) {
      throw new AppError("Ya existe un cliente con ese email", 409);
    }
  }

  // Verificar teléfono único (si se quiere cambiar)
  if (telefono && telefono !== cliente.telefono) {
    const existeTelefono = await Cliente.findOne({ where: { telefono } });
    if (existeTelefono) {
      throw new AppError("Ya existe un cliente con ese teléfono", 409);
    }
  }

  // Actualizar solo campos proporcionados
  await cliente.update({
    ...(nombre && { nombre: nombre.trim() }),
    ...(apellido && { apellido: apellido.trim() }),
    ...(telefono !== undefined && { telefono }),
    // Aseguramos que el email se guarda limpio y en minúsculas
    ...(email && { email: email.toLowerCase().trim() }),
    ...(consentimiento_datos !== undefined && { consentimiento_datos }),
  });

  return cliente;
};
export const eliminar = async (id) => {
  /* ... código de eliminar sin cambios ... */

  const cliente = await Cliente.findByPk(id);

  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }

  // Verificar relaciones
  const tieneConsultas = await Consulta.count({ where: { id_cliente: id } });
  const tieneCasos = await Caso.count({ where: { id_cliente: id } });

  if (tieneConsultas > 0 || tieneCasos > 0) {
    throw new AppError(
      `No se puede eliminar el cliente porque tiene ${tieneConsultas} consultas y ${tieneCasos} casos asociados`,
      409
    );
  }

  // Eliminar
  await cliente.destroy();

  return {
    message: "Cliente eliminado exitosamente",
    id: id,
  };
};

// Calcula 0-100 de completitud del perfil
export const obtenerPorcentajeCompletitud = (cliente) => {
  const tipo = cliente.tipo_persona || "fisica";
  if (tipo === "juridica") {
    const campos = ["cuit", "razon_social", "domicilio_sede", "localidad"];
    const completos = campos.filter((c) => !!cliente[c]).length;
    return Math.round((completos / campos.length) * 100);
  }
  const campos = ["dni", "domicilio_real", "fecha_nacimiento", "estado_civil", "profesion", "localidad"];
  const completos = campos.filter((c) => !!cliente[c]).length;
  return Math.round((completos / campos.length) * 100);
};

// Valida si el cliente tiene los datos mínimos para apertura de carpeta
export const validarParaAperturaCarpeta = async (id) => {
  const cliente = await Cliente.findByPk(id);
  if (!cliente) throw new AppError("Cliente no encontrado", 404);

  const tipo = cliente.tipo_persona || "fisica";
  const faltantes = [];

  if (tipo === "juridica") {
    if (!cliente.cuit) faltantes.push("CUIT");
    if (!cliente.razon_social) faltantes.push("Razón Social");
    if (!cliente.domicilio_sede) faltantes.push("Domicilio de sede");
  } else {
    if (!cliente.dni) faltantes.push("DNI");
    if (!cliente.domicilio_real) faltantes.push("Domicilio real");
  }

  return {
    apto: faltantes.length === 0,
    faltantes,
    porcentaje_completitud: obtenerPorcentajeCompletitud(cliente.toJSON()),
  };
};


// Verifica si existe un cliente con el email
export const existe = async (email) => {
  if (!email) return false;

  const emailLimpio = email.trim().toLowerCase();
  const cliente = await Cliente.findOne({
    where: { email: emailLimpio },
    attributes: ["id_cliente"],
  });

  return !!cliente;
};

export default {
  crear,
  obtenerTodos,
  obtenerPorId,
  buscar,
  actualizar,
  eliminar,
  existe,
  obtenerPorcentajeCompletitud,
  validarParaAperturaCarpeta,
};

