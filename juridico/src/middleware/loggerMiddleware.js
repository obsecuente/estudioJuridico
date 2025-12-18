import logger from "../config/logger.js";

/**
 * Middleware para loguear todas las requests HTTP
 */
export const httpLogger = (req, res, next) => {
  const start = Date.now();

  // Guardar el método original res.json
  const originalJson = res.json.bind(res);

  // Sobrescribir res.json para capturar cuando termina la request
  res.json = function (data) {
    const duration = Date.now() - start;

    // Loguear la request
    logger.http(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      user: req.user?.email || "anonymous",
    });

    // Llamar al json original
    return originalJson(data);
  };

  next();
};

export default httpLogger;
