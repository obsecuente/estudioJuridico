# Sistema de Testing Completo - Estudio Jurídico

Este proyecto incluye un sistema de testing completo que cubre cada rincón de la aplicación.

## 📁 Estructura de Tests

```
tests/
├── setup.js                        # Configuración global
├── helpers/
│   ├── testData.js                # Datos de prueba
│   └── dbHelpers.js               # Helpers para BD
├── unit/                          # Tests unitarios
│   ├── models/
│   │   └── cliente.test.js
│   ├── services/
│   │   └── clientes.service.test.js
│   └── utils/
│       └── regex.test.js
├── integration/                   # Tests de integración
│   └── clientes.integration.test.js
└── e2e/                          # Tests end-to-end
    └── flujoCompleto.test.js
```

## 🚀 Instalación

1. **Instalar dependencias de testing:**
```bash
npm install --save-dev jest supertest @types/jest
```

2. **Verificar que tienes el archivo `jest.config.js` en la raíz**

3. **Verificar que `package.json` tiene los scripts de testing**

## 📝 Comandos Disponibles

### Ejecutar Todos los Tests
```bash
npm test
```

### Ejecutar Tests con Reporte de Cobertura
```bash
npm run test:coverage
```
Genera un reporte HTML en `coverage/lcov-report/index.html`

### Ejecutar Tests en Modo Watch (auto-reload)
```bash
npm run test:watch
```
Ideal para desarrollo - los tests se ejecutan automáticamente al guardar cambios

### Ejecutar Solo Tests Unitarios
```bash
npm run test:unit
```
Ejecuta tests de modelos, services y utils

### Ejecutar Solo Tests de Integración
```bash
npm run test:integration
```
Ejecuta tests de endpoints completos

### Ejecutar Solo Tests E2E
```bash
npm run test:e2e
```
Ejecuta flujos completos de usuario

### Ejecutar Tests con Salida Detallada
```bash
npm run test:verbose
```

## 📊 Interpretando los Resultados

### Salida de Tests Exitosos
```
PASS  tests/unit/models/cliente.test.js
  ✓ debe crear un cliente válido (45ms)
  ✓ debe rechazar email duplicado (23ms)
  
Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
```

### Salida con Errores
```
FAIL  tests/unit/models/cliente.test.js
  ✕ debe crear un cliente válido (45ms)
  
  ● Modelo Cliente › debe crear un cliente válido
  
    expect(received).toBe(expected)
    
    Expected: "Juan"
    Received: "Pedro"
```

### Reporte de Cobertura
```
------------------|---------|----------|---------|---------|
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   87.5  |   82.14  |   90.9  |   87.5  |
 clientes_service |   91.67 |   85.71  |   92.31 |   91.67 |
------------------|---------|----------|---------|---------|
```

- **% Stmts**: Porcentaje de declaraciones ejecutadas
- **% Branch**: Porcentaje de ramas condicionales cubiertas
- **% Funcs**: Porcentaje de funciones ejecutadas
- **% Lines**: Porcentaje de líneas cubiertas

## 🎯 Qué Cubre Este Sistema de Testing

### Tests Unitarios
- ✅ Validación de regex (email, teléfono)
- ✅ Modelos de Sequelize (Cliente, etc.)
- ✅ Services (lógica de negocio)
- ✅ Funciones auxiliares

### Tests de Integración
- ✅ Endpoints de la API
- ✅ Validaciones HTTP
- ✅ Códigos de estado
- ✅ Estructura de respuestas
- ✅ Headers de seguridad

### Tests End-to-End
- ✅ Flujos completos de usuario
- ✅ CRUD completo
- ✅ Manejo de errores
- ✅ Paginación y búsqueda
- ✅ Normalización de datos

## 🔧 Configuración de la Base de Datos

Los tests usan la misma base de datos configurada en `.env`. Para testing, considera:

### Opción 1: Usar la misma BD (más simple)
```env
DB_NAME=estudio_juridico
DB_USER=juridico_app
DB_PASS=estudiojuridicoArgentina
DB_HOST=127.0.0.1
DB_PORT=3306
```

### Opción 2: Crear BD separada para tests (recomendado)
```env
# En .env.test
DB_NAME=estudio_juridico_test
DB_USER=juridico_app
DB_PASS=estudiojuridicoArgentina
DB_HOST=127.0.0.1
DB_PORT=3306
```

Luego ejecutar tests con:
```bash
NODE_ENV=test npm test
```

## 📈 Mejores Prácticas

### 1. Ejecutar Tests Antes de Commit
```bash
npm test
```

### 2. Mantener Cobertura Alta
Objetivo: >70% de cobertura en todo el código

### 3. Tests en Modo Watch Durante Desarrollo
```bash
npm run test:watch
```

### 4. Verificar Tests de Integración Antes de Deploy
```bash
npm run test:integration
```

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module"
```bash
npm install
```

### Error: "Database connection failed"
1. Verificar que MySQL esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que la base de datos existe

### Tests muy lentos
1. Usar `beforeEach` solo cuando sea necesario
2. Considerar usar BD en memoria (SQLite)
3. Limitar consultas innecesarias

### Error: "Port already in use"
El servidor puede seguir ejecutándose. Matar el proceso:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

## 📚 Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Sequelize Testing](https://sequelize.org/docs/v6/other-topics/testing/)

## ✅ Checklist de Testing

Antes de hacer push a producción:

- [ ] Todos los tests pasan (`npm test`)
- [ ] Cobertura >70% (`npm run test:coverage`)
- [ ] Tests de integración pasan (`npm run test:integration`)
- [ ] Tests E2E pasan (`npm run test:e2e`)
- [ ] No hay warnings en la consola
- [ ] Base de datos limpia después de tests

## 🎓 Próximos Pasos

1. **Agregar tests para otros modelos** (Abogado, Consulta, Caso, Documento)
2. **Tests de autenticación** cuando implementes JWT
3. **Tests de autorización** para roles (admin, abogado, asistente)
4. **Tests de performance** para endpoints críticos
5. **Tests de carga** con herramientas como Artillery

## 📞 Soporte

Si encuentras problemas o tienes dudas:
1. Revisa la documentación de Jest y Supertest
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de que la base de datos esté correctamente configurada
