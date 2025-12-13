import bcrypt from "bcryptjs";

/**
 * Hashea una contraseña usando bcrypt
 *
 * bcrypt es una función de hashing diseñada para contraseñas.
 * El "salt" (sal) es un valor aleatorio que se agrega antes de hashear
 * para que dos contraseñas iguales generen hashes diferentes.
 *
 * Ejemplo:
 * password: "miPassword123"
 * ↓ bcrypt con salt rounds = 10
 * hash: "$2b$10$KIXz3DG8vT0dKJ9mvF3pOeMt8RjqVxT8Q2I8fJ6Y8ZwHqF5mK9gK."
 *
 * El número 10 significa que el algoritmo se ejecuta 2^10 = 1024 veces,
 * haciendo que sea muy lento para ataques de fuerza bruta.
 */
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compara una contraseña en texto plano con un hash
 *
 * Esto es lo que pasa cuando un usuario hace login:
 * 1. Usuario envía: "miPassword123"
 * 2. Sistema busca el hash guardado en BD
 * 3. bcrypt.compare() verifica si coinciden
 * 4. Retorna true o false
 *
 * IMPORTANTE: Nunca desencriptamos el hash, solo comparamos.
 * Esto hace que sea imposible recuperar la contraseña original.
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export default {
  hashPassword,
  comparePassword,
};
