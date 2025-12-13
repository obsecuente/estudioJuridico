import sequelize from "../src/config/database.js"; // Ajusta la ruta a tu instancia de Sequelize
import Abogado from "../src/models/Abogado.js"; // Ajusta la ruta a tu modelo Cliente (o Usuario/Abogado)
import bcrypt from "bcrypt";
import logger from "../src/config/logger.js"; // Si usas un logger

const createAdminUser = async () => {
  // Usamos el saltRounds que uses en tu lógica de registro real
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(ADMIN_CREDS.password, saltRounds);

  // Creamos/actualizamos el registro en la DB
  await Abogado.upsert({
    // <--- ¡AQUÍ ESTÁ LA CORRECCIÓN!
    // id_abogado: 1, // Puedes dejar esto comentado

    // 💥 ¡NUEVOS CAMPOS REQUERIDOS!
    dni: "12345678", // DNI de 8 dígitos
    telefono: "+5491155554444", // Teléfono en formato E.164 válido
    // ----------------------------

    email: ADMIN_CREDS.email,
    password: hashedPassword, // ¡El password ya hasheado!
    nombre: "Gonzalo",
    apellido: "Admin",
    rol: "admin",
    especialidad: "Admin",
  });

  logger.info(`Usuario admin de prueba creado: ${ADMIN_CREDS.email}`);
};

beforeAll(async () => {
  try {
    // ... (Tu código de conexión existente) ...
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    await createAdminUser(); // <-- ¡NUEVO PASO!

    logger.info("Base de datos de pruebas lista y con Admin.");
  } catch (error) {
    console.error("❌ Error conectando a DB:", error);
    throw error;
  }
});

// Limpieza después de todos los tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log("✅ Conexión a DB cerrada");
  } catch (error) {
    console.error("❌ Error cerrando conexión:", error);
  }
});

// Timeout global (30 segundos)
// ELIMINAR ESTO: jest.setTimeout(30000);
