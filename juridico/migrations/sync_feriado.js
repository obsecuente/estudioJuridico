// sync rápido para agregar columnas localidad/provincia a la tabla feriados
// Ejecutar: node migrations/sync_feriado.js

import sequelize from "../src/config/database.js";
import Feriado from "../src/models/Feriado.js";

const sync = async () => {
    try {
        console.log("Conectando...");
        await sequelize.authenticate();
        console.log("Sincronizando modelo Feriado (alter: true)...");
        await Feriado.sync({ alter: true });
        console.log("✓ Columnas localidad y provincia agregadas correctamente");
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

sync();
