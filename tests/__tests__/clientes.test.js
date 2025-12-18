import request from "supertest";
import app from "../../server.js";
import { Cliente } from "../../src/models/index.js";

describe("CRUD de Clientes", () => {
  beforeEach(async () => {
    await Cliente.destroy({ where: {}, force: true });
  });

  describe("POST /api/clientes - Crear cliente", () => {
    test("Debería crear un cliente correctamente", async () => {
      const nuevoCliente = {
        nombre: "Juan",
        apellido: "Pérez",
        email: "juan@test.com",
        telefono: "+541112345678",
        consentimiento_datos: true,
      };

      const response = await request(app)
        .post("/api/clientes")
        .send(nuevoCliente)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id_cliente");
      expect(response.body.data.email).toBe("juan@test.com");
    });

    test("Debería rechazar email duplicado", async () => {
      const cliente = {
        nombre: "Juan",
        apellido: "Pérez",
        email: "duplicado@test.com",
        telefono: "+541112345678",
      };

      await request(app).post("/api/clientes").send(cliente);

      const response = await request(app)
        .post("/api/clientes")
        .send(cliente)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    test("Debería rechazar datos incompletos", async () => {
      const response = await request(app)
        .post("/api/clientes")
        .send({ nombre: "Solo nombre" })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/clientes - Obtener clientes", () => {
    test("Debería obtener lista de clientes", async () => {
      await Cliente.create({
        nombre: "Cliente1",
        apellido: "Apellido1",
        email: "cliente1@test.com",
        telefono: "+541112345678",
      });

      const response = await request(app).get("/api/clientes").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty("total");
    });

    test("Debería soportar paginación", async () => {
      const response = await request(app)
        .get("/api/clientes?page=1&limit=10")
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe("GET /api/clientes/:id - Obtener cliente por ID", () => {
    test("Debería obtener un cliente específico", async () => {
      const cliente = await Cliente.create({
        nombre: "Juan",
        apellido: "Pérez",
        email: "juan@test.com",
        telefono: "+541112345678",
      });

      const response = await request(app)
        .get(`/api/clientes/${cliente.id_cliente}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe("juan@test.com");
    });

    test("Debería retornar 404 si no existe", async () => {
      const response = await request(app)
        .get("/api/clientes/99999")
        .expect(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/clientes/:id - Actualizar cliente", () => {
    test("Debería actualizar un cliente", async () => {
      const cliente = await Cliente.create({
        nombre: "Juan",
        apellido: "Pérez",
        email: "juan@test.com",
        telefono: "+541112345678",
      });

      const response = await request(app)
        .put(`/api/clientes/${cliente.id_cliente}`)
        .send({ nombre: "Juan Carlos" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe("Juan Carlos");
    });
  });

  describe("DELETE /api/clientes/:id - Eliminar cliente", () => {
    test("Debería eliminar un cliente sin relaciones", async () => {
      const cliente = await Cliente.create({
        nombre: "Juan",
        apellido: "Pérez",
        email: "eliminar@test.com",
        telefono: "+541112345678",
      });

      const response = await request(app)
        .delete(`/api/clientes/${cliente.id_cliente}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const clienteEliminado = await Cliente.findByPk(cliente.id_cliente);
      expect(clienteEliminado).toBeNull();
    });
  });

  describe("GET /api/clientes/search - Buscar clientes", () => {
    beforeEach(async () => {
      await Cliente.bulkCreate([
        {
          nombre: "María",
          apellido: "González",
          email: "maria@test.com",
          telefono: "+541112345678",
        },
        {
          nombre: "Pedro",
          apellido: "Martínez",
          email: "pedro@test.com",
          telefono: "+541187654321",
        },
      ]);
    });

    test("Debería buscar clientes por nombre", async () => {
      const response = await request(app)
        .get("/api/clientes/search?q=María")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test("Debería rechazar búsquedas muy cortas", async () => {
      const response = await request(app)
        .get("/api/clientes/search?q=a")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
