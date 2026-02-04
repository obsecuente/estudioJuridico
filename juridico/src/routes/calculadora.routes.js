import express from "express";
import {
  obtenerProximosFeriados,
  obtenerFeriaJudicialActual,
  obtenerFeriadosMes,
  calcularDiasEntreFechas,
  calcularVencimiento,
} from "../services/calculadora_service.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/calculadora/calcular-plazo
// calcular fecha de vencimiento
router.post("/calcular-plazo", async (req, res) => {
  try {
    const {
      fecha_notificacion,
      dias_plazo,
      jurisdiccion,
      incluir_plazo_gracia,
    } = req.body;

    const resultado = await calcularVencimiento({
      fecha_notificacion,
      dias_plazo,
      jurisdiccion,
      incluir_plazo_gracia,
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error al calcular plazo:", error);
    res.status(error.statusCode || 500).json({
      error: error.message || "Error al calcular el plazo",
    });
  }
});

// POST /api/calculadora/dias-entre-fechas
// calcular dias habiles entre dos fechas (para eventos simples)
router.post("/dias-entre-fechas", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, jurisdiccion } = req.body;

    const resultado = await calcularDiasEntreFechas({
      fecha_inicio,
      fecha_fin,
      jurisdiccion,
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error al calcular días entre fechas:", error);
    res.status(error.statusCode || 500).json({
      error: error.message || "Error al calcular días",
    });
  }
});

// GET /api/calculadora/proximos-feriados
// obtener próximos feriados
router.get("/proximos-feriados", async (req, res) => {
  try {
    const { jurisdiccion = "nacional", limite = 10 } = req.query;

    const feriados = await obtenerProximosFeriados(jurisdiccion, limite);

    res.json({
      feriados,
      total: feriados.length,
    });
  } catch (error) {
    console.error("Error al obtener feriados:", error);
    res.status(500).json({
      error: "Error al obtener feriados",
    });
  }
});

// GET /api/calculadora/feriados-mes
// obtener feriados de un mes específico
router.get("/feriados-mes", async (req, res) => {
  try {
    const { anio, mes, jurisdiccion = "nacional" } = req.query;

    if (!anio || !mes) {
      return res.status(400).json({ error: "Año y mes son obligatorios" });
    }

    const feriados = await obtenerFeriadosMes(
      parseInt(anio),
      parseInt(mes),
      jurisdiccion
    );

    res.json({ feriados });
  } catch (error) {
    console.error("Error al obtener feriados del mes:", error);
    res.status(500).json({
      error: "Error al obtener feriados del mes",
    });
  }
});

// GET /api/calculadora/feria-judicial
// obtener feria judicial actual o próxima
router.get("/feria-judicial", async (req, res) => {
  try {
    const { jurisdiccion = "nacional" } = req.query;

    const feria = await obtenerFeriaJudicialActual(jurisdiccion);

    if (!feria) {
      return res.json({
        feria: null,
        mensaje: "No hay feria judicial programada",
      });
    }

    res.json({
      feria,
    });
  } catch (error) {
    console.error("Error al obtener feria judicial:", error);
    res.status(500).json({
      error: "Error al obtener feria judicial",
    });
  }
});

export default router;
