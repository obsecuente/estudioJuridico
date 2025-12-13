/**
 * Middleware de autorización por roles
 *
 * Verifica que el usuario autenticado tenga uno de los roles permitidos
 *
 * Uso:
 * router.delete('/:id', authMiddleware, verificarRol(['admin']), eliminarCliente);
 */
export const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado (debe haber pasado por authMiddleware)
    if (!req.user || !req.user.rol) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado",
      });
    }

    // Verificar que el rol del usuario esté en la lista de roles permitidos
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(
          " o "
        )}. Tu rol actual es: ${req.user.rol}`,
      });
    }

    // Si el rol es válido, continuar
    next();
  };
};

// Export por defecto también
export default verificarRol;
