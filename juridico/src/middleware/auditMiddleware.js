import { registrarAuditoria } from "../services/auditoria_service.js";

/**
 * Middleware para auditar acciones automáticamente
 *
 * Uso:
 * router.delete("/:id", authMiddleware, audit("ELIMINAR", "cliente"), eliminarCliente);
 */
export const audit = (accion, entidad) => {
  return async (req, res, next) => {
    // Guardar la función original res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json
    res.json = function (data) {
      // Si la respuesta fue exitosa, registrar auditoría
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const id_entidad =
          req.params.id ||
          data?.data?.id_cliente ||
          data?.data?.id_caso ||
          data?.data?.id_consulta ||
          data?.data?.id_documento ||
          data?.data?.id_abogado ||
          null;

        registrarAuditoria({
          id_usuario: req.user?.id_abogado || null,
          accion,
          entidad,
          id_entidad,
          detalle: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
          },
          req,
        }).catch((error) => {
          console.error("Error en middleware de auditoría:", error);
        });
      }

      // Llamar al json original
      return originalJson(data);
    };

    next();
  };
};

export default audit;
