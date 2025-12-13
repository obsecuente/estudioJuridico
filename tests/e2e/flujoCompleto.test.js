import request from "supertest";
import app from "../../server.js";
import { limpiarTablas } from "../helpers/dbHelpers.js";
import {
  generarEmailUnico,
  generarTelefonoUnico,
} from "../helpers/testData.js";
import { obtenerTokenAdmin } from "../unit/utils/auth.utils.js";

describe("E2E - Flujos Completos de Usuario", () => {
  beforeAll(async () => {
    try {
      adminToken = await obtenerTokenAdmin();
    } catch (e) {
      console.error(
        "FATAL: No se pudo obtener el token de administrador para E2E.",
        e
      );
      throw e;
    }
  });
  beforeEach(async () => {
    await limpiarTablas();
  });

  // ============================================
  // FLUJO COMPLETO: CRUD DE CLIENTE
  // ============================================

  test("Flujo CRUD completo: Crear → Consultar → Actualizar → Buscar → Eliminar", async () => {
    // ========== 1. CREAR CLIENTE ==========
    const nuevoCliente = {
      nombre: "Juan",
      apellido: "Pérez",
      email: generarEmailUnico(),
      telefono: generarTelefonoUnico(),
      consentimiento_datos: true,
    };

    const crearRes = await request(app)
      .post("/api/clientes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(nuevoCliente)
      .expect(201);

    expect(crearRes.body.success).toBe(true);
    const clienteId = crearRes.body.data.id_cliente;
    expect(clienteId).toBeDefined();
    console.log(`✅ Cliente creado con ID: ${clienteId}`);

    // ========== 2. CONSULTAR CLIENTE CREADO ==========
    const consultarRes = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(consultarRes.body.success).toBe(true);
    expect(consultarRes.body.data.nombre).toBe("Juan");
    expect(consultarRes.body.data.apellido).toBe("Pérez");
    expect(consultarRes.body.data.email).toBe(nuevoCliente.email.toLowerCase());
    console.log("✅ Cliente consultado correctamente");

    // ========== 3. ACTUALIZAR CLIENTE ==========
    const actualizarRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: "Juan Actualizado",
        apellido: "Pérez Modificado",
      })
      .expect(200);

    expect(actualizarRes.body.success).toBe(true);
    expect(actualizarRes.body.data.nombre).toBe("Juan Actualizado");
    expect(actualizarRes.body.data.apellido).toBe("Pérez Modificado");
    console.log("✅ Cliente actualizado correctamente");

    // ========== 4. VERIFICAR ACTUALIZACIÓN ==========
    const verificarRes = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .expect(200);

    expect(verificarRes.body.data.nombre).toBe("Juan Actualizado");
    expect(verificarRes.body.data.apellido).toBe("Pérez Modificado");
    console.log("✅ Actualización verificada");

    // ========== 5. BUSCAR CLIENTE ==========
    const buscarRes = await request(app)
      .get(`/api/clientes/search?q=Actualizado`)
      .expect(200);

    expect(buscarRes.body.success).toBe(true);
    expect(buscarRes.body.data).toHaveLength(1);
    expect(buscarRes.body.data[0].nombre).toBe("Juan Actualizado");
    console.log("✅ Cliente encontrado en búsqueda");

    // ========== 6. VERIFICAR EN LISTA GENERAL ==========
    const listaRes = await request(app).get("/api/clientes").expect(200);

    expect(listaRes.body.data).toHaveLength(1);
    expect(listaRes.body.pagination.total).toBe(1);
    console.log("✅ Cliente aparece en lista general");

    // ========== 7. ELIMINAR CLIENTE ==========
    const eliminarRes = await request(app)
      .delete(`/api/clientes/${clienteId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(eliminarRes.body.success).toBe(true);
    expect(eliminarRes.body.message).toContain("eliminado");
    console.log("✅ Cliente eliminado correctamente");

    // ========== 8. VERIFICAR ELIMINACIÓN ==========
    await request(app).get(`/api/clientes/${clienteId}`).expect(404);

    console.log("✅ Verificado que el cliente ya no existe");

    // ========== 9. VERIFICAR QUE NO APARECE EN LISTA ==========
    const listaFinalRes = await request(app).get("/api/clientes").expect(200);

    expect(listaFinalRes.body.data).toHaveLength(0);
    expect(listaFinalRes.body.pagination.total).toBe(0);
    console.log("✅ Cliente no aparece en lista después de eliminación");
  });

  // ============================================
  // FLUJO: VALIDACIONES Y MANEJO DE ERRORES
  // ============================================

  test("Flujo de validaciones: Intentos de crear clientes inválidos", async () => {
    // ========== 1. INTENTO SIN NOMBRE ==========
    await request(app)
      .post("/api/clientes")
      .send({
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: generarTelefonoUnico(),
      })
      .expect(400);
    console.log("✅ Rechazó creación sin nombre");

    // ========== 2. INTENTO CON EMAIL INVÁLIDO ==========
    await request(app)
      .post("/api/clientes")
      .send({
        nombre: "Juan",
        apellido: "Pérez",
        email: "email-invalido",
        telefono: generarTelefonoUnico(),
      })
      .expect(400);
    console.log("✅ Rechazó email inválido");

    // ========== 3. INTENTO CON TELÉFONO INVÁLIDO ==========
    await request(app)
      .post("/api/clientes")
      .send({
        nombre: "Juan",
        apellido: "Pérez",
        email: generarEmailUnico(),
        telefono: "123456",
      })
      .expect(400);
    console.log("✅ Rechazó teléfono inválido");

    // ========== 4. CREAR CLIENTE VÁLIDO ==========
    const email = generarEmailUnico();
    const telefono = generarTelefonoUnico();

    const crearRes = await request(app)
      .post("/api/clientes")
      .send({
        nombre: "Juan",
        apellido: "Pérez",
        email: email,
        telefono: telefono,
      })
      .expect(201);
    console.log("✅ Creó cliente válido");

    // ========== 5. INTENTO DE EMAIL DUPLICADO ==========
    await request(app)
      .post("/api/clientes")
      .send({
        nombre: "Pedro",
        apellido: "López",
        email: email, // Email duplicado
        telefono: generarTelefonoUnico(),
      })
      .expect(409);
    console.log("✅ Rechazó email duplicado");

    // ========== 6. INTENTO DE TELÉFONO DUPLICADO ==========
    await request(app)
      .post("/api/clientes")
      .send({
        nombre: "Pedro",
        apellido: "López",
        email: generarEmailUnico(),
        telefono: telefono, // Teléfono duplicado
      })
      .expect(409);
    console.log("✅ Rechazó teléfono duplicado");
  });

  // ============================================
  // FLUJO: PAGINACIÓN Y BÚSQUEDA
  // ============================================

  test("Flujo de paginación y búsqueda con múltiples clientes", async () => {
    // ========== 1. CREAR 15 CLIENTES ==========
    const clientesCreados = [];

    for (let i = 1; i <= 15; i++) {
      const res = await request(app)
        .post("/api/clientes")
        .send({
          nombre: `Cliente${i}`,
          apellido: `Apellido${i}`,
          email: generarEmailUnico(),
          telefono: generarTelefonoUnico(),
        })
        .expect(201);

      clientesCreados.push(res.body.data);
    }
    console.log("✅ Creados 15 clientes");

    // ========== 2. OBTENER PRIMERA PÁGINA ==========
    const pagina1 = await request(app)
      .get("/api/clientes?page=1&limit=5")
      .expect(200);

    expect(pagina1.body.data).toHaveLength(5);
    expect(pagina1.body.pagination.total).toBe(15);
    expect(pagina1.body.pagination.totalPages).toBe(3);
    expect(pagina1.body.pagination.page).toBe(1);
    console.log("✅ Primera página obtenida (5 clientes)");

    // ========== 3. OBTENER SEGUNDA PÁGINA ==========
    const pagina2 = await request(app)
      .get("/api/clientes?page=2&limit=5")
      .expect(200);

    expect(pagina2.body.data).toHaveLength(5);
    expect(pagina2.body.pagination.page).toBe(2);
    console.log("✅ Segunda página obtenida (5 clientes)");

    // ========== 4. OBTENER TERCERA PÁGINA ==========
    const pagina3 = await request(app)
      .get("/api/clientes?page=3&limit=5")
      .expect(200);

    expect(pagina3.body.data).toHaveLength(5);
    expect(pagina3.body.pagination.page).toBe(3);
    console.log("✅ Tercera página obtenida (5 clientes)");

    // ========== 5. BUSCAR CLIENTE ESPECÍFICO ==========
    const buscarRes = await request(app)
      .get("/api/clientes/search?q=Cliente5")
      .expect(200);

    expect(buscarRes.body.data).toHaveLength(1);
    expect(buscarRes.body.data[0].nombre).toBe("Cliente5");
    console.log("✅ Cliente específico encontrado");

    // ========== 6. BUSCAR CON FILTRO EN LISTA ==========
    const filtrarRes = await request(app)
      .get("/api/clientes?search=Apellido1")
      .expect(200);

    // Debería encontrar Cliente1, Cliente10, Cliente11, Cliente12, Cliente13, Cliente14, Cliente15
    expect(filtrarRes.body.data.length).toBeGreaterThan(0);
    console.log(
      `✅ Búsqueda con filtro encontró ${filtrarRes.body.data.length} clientes`
    );

    // ========== 7. ACTUALIZAR UN CLIENTE ==========
    const clienteId = clientesCreados[0].id_cliente;

    await request(app)
      .put(`/api/clientes/${clienteId}`)
      .send({ nombre: "Cliente Actualizado" })
      .expect(200);
    console.log("✅ Cliente actualizado en lote");

    // ========== 8. VERIFICAR ACTUALIZACIÓN ==========
    const verificarRes = await request(app)
      .get(`/api/clientes/${clienteId}`)
      .expect(200);

    expect(verificarRes.body.data.nombre).toBe("Cliente Actualizado");
    console.log("✅ Actualización verificada");
  });

  // ============================================
  // FLUJO: MANEJO DE RECURSOS NO EXISTENTES
  // ============================================

  test("Flujo de manejo de recursos no existentes", async () => {
    // ========== 1. INTENTAR OBTENER CLIENTE INEXISTENTE ==========
    await request(app).get("/api/clientes/99999").expect(404);
    console.log("✅ Error 404 al buscar cliente inexistente");

    // ========== 2. INTENTAR ACTUALIZAR CLIENTE INEXISTENTE ==========
    await request(app)
      .put("/api/clientes/99999")
      .send({ nombre: "Test" })
      .expect(404);
    console.log("✅ Error 404 al actualizar cliente inexistente");

    // ========== 3. INTENTAR ELIMINAR CLIENTE INEXISTENTE ==========
    await request(app).delete("/api/clientes/99999").expect(404);
    console.log("✅ Error 404 al eliminar cliente inexistente");

    // ========== 4. BUSCAR CON LISTA VACÍA ==========
    const listaRes = await request(app).get("/api/clientes").expect(200);

    expect(listaRes.body.data).toEqual([]);
    expect(listaRes.body.pagination.total).toBe(0);
    console.log("✅ Lista vacía retornada correctamente");

    // ========== 5. BUSCAR CON TÉRMINO NO ENCONTRADO ==========
    const buscarRes = await request(app)
      .get("/api/clientes/search?q=NoExiste123")
      .expect(200);

    expect(buscarRes.body.data).toEqual([]);
    expect(buscarRes.body.total).toBe(0);
    console.log("✅ Búsqueda sin resultados manejada correctamente");
  });

  // ============================================
  // FLUJO: NORMALIZACIÓN DE DATOS
  // ============================================

  test("Flujo de normalización de datos al crear y actualizar", async () => {
    // ========== 1. CREAR CON ESPACIOS Y MAYÚSCULAS ==========
    const crearRes = await request(app)
      .post("/api/clientes")
      .send({
        nombre: "  Juan  ",
        apellido: "  Pérez  ",
        email: "  EMAIL@TEST.COM  ",
        telefono: generarTelefonoUnico(),
      })
      .expect(201);

    expect(crearRes.body.data.nombre).toBe("Juan");
    expect(crearRes.body.data.apellido).toBe("Pérez");
    expect(crearRes.body.data.email).toBe("email@test.com");
    console.log("✅ Datos normalizados en creación");

    const clienteId = crearRes.body.data.id_cliente;

    // ========== 2. ACTUALIZAR CON ESPACIOS Y MAYÚSCULAS ==========
    const actualizarRes = await request(app)
      .put(`/api/clientes/${clienteId}`)
      .send({
        nombre: "  Pedro  ",
        apellido: "  López  ",
      })
      .expect(200);

    expect(actualizarRes.body.data.nombre).toBe("Pedro");
    expect(actualizarRes.body.data.apellido).toBe("López");
    console.log("✅ Datos normalizados en actualización");
  });
});
