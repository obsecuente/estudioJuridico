import bcrypt from "bcrypt";
import sequelize from "./src/config/database.js";
import { Abogado } from "./src/models/index.js";

// Configurá acá el usuario que querés crear
const nuevoUsuario = {
  nombre: "Admin",
  apellido: "Sistema",
  email: "arevalogonzaa@gmail.com",
  password: "abogadopremium123",
  especialidad: "General",
  dni: "43372849",
  telefono: "+542991457849",
  rol: "admin", // Opciones: 'admin', 'abogado', 'asistente'
};

async function crearUsuario() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a la base de datos");

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(nuevoUsuario.password, 10);
    console.log("🔐 Password hasheado");

    // Verificar si ya existe
    const existe = await Abogado.findOne({
      where: { email: nuevoUsuario.email },
    });

    if (existe) {
      console.log("⚠️  El usuario ya existe con ese email");
      console.log("📧 Email:", existe.email);
      console.log("👤 Nombre:", existe.nombre, existe.apellido);
      console.log("🎭 Rol:", existe.rol);
      process.exit(0);
    }

    // Crear el usuario
    const usuario = await Abogado.create({
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      email: nuevoUsuario.email,
      password: passwordHash,
      especialidad: nuevoUsuario.especialidad,
      dni: nuevoUsuario.dni,
      telefono: nuevoUsuario.telefono,
      rol: nuevoUsuario.rol,
    });

    console.log("✅ Usuario creado exitosamente");
    console.log("📧 Email:", usuario.email);
    console.log("🔑 Password:", nuevoUsuario.password);
    console.log("👤 Nombre:", usuario.nombre, usuario.apellido);
    console.log("🎭 Rol:", usuario.rol);
    console.log("💼 Especialidad:", usuario.especialidad);
    console.log("📞 Teléfono:", usuario.telefono);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

crearUsuario();
