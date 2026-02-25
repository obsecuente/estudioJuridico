// cypress/support/e2e.js
// Global commands and setup for Cypress E2E tests

// Custom command: Login via UI (solo para tests de login)
Cypress.Commands.add("loginUI", (email, password) => {
    cy.visit("/login");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.get(".btn-login").click();
    cy.url().should("include", "/dashboard");
});

// Custom command: Login via API (rápido, sin UI, evita rate limiting)
// Guarda accessToken, refreshToken y user en localStorage tal como lo hace AuthContext
Cypress.Commands.add("loginAPI", (email, password) => {
    cy.request("POST", "http://localhost:3000/api/auth/login", {
        email,
        password,
    }).then((response) => {
        const { accessToken, refreshToken, abogado } = response.body.data;
        window.localStorage.setItem("accessToken", accessToken);
        window.localStorage.setItem("refreshToken", refreshToken);
        window.localStorage.setItem("user", JSON.stringify(abogado));
    });
});
