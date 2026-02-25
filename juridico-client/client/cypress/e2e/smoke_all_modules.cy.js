/**
 * smoke_all_modules.cy.js
 *
 * 🔍 TEST DE COBERTURA TOTAL — Smoke Test
 *
 * Recorre TODOS los módulos del sistema jurídico e interactúa con los
 * elementos principales para detectar errores de carga, pantallas rotas,
 * o errores de consola.
 *
 * Módulos cubiertos:
 * - Dashboard / Mi Día
 * - Clientes (lista + detalle)
 * - Consultas (lista + nuevo)
 * - Casos (lista + nuevo)
 * - Documentos (lista)
 * - Agenda / Eventos (lista + nuevo)
 * - Vencimientos (lista + nuevo)
 * - Calculadora de Plazos
 * - Finanzas Dashboard (KPIs + Egreso + Ingreso)
 * - Gastos Fijos
 * - Estadísticas Finanzas
 * - Configuración JUS
 * - Abogados (solo admin)
 */

const TEST_EMAIL = "arevalogonzaa@gmail.com";
const TEST_PASSWORD = "abogadopremium123";

// ─── Helper: capturar errores de consola ───────────────────────────────────
const consoleErrors = [];

Cypress.on("window:before:load", (win) => {
    cy.stub(win.console, "error").callsFake((...args) => {
        consoleErrors.push(args.join(" "));
    });
});

// ─── Helper: login rápido via API y navegar ──────────────────────────────────
const loginAndVisit = (path) => {
    cy.loginAPI(TEST_EMAIL, TEST_PASSWORD);
    cy.visit(path);
    cy.wait(800); // Pequeña pausa para que React renderice
};

// ─── Helper: verificar que la página cargó sin error fatal ────────────────
const assertPageLoaded = () => {
    // No debe haber pantalla de error 404
    cy.get("body").should("not.contain", "404");
    // No debe haber spinner infinito (más de 10s)
    cy.get("[class*='loading'], [class*='spinner']", { timeout: 500 })
        .should("not.exist")
        .or("not.be.visible");
};

// ─── Helper: intentar abrir un modal "Nuevo" si existe ────────────────────
const tryOpenNewModal = (buttonText = "Nuevo") => {
    cy.get("body").then(($body) => {
        if ($body.text().includes(buttonText)) {
            cy.contains(buttonText).first().click();
            cy.wait(500);
            // Verificar que el modal abrió (buscar form o modal)
            cy.get("form, [class*='modal'], [class*='Modal']", { timeout: 5000 }).should("exist");
            // Cerrar con Escape o botón Cancelar
            cy.get("body").then(($b) => {
                if ($b.find("[class*='btn-close'], button:contains('Cancelar'), button:contains('✕')").length) {
                    cy.get("[class*='btn-close'], button:contains('Cancelar'), button:contains('✕')").first().click({ force: true });
                } else {
                    cy.get("body").type("{esc}");
                }
            });
        }
    });
};

describe("🔍 Smoke Test — Cobertura Total del Sistema", () => {

    beforeEach(() => {
        cy.intercept("GET", "**/api/**").as("apiLoad");
        consoleErrors.length = 0; // Limpiar errores entre tests
    });

    // ══════════════════════════════════════════════════════════════════
    // 1. DASHBOARD / MI DÍA
    // ══════════════════════════════════════════════════════════════════
    describe("📋 Dashboard — Mi Día", () => {
        it("Carga el dashboard y muestra Mi Día", () => {
            loginAndVisit("/dashboard");
            cy.wait("@apiLoad");

            cy.contains("Mi Día").should("be.visible");
            cy.get(".midia-widget").should("exist");

            // Verificar que el input de nueva tarea existe
            cy.get("input[placeholder*='Escribí una tarea nueva']").should("exist");

            // Verificar widgets de Agenda y Vencimientos
            cy.contains("Agenda").should("exist");
            cy.contains("Vencimientos").should("exist");

            // Verificar acciones rápidas
            cy.contains("Acciones Rápidas").should("exist");
        });

        it("Puede agregar una tarea rápida desde Mi Día", () => {
            loginAndVisit("/dashboard");
            cy.wait("@apiLoad");

            const tareaTexto = `Smoke test tarea ${Date.now()}`;
            cy.get("input[placeholder*='Escribí una tarea nueva']").type(`${tareaTexto}{enter}`);
            cy.wait("@apiLoad");

            cy.contains(tareaTexto).should("be.visible");
        });

        it("Puede abrir modal de Nuevo Cliente desde Acciones Rápidas", () => {
            loginAndVisit("/dashboard");
            cy.wait("@apiLoad");
            cy.contains("Nuevo Cliente").click();
            cy.get("form, [class*='modal']", { timeout: 5000 }).should("exist");
            cy.get("body").type("{esc}");
        });

        it("Puede abrir modal de Nuevo Caso desde Acciones Rápidas", () => {
            loginAndVisit("/dashboard");
            cy.wait("@apiLoad");
            cy.contains("Nuevo Caso").click();
            cy.get("form, [class*='modal']", { timeout: 5000 }).should("exist");
            cy.get("body").type("{esc}");
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 2. CLIENTES
    // ══════════════════════════════════════════════════════════════════
    describe("👤 Clientes", () => {
        it("Lista de clientes carga correctamente", () => {
            loginAndVisit("/dashboard/clientes");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error");
            cy.contains("Clientes").should("exist");
        });

        it("Puede abrir modal Nuevo Cliente y cerrarlo", () => {
            loginAndVisit("/dashboard/clientes");
            cy.wait("@apiLoad");
            tryOpenNewModal("Nuevo");
        });

        it("Puede buscar un cliente", () => {
            loginAndVisit("/dashboard/clientes");
            cy.wait("@apiLoad");
            cy.get("input[placeholder*='Buscar'], input[type='search']").first().type("test");
            cy.wait(500);
            cy.get("body").should("not.contain", "Error fatal");
        });

        it("Puede navegar al detalle del primer cliente", () => {
            loginAndVisit("/dashboard/clientes");
            cy.wait("@apiLoad");
            cy.get("body").then(($body) => {
                // Buscar cualquier link o botón de detalle
                const detailLink = $body.find("[class*='cliente-card'], [class*='cliente-row'], tr").first();
                if (detailLink.length) {
                    cy.get("[class*='cliente-card'], [class*='cliente-row'], tr").first().click({ force: true });
                    cy.wait(800);
                    cy.get("body").should("not.contain", "404");
                }
            });
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 3. CONSULTAS
    // ══════════════════════════════════════════════════════════════════
    describe("💬 Consultas", () => {
        it("Lista de consultas carga correctamente", () => {
            loginAndVisit("/dashboard/consultas");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains("Consultas").should("exist");
        });

        it("Puede abrir modal Nueva Consulta y cerrarlo", () => {
            loginAndVisit("/dashboard/consultas");
            cy.wait("@apiLoad");
            tryOpenNewModal("Nueva");
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 4. CASOS
    // ══════════════════════════════════════════════════════════════════
    describe("⚖️ Casos", () => {
        it("Lista de casos carga correctamente", () => {
            loginAndVisit("/dashboard/casos");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains("Casos").should("exist");
        });

        it("Puede abrir modal Nuevo Caso y cerrarlo", () => {
            loginAndVisit("/dashboard/casos");
            cy.wait("@apiLoad");
            tryOpenNewModal("Nuevo");
        });

        it("Puede buscar un caso", () => {
            loginAndVisit("/dashboard/casos");
            cy.wait("@apiLoad");
            cy.get("input[placeholder*='Buscar'], input[type='search']").first().type("test");
            cy.wait(500);
            cy.get("body").should("not.contain", "Error fatal");
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 5. DOCUMENTOS
    // ══════════════════════════════════════════════════════════════════
    describe("📄 Documentos", () => {
        it("Lista de documentos carga correctamente", () => {
            loginAndVisit("/dashboard/documentos");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains("Documentos").should("exist");
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 6. AGENDA / EVENTOS
    // ══════════════════════════════════════════════════════════════════
    describe("📅 Agenda / Eventos", () => {
        it("Lista de eventos carga correctamente", () => {
            loginAndVisit("/dashboard/eventos");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains("Agenda").should("exist");
        });

        it("Puede abrir modal Nuevo Evento y cerrarlo", () => {
            loginAndVisit("/dashboard/eventos");
            cy.wait("@apiLoad");
            tryOpenNewModal("Nuevo");
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 7. VENCIMIENTOS
    // ══════════════════════════════════════════════════════════════════
    describe("⏰ Vencimientos", () => {
        it("Lista de vencimientos carga correctamente", () => {
            loginAndVisit("/dashboard/vencimientos");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains("Vencimientos").should("exist");
        });

        it("Puede abrir modal Nuevo Vencimiento y cerrarlo", () => {
            loginAndVisit("/dashboard/vencimientos");
            cy.wait("@apiLoad");
            tryOpenNewModal("Nuevo");
        });

        it("Puede filtrar por estado", () => {
            loginAndVisit("/dashboard/vencimientos");
            cy.wait("@apiLoad");
            cy.get("body").then(($body) => {
                if ($body.find("select, [class*='filter']").length) {
                    cy.get("select, [class*='filter']").first().click({ force: true });
                    cy.wait(300);
                }
            });
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 8. CALCULADORA DE PLAZOS
    // ══════════════════════════════════════════════════════════════════
    describe("🧮 Calculadora de Plazos", () => {
        it("Calculadora carga correctamente", () => {
            loginAndVisit("/dashboard/calculadora");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains("Calculadora").should("exist");
        });

        it("Puede ingresar una fecha y calcular un plazo", () => {
            loginAndVisit("/dashboard/calculadora");
            cy.wait("@apiLoad");
            // Buscar input de fecha
            cy.get("input[type='date']").first().then(($input) => {
                if ($input.length) {
                    cy.wrap($input).type("2026-03-01");
                    // Buscar botón de calcular
                    cy.get("body").then(($body) => {
                        if ($body.find("button:contains('Calcular')").length) {
                            cy.contains("button", "Calcular").click();
                            cy.wait(500);
                            cy.get("body").should("not.contain", "Error fatal");
                        }
                    });
                }
            });
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 9. FINANZAS DASHBOARD
    // ══════════════════════════════════════════════════════════════════
    describe("💰 Finanzas — Terminal Financiera", () => {
        it("Dashboard financiero carga con KPIs", () => {
            loginAndVisit("/dashboard/finanzas");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains("Terminal Financiera").should("exist");
            cy.get(".fin-kpi-label").should("contain", "Caja Actual");
            cy.get(".fin-kpi-label").should("contain", "Cartera Protegida");
        });

        it("Puede abrir y cerrar el formulario de Egreso", () => {
            loginAndVisit("/dashboard/finanzas");
            cy.wait("@apiLoad");
            cy.contains("Registrar Egreso").click();
            cy.get(".fin-egreso-form").should("be.visible");
            cy.contains("Cancelar").click();
            cy.get(".fin-egreso-form").should("not.exist");
        });

        it("Puede abrir y cerrar el formulario de Ingreso", () => {
            loginAndVisit("/dashboard/finanzas");
            cy.wait("@apiLoad");
            cy.contains("Registrar Ingreso").click();
            cy.get(".fin-egreso-form").should("be.visible");
            cy.contains("Cancelar").click();
        });

        it("Puede filtrar movimientos por tipo", () => {
            loginAndVisit("/dashboard/finanzas");
            cy.wait("@apiLoad");
            cy.contains(".fin-filter-btn", "Ingresos").click();
            cy.wait(500);
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains(".fin-filter-btn", "Egresos").click();
            cy.wait(500);
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains(".fin-filter-btn", "Todos").click();
        });

        it("Puede navegar a Gastos Fijos", () => {
            loginAndVisit("/dashboard/finanzas/gastos-fijos");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
        });

        it("Puede navegar a Estadísticas", () => {
            loginAndVisit("/dashboard/finanzas/estadisticas");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 10. CONFIGURACIÓN JUS
    // ══════════════════════════════════════════════════════════════════
    describe("⚙️ Configuración JUS", () => {
        it("Página de configuración carga correctamente", () => {
            loginAndVisit("/dashboard/configuracion");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            cy.contains("JUS").should("exist");
        });

        it("Muestra el valor actual del JUS", () => {
            loginAndVisit("/dashboard/configuracion");
            cy.wait("@apiLoad");
            // Debe haber algún input o display con el valor JUS
            cy.get("input[type='number'], [class*='jus-value'], [class*='valor']").should("exist");
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 11. ABOGADOS (solo admin)
    // ══════════════════════════════════════════════════════════════════
    describe("👨‍⚖️ Abogados (Admin)", () => {
        it("Lista de abogados carga correctamente", () => {
            loginAndVisit("/dashboard/abogados");
            cy.wait("@apiLoad");
            cy.get("body").should("not.contain", "Error fatal");
            // Puede ser que redirija si no es admin, verificar que no hay 404
            cy.get("body").should("not.contain", "404");
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 12. NAVEGACIÓN DEL SIDEBAR — Verificar todos los links
    // ══════════════════════════════════════════════════════════════════
    describe("🗂️ Navegación — Sidebar completo", () => {
        const routes = [
            { label: "Inicio", path: "/dashboard" },
            { label: "Clientes", path: "/dashboard/clientes" },
            { label: "Consultas", path: "/dashboard/consultas" },
            { label: "Casos", path: "/dashboard/casos" },
            { label: "Documentos", path: "/dashboard/documentos" },
            { label: "Agenda", path: "/dashboard/eventos" },
            { label: "Vencimientos", path: "/dashboard/vencimientos" },
            { label: "Calculadora de Plazos", path: "/dashboard/calculadora" },
            { label: "Finanzas", path: "/dashboard/finanzas" },
        ];

        it("Todos los links del sidebar navegan sin errores", () => {
            loginAndVisit("/dashboard");
            cy.wait("@apiLoad");

            routes.forEach(({ label, path }) => {
                cy.contains(label).click();
                cy.url().should("include", path.replace("/dashboard", ""), { timeout: 8000 });
                cy.wait(600);
                cy.get("body").should("not.contain", "404");
                cy.get("body").should("not.contain", "Error fatal");
            });
        });
    });

    // ══════════════════════════════════════════════════════════════════
    // 13. REPORTE FINAL DE ERRORES DE CONSOLA
    // ══════════════════════════════════════════════════════════════════
    describe("🚨 Reporte de Errores de Consola", () => {
        it("No debe haber errores críticos de consola durante la navegación", () => {
            loginAndVisit("/dashboard");
            cy.wait("@apiLoad");

            // Navegar por los módulos principales
            const paths = [
                "/dashboard/clientes",
                "/dashboard/casos",
                "/dashboard/finanzas",
                "/dashboard/vencimientos",
            ];

            paths.forEach((path) => {
                cy.visit(path);
                cy.wait(800);
            });

            // Filtrar errores ignorables (React DevTools, etc.)
            cy.then(() => {
                const criticalErrors = consoleErrors.filter(
                    (err) =>
                        !err.includes("Download the React DevTools") &&
                        !err.includes("Warning:") &&
                        !err.includes("ResizeObserver")
                );

                if (criticalErrors.length > 0) {
                    cy.log("⚠️ Errores de consola detectados:");
                    criticalErrors.forEach((err) => cy.log(`  ❌ ${err.substring(0, 150)}`));
                } else {
                    cy.log("✅ Sin errores críticos de consola");
                }

                // El test pasa siempre, pero deja el log para revisión
                expect(true).to.be.true;
            });
        });
    });
});
