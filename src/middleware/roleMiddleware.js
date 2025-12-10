/**
 * MIDDLEWARE DE AUTORIZACIÓN POR ROLES
 *
 * Este middleware verifica que el usuario tenga uno de los roles permitidos.
 * SIEMPRE debe usarse DESPUÉS de authMiddleware.
 *
 * Uso:
 * router.delete('/abogados/:id',
 *   authMiddleware,              // 1ro: ¿Está autenticado?
 *   roleMiddleware(['admin']),   // 2do: ¿Tiene rol admin?
 *   eliminarAbogado              // 3ro: Ejecutar función
 * );
 *
 * Flujo:
 * 1. authMiddleware ya verificó el token y agregó req.user
 * 2. roleMiddleware verifica que req.user.rol esté en rolesPermitidos
 * 3. Si SÍ está → next() (continuar)
 * 4. Si NO está → 403 Forbidden (acceso denegado)
 */
export const roleMiddleware = (rolesPermitidos) => {
  // roleMiddleware es una función que RETORNA otra función
  // Esto se llama "higher-order function" o "función de orden superior"

  return (req, res, next) => {
    try {
      // 1. Verificar que req.user existe (debería existir si pasó authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
      }

      // 2. Obtener el rol del usuario
      const rolUsuario = req.user.rol;

      // 3. Verificar que el rol esté en los roles permitidos
      // Ejemplo: rolesPermitidos = ['admin', 'abogado']
      //          rolUsuario = 'asistente'
      //          → includes() retorna false
      if (!rolesPermitidos.includes(rolUsuario)) {
        return res.status(403).json({
          success: false,
          error: "No tenés permisos para realizar esta acción",
          requiere:
            rolesPermitidos.length === 1
              ? `rol: ${rolesPermitidos[0]}`
              : `uno de estos roles: ${rolesPermitidos.join(", ")}`,
          tuRol: rolUsuario,
        });
      }

      // 4. Si tiene el rol correcto, continuar
      next();
    } catch (error) {
      console.error("Error en roleMiddleware:", error);
      return res.status(500).json({
        success: false,
        error: "Error al verificar permisos",
      });
    }
  };
};

export default roleMiddleware;
