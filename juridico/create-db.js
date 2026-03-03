import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function createDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  });

  try {
    const dbName = process.env.DB_NAME || 'estudio_juridico';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Base de datos "${dbName}" verificada/creada con éxito.`);
  } catch (error) {
    console.error('Error al crear la base de datos:', error);
  } finally {
    await connection.end();
  }
}

createDatabase();
