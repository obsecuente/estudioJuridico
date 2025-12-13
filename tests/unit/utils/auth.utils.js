import request from "supertest";
import app from "../../../server.js"; // Asegúrate de que esta ruta sea correcta para importar tu aplicación Express

// Datos del usuario Administrador de prueba
const ADMIN_CREDENTIALS = {
  email: "gonzalo@juridico.com",
  password: "desarrolladorWeb",
};

/**
 * Realiza un login al endpoint de Auth y extrae el JWT.
 * @returns {Promise<string>} El JWT para usar en el header Authorization.
 */
export const obtenerTokenAdmin = async () => {
  try {
    const response = await request(app)
      .post("/api/auth/login") // <--- Asumo que esta es la ruta de login
      .send(ADMIN_CREDENTIALS)
      .expect(200); // Se espera que el login sea exitoso (código 200 OK)

    // ASUMO que el token se devuelve en el cuerpo de la respuesta,
    // por ejemplo: response.body.token o response.body.data.token
    const token = response.body.token || response.body.data.token;

    if (!token) {
      throw new Error("Token JWT no encontrado en la respuesta del login.");
    }

    return token;
  } catch (error) {
    console.error(
      "Error al obtener token de administrador:",
      error.message || error
    );
    // Lanza el error para que Jest falle el test si no puede autenticar
    throw error;
  }
};
