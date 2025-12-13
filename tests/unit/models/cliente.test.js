import { Cliente } from "../../../src/models/index.js";
import { limpiarTablas } from "../../helpers/dbHelpers.js";
import {
  generarEmailUnico,
  generarTelefonoUnico,
} from "../../helpers/testData.js";

describe("Modelo Cliente - Tests Unitarios", () => {
  // Limpiar base de datos antes de cada test
  beforeEach(async () => {
    await limpiarTablas();
  });

  // ============================================
  // TESTS DE CREACIÓN EXITOSA
  // ============================================

  test("debe crear un cliente válido con todos los campos", async () => {
    const cliente = await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: generarTelefonoUnico(),
      consentimiento_datos: true,
    });

    expect(cliente.id_cliente).toBeDefined();
    expect(cliente.nombre).toBe("Juan");
    expect(cliente.apellido).toBe("Pérez");
    expect(cliente.consentimiento_datos).toBe(true);
  });

  test("debe crear un cliente con campos opcionales en null", async () => {
    const cliente = await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: generarTelefonoUnico(),
    });

    expect(cliente.id_cliente).toBeDefined();
    expect(cliente.consentimiento_datos).toBe(false); // Default
  });

  // ============================================
  // TESTS DE VALIDACIÓN DE EMAIL
  // ============================================

  test("debe rechazar email duplicado", async () => {
    const email = generarEmailUnico();

    await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: email,
      telefono: generarTelefonoUnico(),
    });

    await expect(
      Cliente.create({
        nombre: "Pedro",
        apellido: "López",
        email: email, // Email duplicado
        telefono: generarTelefonoUnico(),
      })
    ).rejects.toThrow();
  });

  test("debe rechazar email con formato inválido", async () => {
    await expect(
      Cliente.create({
        nombre: "Juan",
        apellido: "Pérez",
        email: "email-invalido",
        telefono: generarTelefonoUnico(),
      })
    ).rejects.toThrow();
  });

  test("debe rechazar email vacío", async () => {
    await expect(
      Cliente.create({
        nombre: "Juan",
        apellido: "Pérez",
        email: "",
        telefono: generarTelefonoUnico(),
      })
    ).rejects.toThrow();
  });

  // ============================================
  // TESTS DE VALIDACIÓN DE NOMBRE
  // ============================================

  test("debe rechazar nombre demasiado corto", async () => {
    await expect(
      Cliente.create({
        nombre: "J", // Menos de 2 caracteres
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      })
    ).rejects.toThrow();
  });

  test("debe rechazar nombre demasiado largo", async () => {
    const nombreLargo = "A".repeat(51); // Más de 50 caracteres

    await expect(
      Cliente.create({
        nombre: nombreLargo,
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      })
    ).rejects.toThrow();
  });

  test("debe aceptar nombre con longitud válida", async () => {
    const cliente = await Cliente.create({
      nombre: "Juan Carlos",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: generarTelefonoUnico(),
    });

    expect(cliente.nombre).toBe("Juan Carlos");
  });

  // ============================================
  // TESTS DE VALIDACIÓN DE APELLIDO
  // ============================================

  test("debe rechazar apellido demasiado corto", async () => {
    await expect(
      Cliente.create({
        nombre: "Juan",
        apellido: "P", // Menos de 2 caracteres
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      })
    ).rejects.toThrow();
  });

  test("debe rechazar apellido demasiado largo", async () => {
    const apellidoLargo = "A".repeat(51); // Más de 50 caracteres

    await expect(
      Cliente.create({
        nombre: "Juan",
        apellido: apellidoLargo,
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      })
    ).rejects.toThrow();
  });

  // ============================================
  // TESTS DE VALIDACIÓN DE TELÉFONO
  // ============================================

  test("debe rechazar teléfono con formato inválido", async () => {
    await expect(
      Cliente.create({
        nombre: "Juan",
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: "123456", // Sin formato internacional
      })
    ).rejects.toThrow();
  });

  test("debe aceptar teléfono con formato internacional correcto", async () => {
    const cliente = await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: "+5491123456789",
    });

    expect(cliente.telefono).toBe("+5491123456789");
  });

  // ============================================
  // TESTS DE VALORES POR DEFECTO
  // ============================================

  test("debe usar fecha actual por defecto en fecha_registro", async () => {
    const cliente = await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: generarTelefonoUnico(),
    });

    const hoy = new Date().toISOString().split("T")[0];
    const fechaCliente = new Date(cliente.fecha_registro)
      .toISOString()
      .split("T")[0];

    expect(fechaCliente).toBe(hoy);
  });

  test("debe tener consentimiento_datos false por defecto", async () => {
    const cliente = await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: generarTelefonoUnico(),
    });

    expect(cliente.consentimiento_datos).toBe(false);
  });

  // ============================================
  // TESTS DE ACTUALIZACIÓN
  // ============================================

  test("debe permitir actualizar campos del cliente", async () => {
    const cliente = await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: generarTelefonoUnico(),
    });

    await cliente.update({ nombre: "Pedro" });

    expect(cliente.nombre).toBe("Pedro");
  });

  // ============================================
  // TESTS DE ELIMINACIÓN
  // ============================================

  test("debe permitir eliminar un cliente", async () => {
    const cliente = await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: generarTelefonoUnico(),
    });

    await cliente.destroy();

    const clienteEliminado = await Cliente.findByPk(cliente.id_cliente);
    expect(clienteEliminado).toBeNull();
  });

  // ============================================
  // TESTS DE BÚSQUEDA
  // ============================================

  test("debe encontrar cliente por email", async () => {
    const email = generarEmailUnico();

    await Cliente.create({
      nombre: "Juan",
      apellido: "Pérez",
      email: email,
      telefono: generarTelefonoUnico(),
    });

    const cliente = await Cliente.findOne({ where: { email } });
    expect(cliente).toBeDefined();
    expect(cliente.email).toBe(email);
  });

  test("debe retornar null si no encuentra cliente", async () => {
    const cliente = await Cliente.findOne({
      where: { email: "noexiste@test.com" },
    });

    expect(cliente).toBeNull();
  });
});
