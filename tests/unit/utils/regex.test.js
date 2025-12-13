import { emailRegex, telefonoRegex } from "../../../src/utils/regex.js";

describe("Regex Utils - Validaciones", () => {
  // ============================================
  // TESTS PARA EMAIL REGEX
  // ============================================

  describe("emailRegex", () => {
    test("debe validar emails correctos", () => {
      const emailsValidos = [
        "test@example.com",
        "user.name@domain.co",
        "admin123@site.org",
        "contact+filter@company.com",
        "info@subdomain.example.com",
      ];

      emailsValidos.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    test("debe rechazar emails inválidos", () => {
      const emailsInvalidos = [
        "invalido",
        "@nodomain.com",
        "sin-arroba.com",
        "espacios @test.com",
        "dos@@arrobas.com",
        "sin.dominio@",
        "@sin.usuario.com",
      ];

      emailsInvalidos.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test("debe validar emails con diferentes extensiones de dominio", () => {
      const emails = [
        "test@example.com",
        "test@example.co.uk",
        "test@example.org",
        "test@example.net",
        "test@example.edu",
      ];

      emails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });

  // ============================================
  // TESTS PARA TELÉFONO REGEX
  // ============================================

  describe("telefonoRegex", () => {
    test("debe validar teléfonos en formato internacional correcto", () => {
      const telefonosValidos = [
        "+5491123456789", // Argentina
        "+12025551234", // Estados Unidos
        "+447911123456", // Reino Unido
        "+34612345678", // España
        "+5215512345678", // México
      ];

      telefonosValidos.forEach((tel) => {
        expect(telefonoRegex.test(tel)).toBe(true);
      });
    });

    test("debe rechazar teléfonos sin símbolo +", () => {
      const telefonosInvalidos = [
        "5491123456789",
        "1234567890",
        "447911123456",
      ];

      telefonosInvalidos.forEach((tel) => {
        expect(telefonoRegex.test(tel)).toBe(false);
      });
    });

    test("debe rechazar teléfonos que empiezan con 0", () => {
      const telefonosInvalidos = ["+0123456789", "+0549112345678"];

      telefonosInvalidos.forEach((tel) => {
        expect(telefonoRegex.test(tel)).toBe(false);
      });
    });

    test("debe rechazar teléfonos con caracteres no numéricos", () => {
      const telefonosInvalidos = [
        "+54abc1234567",
        "+549-11-2345-6789",
        "+549 11 2345 6789",
        "abc",
        "+54(11)23456789",
      ];

      telefonosInvalidos.forEach((tel) => {
        expect(telefonoRegex.test(tel)).toBe(false);
      });
    });

    test("debe rechazar teléfonos muy cortos", () => {
      const telefonosInvalidos = ["+1", "+54", "+549"];

      telefonosInvalidos.forEach((tel) => {
        expect(telefonoRegex.test(tel)).toBe(false);
      });
    });

    test("debe rechazar teléfonos muy largos (más de 15 dígitos)", () => {
      const telefono = "+" + "1".repeat(20);
      expect(telefonoRegex.test(telefono)).toBe(false);
    });
  });
});
