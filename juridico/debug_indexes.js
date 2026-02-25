import "dotenv/config";
import sequelize from "./src/config/database.js";

async function checkTables() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query(`
      SELECT TABLE_NAME, COUNT(*) as IndexCount
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
      GROUP BY TABLE_NAME
      ORDER BY IndexCount DESC;
    `);
        console.table(results);
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

checkTables();
