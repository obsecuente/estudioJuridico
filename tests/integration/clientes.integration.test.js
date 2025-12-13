import request from "supertest";
import app from "../../server.js";
import {
  generarDatosCliente, // ¡NOMBRE CORREGIDO!
  generarEmailUnico,
  generarTelefonoUnico,
} from "../helpers/testData.js";
import { Cliente } from "../../src/models"; // Asegúrate de que la ruta sea correcta
import { obtenerTokenAdmin } from "../unit/utils/auth.utils.js"; // <-- ¡IMPORTACIÓN CRUCIAL!

// Variables globales para la prueba
let clienteCreado;
let adminToken; // <-- Variable para almacenar el token

// Función auxiliar para crear clientes directamente en la base de datos de prueba
const crearClientePrueba = async (data = {}) => {
  const clienteData = {
    nombre: data.nombre || "Juan",
    apellido: data.apellido || "Pérez",
    email: data.email || generarEmailUnico(),
    telefono: data.telefono || generarTelefonoUnico(), // Aseguramos que se registran en diferentes momentos si se llama rápido
    fecha_registro: data.fecha_registro || new Date(),
  };
  return Cliente.create(clienteData);
};

// Función auxiliar para crear múltiples clientes (para paginación/límite)
const crearMultiplesClientes = async (count) => {
  const clientes = [];
  for (let i = 0; i < count; i++) {
    clientes.push(
      crearClientePrueba({
        nombre: `Cliente${i}`,
        apellido: `Apellido${i}`,
        email: `cliente${i}@test.com`,
        telefono: `+5491111110${100 + i}`,
      })
    );
  }
  return Promise.all(clientes);
};

describe("API Integration - Clientes Endpoints", () => {
  // 1. OBTENER TOKEN DE ADMINISTRADOR
  beforeAll(async () => {
    try {
      adminToken = await obtenerTokenAdmin();
      console.log("Token de administrador cargado para tests de integración.");
    } catch (e) {
      console.error("FATAL: No se pudo obtener el token de administrador.", e);
      throw e;
    }
  }); // 2. Limpiar la base de datos antes de cada test
  beforeEach(async () => {
    await Cliente.destroy({ where: {} });
    clienteCreado = await crearClientePrueba({
      nombre: "Juan",
      apellido: "García",
      email: "juan.garcia@test.com",
      telefono: "+5491111111111",
    });
  }); // 3. Tests POST /api/clientes
  describe("POST /api/clientes", () => {
    test("debe crear un cliente y retornar 201", async () => {
      const nuevoCliente = generarDatosCliente();
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send(nuevoCliente)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("creado exitosamente");
    });

    test("debe retornar 400 sin nombre", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          apellido: "García",
          email: generarEmailUnico(),
          telefono: generarTelefonoUnico(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    }); // Resto de tests de validación POST (apellido, email, formato, duplicados)
    test("debe retornar 400 sin apellido", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          nombre: "Juan",
          email: generarEmailUnico(),
          telefono: generarTelefonoUnico(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
    test("debe retornar 400 sin email", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          nombre: "Juan",
          apellido: "Perez",
          telefono: generarTelefonoUnico(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
    test("debe retornar 400 con email inválido", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          nombre: "Juan",
          apellido: "Perez",
          email: "invalido@",
          telefono: generarTelefonoUnico(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("formato del mail");
    });
    test("debe retornar 400 con teléfono inválido", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          nombre: "Juan",
          apellido: "Perez",
          email: generarEmailUnico(),
          telefono: "123456",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("formato del numero de telefono");
    });
    test("debe retornar 409 con email duplicado", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          nombre: "Pedro",
          apellido: "Gómez",
          email: clienteCreado.email, // email duplicado
          telefono: generarTelefonoUnico(),
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Ya existe");
    });
    test("debe retornar 409 con teléfono duplicado", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          nombre: "Pedro",
          apellido: "Gómez",
          email: generarEmailUnico(),
          telefono: clienteCreado.telefono, // telefono duplicado
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Ya existe");
    });
    test("debe normalizar email a minúsculas", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          nombre: "Test",
          apellido: "Normalization",
          email: "TEST@test.com",
          telefono: generarTelefonoUnico(),
        })
        .expect(201);

      expect(response.body.data.email).toBe("test@test.com");
    });
    test("debe rechazar body vacío", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  }); // 4. Tests GET /api/clientes

  describe("GET /api/clientes", () => {
    test("debe obtener lista vacía si no hay clientes", async () => {
      await Cliente.destroy({ where: {} }); // Limpiar DB por completo
      const response = await request(app)
        .get("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    test("debe obtener lista de clientes", async () => {
      await crearClientePrueba({ nombre: "Pedro" }); // Ya tenemos clienteCreado + Pedro = 2
      const response = await request(app)
        .get("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test("debe aplicar paginación", async () => {
      await crearMultiplesClientes(10); // 10 nuevos + 1 del beforeEach = 11
      const response = await request(app)
        .get("/api/clientes?page=1&limit=3")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(11); // Total real de clientes
    });
    test("debe obtener segunda página", async () => {
      await crearMultiplesClientes(10);
      const response = await request(app)
        .get("/api/clientes?page=2&limit=3")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.page).toBe(2);
    });
    test("debe aplicar búsqueda por nombre", async () => {
      // ClienteCreado es Juan
      const response = await request(app)
        .get("/api/clientes?search=Juan")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].nombre).toBe("Juan");
    });
    test("debe retornar campos específicos", async () => {
      // Solo probaremos que los campos básicos estén presentes
      const response = await request(app)
        .get("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      const cliente = response.body.data[0];
      expect(cliente).toHaveProperty("id_abogado"); // <-- ¡CORREGIDO!
      expect(cliente).toHaveProperty("nombre");
      expect(cliente).toHaveProperty("email");
      expect(cliente).not.toHaveProperty("password"); // Sanity check
    });
    test("debe usar límite por defecto de 20", async () => {
      await crearMultiplesClientes(25); // 25 nuevos + 1 del beforeEach = 26
      const response = await request(app)
        .get("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.data).toHaveLength(20);
    });
  }); // 5. Tests GET /api/clientes/:id

  describe("GET /api/clientes/:id", () => {
    test("debe obtener cliente por ID", async () => {
      const cliente = await crearClientePrueba();
      const response = await request(app)
        .get(`/api/clientes/${cliente.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id_abogado).toBe(cliente.id_abogado); // <-- ¡CORREGIDO!
    });

    test("debe incluir consultas del cliente", async () => {
      // ASUMO que Consultas es una tabla relacionada
      const response = await request(app)
        .get(`/api/clientes/${clienteCreado.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.data).toHaveProperty("consultas");
      expect(Array.isArray(response.body.data.consultas)).toBe(true);
    });

    test("debe incluir casos del cliente", async () => {
      // ASUMO que Casos es una tabla relacionada
      const response = await request(app)
        .get(`/api/clientes/${clienteCreado.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.data).toHaveProperty("casos");
      expect(Array.isArray(response.body.data.casos)).toBe(true);
    });

    test("debe retornar 404 si no existe", async () => {
      const response = await request(app)
        .get("/api/clientes/99999")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("no encontrado");
    });

    test("debe retornar 404 con ID inválido", async () => {
      const response = await request(app)
        .get("/api/clientes/abc")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  }); // 6. Tests GET /api/clientes/search

  describe("GET /api/clientes/search", () => {
    test("debe buscar clientes por nombre", async () => {
      // ClienteCreado es Juan García
      const response = await request(app)
        .get("/api/clientes/search?q=Juan")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test("debe buscar clientes por apellido", async () => {
      // ClienteCreado es Juan García
      const response = await request(app)
        .get("/api/clientes/search?q=García")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].apellido).toBe("García");
    });

    test("debe retornar 400 con término muy corto", async () => {
      const response = await request(app)
        .get("/api/clientes/search?q=J")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("al menos 2 caracteres");
    });

    test("debe retornar 400 sin parámetro q", async () => {
      const response = await request(app)
        .get("/api/clientes/search")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test("debe limitar resultados a 10", async () => {
      await crearMultiplesClientes(15);
      const response = await request(app)
        .get("/api/clientes/search?q=Apellido")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body.data).toHaveLength(10);
    });
    test("debe incluir total de resultados", async () => {
      await crearClientePrueba({ nombre: "Juanito" });
      const response = await request(app)
        .get("/api/clientes/search?q=Juan")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.body).toHaveProperty("total");
      expect(response.body.total).toBe(2); // Juan y Juanito
    });
  }); // 7. Tests PUT /api/clientes/:id

  describe("PUT /api/clientes/:id", () => {
    test("debe actualizar nombre del cliente", async () => {
      const response = await request(app)
        .put(`/api/clientes/${clienteCreado.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({ nombre: "Pedro" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe("Pedro");
    });

    test("debe actualizar múltiples campos", async () => {
      const response = await request(app)
        .put(`/api/clientes/${clienteCreado.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({
          nombre: "Nuevo",
          apellido: "Nombre",
        })
        .expect(200);

      expect(response.body.data.nombre).toBe("Nuevo");
      expect(response.body.data.apellido).toBe("Nombre");
    });

    test("debe retornar 404 si no existe", async () => {
      const response = await request(app)
        .put("/api/clientes/99999")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({ nombre: "Pedro" })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test("debe retornar 409 con email duplicado", async () => {
      const otroCliente = await crearClientePrueba({ email: "otro@test.com" });

      const response = await request(app)
        .put(`/api/clientes/${otroCliente.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({ email: clienteCreado.email }) // El email de Juan
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Ya existe");
    });

    test("debe permitir actualizar sin cambiar email", async () => {
      const response = await request(app)
        .put(`/api/clientes/${clienteCreado.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({ nombre: "Juan Nuevo", email: clienteCreado.email }) // Mismo email
        .expect(200);

      expect(response.body.data.nombre).toBe("Juan Nuevo");
    });
    test("debe aceptar body vacío", async () => {
      const response = await request(app)
        .put(`/api/clientes/${clienteCreado.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .send({})
        .expect(200); // No cambia, pero el 200 indica éxito

      expect(response.body.data.nombre).toBe("Juan");
    });
  }); // 8. Tests DELETE /api/clientes/:id

  describe("DELETE /api/clientes/:id", () => {
    test("debe eliminar cliente", async () => {
      const id = clienteCreado.id_abogado; // <-- ¡CORREGIDO!
      await request(app)
        .delete(`/api/clientes/${id}`)
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(204); // Verifica que ya no existe

      const clienteEliminado = await Cliente.findByPk(id);
      expect(clienteEliminado).toBeNull();
    });

    test("debe retornar 404 si no existe", async () => {
      await request(app)
        .delete(`/api/clientes/${clienteCreado.id_abogado}`) // <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(204); // Primero eliminamos el de beforeEach

      await request(app)
        .delete(`/api/clientes/${clienteCreado.id_abogado}`) // Intentar eliminar de nuevo <-- ¡CORREGIDO!
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(404);
    });
    test("cliente eliminado no debe existir en la base de datos", async () => {
      const id = clienteCreado.id_abogado; // <-- ¡CORREGIDO!
      await request(app)
        .delete(`/api/clientes/${id}`)
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(204);

      const clienteEncontrado = await Cliente.findByPk(id);
      expect(clienteEncontrado).toBeNull();
    });
    test("debe retornar 404 con ID inválido", async () => {
      await request(app)
        .delete("/api/clientes/abc")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(404);
    });
  }); // 9. Tests de Seguridad y Headers (estos ya pasaban)

  describe("Seguridad y Headers", () => {
    test("debe retornar Content-Type application/json", async () => {
      await request(app)
        .get("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect("Content-Type", /json/);
    });

    test("debe tener headers de seguridad (helmet)", async () => {
      const response = await request(app)
        .get("/api/clientes")
        .set("Authorization", `Bearer ${adminToken}`) // <-- TOKEN
        .expect(200);

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["referrer-policy"]).toBe("no-referrer");
    });
  });
});
