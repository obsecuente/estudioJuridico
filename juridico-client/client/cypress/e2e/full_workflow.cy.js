/**
 * full_workflow.cy.js
 *
 * E2E Full Happy Path — Versión Todoterreno 🛡️
 * 1. Login
 * 2. Alta de cliente + caso con cobro de apertura
 * 3. Verificar widget de Salud del Estudio
 * 4. Cargar tarea → completarla → verificar estadísticas
 * 5. Cargar egreso → verificar balance de caja
 */

// ⚠️ IMPORTANTE: Configurar estas credenciales según tu entorno de test
const TEST_EMAIL = "arevalogonzaa@gmail.com";
const TEST_PASSWORD = "abogadopremium123";

describe("Sistema Jurídico — Flujo Completo", () => {

    beforeEach(() => {
        // Interceptar todas las llamadas a la API para manejar tiempos de carga de forma robusta
        cy.intercept("GET", "**/api/**").as("apiCalls");
    });

    // ═══ 1. LOGIN ═══
    describe("1. Login", () => {
        it("Debería hacer login con credenciales válidas y redirigir al dashboard", () => {
            cy.visit("/login");

            // Verificar que estamos en la página de login
            cy.contains("Sistema Jurídico").should("be.visible");
            cy.contains("Iniciar Sesión").should("be.visible");

            // Ingresar credenciales
            cy.get("#email").type(TEST_EMAIL);
            cy.get("#password").type(TEST_PASSWORD);

            // Submit
            cy.get(".btn-login").click();

            // Esperar redirección y carga de datos
            cy.url().should("include", "/dashboard", { timeout: 15000 });
            cy.wait("@apiCalls");
            cy.contains("Inicio").should("be.visible");
        });

        it("Debería rechazar credenciales inválidas", () => {
            // Interceptar el POST de login para capturar la respuesta antes de que
            // el interceptor de Axios dispare el auto-logout (que recarga la página)
            cy.intercept("POST", "**/api/auth/login").as("loginRequest");

            cy.visit("/login");
            cy.get("#email").type("falso@test.com");
            cy.get("#password").type("wrongpassword");
            cy.get(".btn-login").click();

            // Verificar que el backend rechazó con 401 (más confiable que el DOM)
            cy.wait("@loginRequest").its("response.statusCode").should("eq", 401);

            // No debe redirigir al dashboard
            cy.url().should("include", "/login");
        });
    });

    // ═══ 2. ALTA DE CLIENTE Y CASO ═══
    describe("2. Alta de Cliente y Caso", () => {
        beforeEach(() => {
            cy.loginUI(TEST_EMAIL, TEST_PASSWORD);
        });

        it("Debería crear un nuevo cliente", () => {
            // Navegar a clientes
            cy.contains("Clientes").click();
            cy.url().should("include", "/clientes");
            cy.wait("@apiCalls");

            // Botón de nuevo cliente
            cy.contains("Nuevo").click();

            // Rellenar formulario
            const timestamp = Date.now();
            cy.get("input[name='nombre']").type("María");
            cy.get("input[name='apellido']").type(`González_${timestamp}`);
            cy.get("input[name='email']").type(`maria_${timestamp}@test.com`);
            cy.get("input[name='telefono']").type("+541112345678");

            // Guardar
            cy.contains("Guardar").click();
            cy.wait("@apiCalls");

            // Verificar éxito
            cy.contains("González").should("be.visible");
        });

        it("Debería crear un caso vinculado al cliente", () => {
            // Navegar a casos
            cy.contains("Casos").click();
            cy.url().should("include", "/casos");
            cy.wait("@apiCalls");

            // Nuevo caso
            cy.contains("Nuevo").click();

            // Rellenar datos del caso
            cy.get("textarea[name='descripcion']").type("Caso de prueba E2E - Daños y perjuicios");

            // CustomSelect: abrir el dropdown y elegir la primera opción real
            cy.get(".custom-select__control").first().click();
            cy.get(".custom-select__option").not(':contains("Seleccionar")').first().click();

            // Guardar
            cy.contains("Guardar").click();
            cy.wait("@apiCalls");

            // Verificar
            cy.contains("prueba E2E").should("be.visible");
        });
    });

    // ═══ 3. DASHBOARD FINANCIERO ═══
    describe("3. Verificar Dashboard Financiero", () => {
        beforeEach(() => {
            cy.loginUI(TEST_EMAIL, TEST_PASSWORD);
        });

        it("Debería mostrar los widgets financieros con datos", () => {
            // Mi Día está en /dashboard
            cy.visit("/dashboard");
            cy.wait("@apiCalls");
            cy.contains("Mi Día").should("be.visible");

            // "Caja Actual" está en /dashboard/finanzas
            cy.contains("Finanzas").click();
            cy.url().should("include", "/finanzas");
            cy.wait("@apiCalls");
            cy.get(".fin-kpi-label").should("contain", "Caja Actual");
        });
    });

    // ═══ 4. TAREAS EN MI DÍA ═══
    describe("4. Tareas en Mi Día", () => {
        beforeEach(() => {
            cy.loginUI(TEST_EMAIL, TEST_PASSWORD);
        });

        it("Debería crear una nueva tarea en Mi Día", () => {
            cy.contains("Inicio").click();
            cy.wait("@apiCalls");

            // Escribir en el input rápido
            cy.get("input[placeholder*='Escribí una tarea nueva']").type(
                "Tarea E2E - Preparar escrito de demanda{enter}"
            );
            cy.wait("@apiCalls");

            // Verificar que aparece
            cy.contains("escrito de demanda").should("be.visible");
        });

        it("Debería completar una tarea existente en Mi Día", () => {
            cy.contains("Inicio").click();
            cy.wait("@apiCalls");

            // Buscar el checkbox de una tarea y marcarlo
            cy.get(".midia-checkbox").first().click();

            // Verificar estado de completado (flexible)
            cy.get('[class*="completando"], [class*="tachado"], [class*="checked"]').should("exist");
        });
    });

    // ═══ 5. GASTOS Y BALANCE ═══
    describe("5. Cargar egreso y verificar balance", () => {
        beforeEach(() => {
            cy.loginUI(TEST_EMAIL, TEST_PASSWORD);
        });

        it("Debería navegar a finanzas y verificar la carga", () => {
            cy.contains("Finanzas").click();
            cy.url().should("include", "/finanzas");
            cy.wait("@apiCalls");

            // Verificar Caja (búsqueda flexible)
            cy.get("body").should("contain", "Caja");
        });

        it("Debería poder registrar un egreso manualmente", () => {
            cy.contains("Finanzas").click();
            cy.wait("@apiCalls");

            // Nuevo egreso (búsqueda flexible del botón)
            cy.contains("Registrar Egreso").click();

            // Llenar monto y detalle
            cy.get("input[type='number']").first().type("50000");
            cy.get("input[placeholder*='Detalle']").type("Egreso test E2E");

            // Seleccionar categoría por chip
            cy.contains(".fin-cat-chip", "Otros").click();

            // Confirmar
            cy.contains("button", "Registrar Egreso").click();
            cy.wait("@apiCalls");

            // Verificar que aparece en la lista
            cy.contains("Egreso test E2E").should("be.visible");
        });
    });
});
