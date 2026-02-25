import cron from "node-cron";
import tareasService from "../services/tareas_service.js";
import eventosService from "../services/eventos_service.js";
import vencimientosService from "../services/vencimientos_service.js";

const iniciarJobLimpieza = () => {
    // Ejecutar todos los días a la medianoche (00:00)
    cron.schedule("0 0 * * *", async () => {
        console.log("🧹 [CRON] Iniciando limpieza diaria...");
        try {
            await tareasService.limpiezaNocturna();
            await eventosService.limpiezaEventosCompletados();
            await vencimientosService.limpiezaVencimientosCumplidos();
            console.log("✅ [CRON] Limpieza diaria finalizada.");
        } catch (error) {
            console.error("❌ [CRON] Error en limpieza diaria:", error);
        }
    });

    console.log("🕒 [SISTEMA] Job de limpieza diaria programado (00:00 hs)");
};

export default iniciarJobLimpieza;
