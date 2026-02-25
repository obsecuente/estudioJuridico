import cron from "node-cron";
import cierreMensualService from "../services/cierre_mensual_service.js";

const iniciarJobCierreMensual = () => {
    // Ejecutar el día 1 de cada mes a las 02:00 AM
    cron.schedule("0 2 1 * *", async () => {
        console.log("📅 [CRON] Iniciando cierre mensual...");
        try {
            const hoy = new Date();
            // Generar cierre del mes anterior
            // Si hoy es 1 de Mayo (mes 4 index 0), queremos cerrar Abril (mes 3 index 0, o mes 4 calendario)
            // getMonth() devuelve 0-11.
            // Si estamos en Mayo (4), el mes anterior es Abril (3).
            // La funcion espera mes 1-12. Abril es 4.

            let mes = hoy.getMonth(); // 0-11. Si es Enero (0), mes será 0
            let anio = hoy.getFullYear();

            if (mes === 0) {
                mes = 12; // Diciembre del año pasado
                anio -= 1;
            }
            // Si no estamos en Enero, mes ya es el indice del mes anterior (ej: Mayo=4, mes=4 que corresponde a Abril en 1-12?? No.)
            // Enero es 0. Si hoy es 1 de Feb (1), mes=1. Queremos cerrar Enero (1).
            // Entonces si mes es > 0, el valor YA ES el mes anterior en formato 1-12?
            // Ejemplo: Hoy 1 Feb. getMonth() = 1. Mes anterior Enero = 1. Correcto.
            // Ejemplo: Hoy 1 Mar. getMonth() = 2. Mes anterior Feb = 2. Correcto.

            await cierreMensualService.generarCierreMensual(mes, anio);
            console.log(`✅ [CRON] Cierre mensual generado para ${mes}/${anio}.`);
        } catch (error) {
            console.error("❌ [CRON] Error en cierre mensual:", error);
        }
    });

    console.log("📅 [SISTEMA] Job de cierre mensual programado (Día 1, 02:00 hs)");
};

export default iniciarJobCierreMensual;
