// src/routes/busqueda.routes.js
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import busquedaService from "../services/busqueda_service.js";

const router = Router();

// GET /api/buscar?q=Pérez&limit=5
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { q, limit } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({ clientes: [], casos: [], consultas: [], total: 0 });
        }

        const resultados = await busquedaService.buscarGlobal(q, limit || 5);
        res.json(resultados);
    } catch (error) {
        console.error("Error en búsqueda global:", error);
        res.status(500).json({ error: "Error al realizar la búsqueda" });
    }
});

export default router;
