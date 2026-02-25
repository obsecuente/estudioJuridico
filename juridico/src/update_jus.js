
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
    }
);

async function updateJUS() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Update NQN
        await sequelize.query("UPDATE configuracion_estudio SET valor = '80000' WHERE clave = 'VALOR_JUS_NQN'");
        console.log("Updated VALOR_JUS_NQN to 80000");

        // Update RN (assuming same value for now, or keeping as is)
        await sequelize.query("UPDATE configuracion_estudio SET valor = '80000' WHERE clave = 'VALOR_JUS_RN'");
        console.log("Updated VALOR_JUS_RN to 80000");

        const [results] = await sequelize.query("SELECT * FROM configuracion_estudio WHERE clave LIKE 'VALOR_JUS_%'");
        console.log("New JUS Values:", results);

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

updateJUS();
