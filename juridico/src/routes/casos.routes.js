import express from "express";
import {
  crearCaso,
  obtenerCasos,
  obtenerCasoPorId,
  actualizarCaso,
  eliminarCaso,
  cambiarEstadoCaso,
  cerrarCaso,
  obtenerListaSimpleCasos,
} from "../controllers/casos_controller.js";
import {
  obtenerDetalle360,
  crearNotaHistorial,
  obtenerHistorial,
  asignarEtiqueta,
  quitarEtiqueta,
  actualizarEtapa,
} from "../controllers/casos_360_controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { verificarRol } from "../middleware/roleMiddleware.js";
import { audit } from "../middleware/auditMiddleware.js";

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

router.get("/", obtenerCasos);
router.get("/lista-simple", obtenerListaSimpleCasos);
router.get("/:id", obtenerCasoPorId);

router.post(
  "/",
  verificarRol(["admin", "abogado"]),
  audit("CREAR", "caso"),
  crearCaso
);

router.put(
  "/:id",
  verificarRol(["admin", "abogado"]),
  audit("ACTUALIZAR", "caso"),
  actualizarCaso
);

router.patch(
  "/:id/estado",
  verificarRol(["admin", "abogado"]),
  audit("CAMBIAR_ESTADO", "caso"),
  cambiarEstadoCaso
);

router.patch(
  "/:id/cerrar",
  verificarRol(["admin", "abogado"]),
  audit("CAMBIAR_ESTADO", "caso"),
  cerrarCaso
);

router.delete(
  "/:id",
  verificarRol(["admin"]),
  audit("ELIMINAR", "caso"),
  eliminarCaso
);

// Fase 2: Vista 360 + historial + etiquetas + etapa
router.get("/:id/detalle-360", obtenerDetalle360);

router.get("/:id/historial", obtenerHistorial);
router.post("/:id/historial", crearNotaHistorial);

router.post("/:id/etiquetas", asignarEtiqueta);
router.delete("/:id/etiquetas/:id_etiqueta", quitarEtiqueta);

router.put("/:id/etapa", actualizarEtapa);

export default router;
