import clientesService from "../../../src/services/clientes_service.js";
import { Cliente } from "../../../src/models/index.js";
import {
  limpiarTablas,
  crearClientePrueba,
  crearMultiplesClientes,
} from "../../helpers/dbHelpers.js";
import {
  generarEmailUnico,
  generarTelefonoUnico,
} from "../../helpers/testData.js";

describe("Clientes Service - Tests Unitarios", () => {
  beforeEach(async () => {
    await limpiarTablas();
  });

  // ============================================
  // TESTS PARA crear()
  // ============================================

  describe("crear()", () => {
    test("debe crear un cliente correctamente", async () => {
      const datosCliente = {
        nombre: "Juan",
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
        consentimiento_datos: true,
      };

      const cliente = await clientesService.crear(datosCliente);

      expect(cliente).toBeDefined();
      expect(cliente.id_cliente).toBeDefined();
      expect(cliente.nombre).toBe("Juan");
      expect(cliente.apellido).toBe("Pérez");
      expect(cliente.consentimiento_datos).toBe(true);
    });

    test("debe rechazar creación sin nombre", async () => {
      await expect(
        clientesService.crear({
          apellido: "Pérez",
          email: generarEmailUnico(),
          telefono: generarTelefonoUnico(),
        })
      ).rejects.toThrow("Nombre, Apellido, Email y Teléfono son obligatorios");
    });

    test("debe rechazar creación sin apellido", async () => {
      await expect(
        clientesService.crear({
          nombre: "Juan",
          email: generarEmailUnico(),
          telefono: generarTelefonoUnico(),
        })
      ).rejects.toThrow("Nombre, Apellido, Email y Teléfono son obligatorios");
    });

    test("debe rechazar creación sin email", async () => {
      await expect(
        clientesService.crear({
          nombre: "Juan",
          apellido: "Pérez",
          telefono: generarTelefonoUnico(),
        })
      ).rejects.toThrow("Nombre, Apellido, Email y Teléfono son obligatorios");
    });

    test("debe rechazar email con formato inválido", async () => {
      await expect(
        clientesService.crear({
          nombre: "Juan",
          apellido: "Pérez",
          email: "email-invalido",
          telefono: generarTelefonoUnico(),
        })
      ).rejects.toThrow("Error de validación: Debe ser un email válido");
    });

    test("debe rechazar teléfono con formato inválido", async () => {
      await expect(
        clientesService.crear({
          nombre: "Juan",
          apellido: "Pérez",
          email: generarEmailUnico(),
          telefono: "123456",
        })
      ).rejects.toThrow("formato del numero de telefono no es válido");
    });

    test("debe rechazar email duplicado", async () => {
      const email = generarEmailUnico();

      await crearClientePrueba({ email });

      await expect(
        clientesService.crear({
          nombre: "Pedro",
          apellido: "López",
          email: email,
          telefono: generarTelefonoUnico(),
        })
      ).rejects.toThrow("Ya existe un cliente con este email");
    });

    test("debe rechazar teléfono duplicado", async () => {
      const telefono = generarTelefonoUnico();

      await crearClientePrueba({ telefono });

      await expect(
        clientesService.crear({
          nombre: "Pedro",
          apellido: "López",
          email: generarEmailUnico(),
          telefono: telefono,
        })
      ).rejects.toThrow("Ya existe un cliente con este número de teléfono");
    });

    test("debe normalizar email a minúsculas", async () => {
      const cliente = await clientesService.crear({
        nombre: "Juan",
        apellido: "Pérez",
        email: "MAYUSCULAS@TEST.COM",
        telefono: generarTelefonoUnico(),
      });

      expect(cliente.email).toBe("mayusculas@test.com");
    });

    test("debe eliminar espacios del nombre", async () => {
      const cliente = await clientesService.crear({
        nombre: "  Juan  ",
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      });

      expect(cliente.nombre).toBe("Juan");
    });

    test("debe eliminar espacios del apellido", async () => {
      const cliente = await clientesService.crear({
        nombre: "Juan",
        apellido: "  Pérez  ",
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      });

      expect(cliente.apellido).toBe("Pérez");
    });

    test("debe eliminar espacios del email", async () => {
      const email = generarEmailUnico();
      const cliente = await clientesService.crear({
        nombre: "Juan",
        apellido: "Pérez",
        email: `  ${email}  `,
        telefono: generarTelefonoUnico(),
      });

      expect(cliente.email).toBe(email.toLowerCase());
    });

    test("debe asignar fecha_registro automáticamente", async () => {
      const cliente = await clientesService.crear({
        nombre: "Juan",
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      });

      expect(cliente.fecha_registro).toBeDefined();
      expect(cliente.fecha_registro).toBeInstanceOf(Date);
    });

    test("debe asignar consentimiento_datos false por defecto", async () => {
      const cliente = await clientesService.crear({
        nombre: "Juan",
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      });

      expect(cliente.consentimiento_datos).toBe(false);
    });
  });

  // ============================================
  // TESTS PARA obtenerTodos()
  // ============================================

  describe("obtenerTodos()", () => {
    test("debe retornar lista vacía si no hay clientes", async () => {
      const resultado = await clientesService.obtenerTodos();

      expect(resultado.clientes).toEqual([]);
      expect(resultado.pagination.total).toBe(0);
      expect(resultado.pagination.totalPages).toBe(0);
    });

    test("debe retornar todos los clientes si no se especifica paginación", async () => {
      await crearMultiplesClientes(3);

      const resultado = await clientesService.obtenerTodos();

      expect(resultado.clientes).toHaveLength(3);
      expect(resultado.pagination.total).toBe(3);
    });

    test("debe aplicar paginación correctamente", async () => {
      await crearMultiplesClientes(10);

      const resultado = await clientesService.obtenerTodos({
        page: 1,
        limit: 3,
      });

      expect(resultado.clientes).toHaveLength(3);
      expect(resultado.pagination.total).toBe(10);
      expect(resultado.pagination.page).toBe(1);
      expect(resultado.pagination.limit).toBe(3);
      expect(resultado.pagination.totalPages).toBe(4);
    });

    test("debe retornar página específica", async () => {
      await crearMultiplesClientes(10);

      const pagina2 = await clientesService.obtenerTodos({
        page: 2,
        limit: 3,
      });

      expect(pagina2.clientes).toHaveLength(3);
      expect(pagina2.pagination.page).toBe(2);
    });

    test("debe buscar por nombre", async () => {
      await crearClientePrueba({ nombre: "Juan", apellido: "Pérez" });
      await crearClientePrueba({ nombre: "Pedro", apellido: "López" });
      await crearClientePrueba({ nombre: "María", apellido: "García" });

      const resultado = await clientesService.obtenerTodos({ search: "Juan" });

      expect(resultado.clientes).toHaveLength(1);
      expect(resultado.clientes[0].nombre).toBe("Juan");
    });

    test("debe buscar por apellido", async () => {
      await crearClientePrueba({ nombre: "Juan", apellido: "Pérez" });
      await crearClientePrueba({ nombre: "Pedro", apellido: "López" });

      const resultado = await clientesService.obtenerTodos({ search: "López" });

      expect(resultado.clientes).toHaveLength(1);
      expect(resultado.clientes[0].apellido).toBe("López");
    });

    test("debe buscar por email", async () => {
      const email = generarEmailUnico();
      await crearClientePrueba({ email });
      await crearClientePrueba();

      const resultado = await clientesService.obtenerTodos({ search: email });

      expect(resultado.clientes).toHaveLength(1);
      expect(resultado.clientes[0].email).toBe(email);
    });

    // En tests/unit/services/clientes.service.test.js, dentro del test de ordenación
    test("debe ordenar por fecha de registro descendente", async () => {
      // Cliente 1: Creado con una fecha antigua
      const cliente1 = await Cliente.create({
        nombre: "Primero",
        apellido: "ApellidoA", // <--- ¡CAMBIO CLAVE: AÑADIR APELLIDO!
        email: "primero@test.com",
        telefono: "+5491112345678",
        fecha_registro: new Date("2024-01-01T10:00:00.000Z"),
      });

      // Cliente 2: Creado con una fecha más reciente
      const cliente2 = await Cliente.create({
        nombre: "Segundo",
        apellido: "ApellidoB", // <--- ¡CAMBIO CLAVE: AÑADIR APELLIDO!
        email: "segundo@test.com",
        telefono: "+5491198765432",
        fecha_registro: new Date("2024-01-02T10:00:00.000Z"),
      });

      const resultado = await clientesService.obtenerTodos();

      expect(resultado.clientes[0].nombre).toBe("Segundo");
      expect(resultado.clientes[1].nombre).toBe("Primero");
    });

    test("debe retornar solo campos específicos", async () => {
      await crearClientePrueba();

      const resultado = await clientesService.obtenerTodos();
      const cliente = resultado.clientes[0];

      expect(cliente).toHaveProperty("id_cliente");
      expect(cliente).toHaveProperty("nombre");
      expect(cliente).toHaveProperty("apellido");
      expect(cliente).toHaveProperty("email");
      expect(cliente).toHaveProperty("telefono");
      expect(cliente).toHaveProperty("fecha_registro");
      expect(cliente).toHaveProperty("consentimiento_datos");
    });
  });

  // ============================================
  // TESTS PARA obtenerPorId()
  // ============================================

  describe("obtenerPorId()", () => {
    test("debe obtener cliente por ID con sus relaciones", async () => {
      const clienteCreado = await crearClientePrueba();

      const cliente = await clientesService.obtenerPorId(
        clienteCreado.id_cliente
      );

      expect(cliente).toBeDefined();
      expect(cliente.id_cliente).toBe(clienteCreado.id_cliente);
      expect(cliente.nombre).toBe(clienteCreado.nombre);
      expect(cliente).toHaveProperty("consultas");
      expect(cliente).toHaveProperty("casos");
    });

    test("debe lanzar error si cliente no existe", async () => {
      await expect(clientesService.obtenerPorId(99999)).rejects.toThrow(
        "Cliente no encontrado"
      );
    });

    test("debe retornar consultas vacías si no tiene", async () => {
      const cliente = await crearClientePrueba();

      const resultado = await clientesService.obtenerPorId(cliente.id_cliente);

      expect(resultado.consultas).toEqual([]);
    });

    test("debe retornar casos vacíos si no tiene", async () => {
      const cliente = await crearClientePrueba();

      const resultado = await clientesService.obtenerPorId(cliente.id_cliente);

      expect(resultado.casos).toEqual([]);
    });
  });

  // ============================================
  // TESTS PARA buscar()
  // ============================================

  describe("buscar()", () => {
    test("debe buscar clientes por nombre", async () => {
      await crearClientePrueba({ nombre: "Juan", apellido: "García" });
      await crearClientePrueba({ nombre: "Pedro", apellido: "López" });

      const resultados = await clientesService.buscar("Juan");

      expect(resultados).toHaveLength(1);
      expect(resultados[0].nombre).toBe("Juan");
    });

    test("debe buscar clientes por apellido", async () => {
      await crearClientePrueba({ nombre: "Juan", apellido: "García" });
      await crearClientePrueba({ nombre: "Pedro", apellido: "López" });

      const resultados = await clientesService.buscar("López");

      expect(resultados).toHaveLength(1);
      expect(resultados[0].apellido).toBe("López");
    });

    test("debe buscar clientes por email", async () => {
      const email = generarEmailUnico();
      await crearClientePrueba({ email });
      await crearClientePrueba();

      const resultados = await clientesService.buscar(email);

      expect(resultados).toHaveLength(1);
      expect(resultados[0].email).toBe(email);
    });

    test("debe buscar clientes por teléfono", async () => {
      const telefono = generarTelefonoUnico();
      await crearClientePrueba({ telefono });
      await crearClientePrueba();

      const resultados = await clientesService.buscar(telefono);

      expect(resultados).toHaveLength(1);
      expect(resultados[0].telefono).toBe(telefono);
    });

    test("debe rechazar término de búsqueda muy corto", async () => {
      await expect(clientesService.buscar("J")).rejects.toThrow(
        "al menos 2 caracteres"
      );
    });

    test("debe rechazar término vacío", async () => {
      await expect(clientesService.buscar("")).rejects.toThrow(
        "al menos 2 caracteres"
      );
    });

    test("debe limitar resultados a 10", async () => {
      // Crear 15 clientes con el mismo apellido
      for (let i = 0; i < 15; i++) {
        await crearClientePrueba({ apellido: "García" });
      }

      const resultados = await clientesService.buscar("García");

      expect(resultados).toHaveLength(10);
    });

    test("debe buscar de forma case-insensitive", async () => {
      await crearClientePrueba({ nombre: "Juan" });

      const resultados = await clientesService.buscar("juan");

      expect(resultados).toHaveLength(1);
    });
  });

  // ============================================
  // TESTS PARA actualizar()
  // ============================================

  describe("actualizar()", () => {
    test("debe actualizar nombre del cliente", async () => {
      const cliente = await crearClientePrueba({ nombre: "Juan" });

      const actualizado = await clientesService.actualizar(cliente.id_cliente, {
        nombre: "Pedro",
      });

      expect(actualizado.nombre).toBe("Pedro");
    });

    test("debe actualizar múltiples campos", async () => {
      const cliente = await crearClientePrueba();

      const actualizado = await clientesService.actualizar(cliente.id_cliente, {
        nombre: "Nuevo Nombre",
        apellido: "Nuevo Apellido",
      });

      expect(actualizado.nombre).toBe("Nuevo Nombre");
      expect(actualizado.apellido).toBe("Nuevo Apellido");
    });

    test("debe lanzar error si cliente no existe", async () => {
      await expect(
        clientesService.actualizar(99999, { nombre: "Test" })
      ).rejects.toThrow("Cliente no encontrado");
    });

    test("debe rechazar email duplicado", async () => {
      const cliente1 = await crearClientePrueba();
      const cliente2 = await crearClientePrueba();

      await expect(
        clientesService.actualizar(cliente2.id_cliente, {
          email: cliente1.email,
        })
      ).rejects.toThrow("Ya existe un cliente con ese email");
    });

    test("debe rechazar teléfono duplicado", async () => {
      const cliente1 = await crearClientePrueba();
      const cliente2 = await crearClientePrueba();

      await expect(
        clientesService.actualizar(cliente2.id_cliente, {
          telefono: cliente1.telefono,
        })
      ).rejects.toThrow("Ya existe un cliente con ese teléfono");
    });

    test("debe permitir actualizar con el mismo email", async () => {
      const cliente = await crearClientePrueba();

      const actualizado = await clientesService.actualizar(cliente.id_cliente, {
        email: cliente.email,
        nombre: "Nuevo Nombre",
      });

      expect(actualizado.nombre).toBe("Nuevo Nombre");
    });

    test("debe normalizar datos al actualizar", async () => {
      const cliente = await crearClientePrueba();

      const actualizado = await clientesService.actualizar(cliente.id_cliente, {
        nombre: "  Nombre  ",
        apellido: "  Apellido  ",
        email: "  EMAIL@TEST.COM  ",
      });

      expect(actualizado.nombre).toBe("Nombre");
      expect(actualizado.apellido).toBe("Apellido");
      expect(actualizado.email).toBe("email@test.com");
    });
  });

  // ============================================
  // TESTS PARA eliminar()
  // ============================================

  describe("eliminar()", () => {
    test("debe eliminar cliente sin relaciones", async () => {
      const cliente = await crearClientePrueba();

      const resultado = await clientesService.eliminar(cliente.id_cliente);

      expect(resultado.message).toContain("eliminado exitosamente");
      expect(resultado.id).toBe(cliente.id_cliente);

      const clienteEliminado = await Cliente.findByPk(cliente.id_cliente);
      expect(clienteEliminado).toBeNull();
    });

    test("debe lanzar error si cliente no existe", async () => {
      await expect(clientesService.eliminar(99999)).rejects.toThrow(
        "Cliente no encontrado"
      );
    });

    // Nota: Tests de eliminación con relaciones se implementarán
    // cuando tengamos los services de consultas y casos
  });

  // ============================================
  // TESTS PARA existe()
  // ============================================

  describe("existe()", () => {
    test("debe retornar true si el email existe", async () => {
      const cliente = await crearClientePrueba();

      const existe = await clientesService.existe(cliente.email);

      expect(existe).toBe(true);
    });

    test("debe retornar false si el email no existe", async () => {
      const existe = await clientesService.existe("noexiste@test.com");

      expect(existe).toBe(false);
    });

    test("debe buscar email de forma case-insensitive", async () => {
      const email = generarEmailUnico().toLowerCase();
      await crearClientePrueba({ email });

      const existe = await clientesService.existe(email.toUpperCase());

      expect(existe).toBe(true);
    });

    test("debe ignorar espacios en email", async () => {
      const email = generarEmailUnico();
      await crearClientePrueba({ email });

      const existe = await clientesService.existe(`  ${email}  `);

      expect(existe).toBe(true);
    });
  });
});
