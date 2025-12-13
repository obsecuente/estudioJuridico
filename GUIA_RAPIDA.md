# 🚀 Guía Rápida de Testing

## Comandos Esenciales

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch (auto-reload)
npm run test:watch

# Tests con cobertura de código
npm run test:coverage

# Solo tests unitarios
npm run test:unit

# Solo tests de integración  
npm run test:integration

# Solo tests end-to-end
npm run test:e2e
```

## Estructura de un Test

```javascript
import { crearClientePrueba } from '../helpers/dbHelpers.js';

describe('Nombre del módulo', () => {
  
  beforeEach(async () => {
    // Se ejecuta ANTES de cada test
    await limpiarTablas();
  });

  test('debe hacer algo específico', async () => {
    // 1. ARRANGE (preparar)
    const cliente = await crearClientePrueba();
    
    // 2. ACT (actuar)
    const resultado = await clientesService.actualizar(
      cliente.id_cliente, 
      { nombre: 'Nuevo' }
    );
    
    // 3. ASSERT (verificar)
    expect(resultado.nombre).toBe('Nuevo');
  });
});
```

## Matchers Más Usados

```javascript
// Igualdad
expect(valor).toBe(10);                  // Igualdad estricta (===)
expect(valor).toEqual({ a: 1 });         // Igualdad profunda de objetos

// Booleanos
expect(valor).toBeTruthy();              // Es truthy
expect(valor).toBeFalsy();               // Es falsy
expect(valor).toBeNull();                // Es null
expect(valor).toBeDefined();             // Está definido
expect(valor).toBeUndefined();           // Es undefined

// Números
expect(valor).toBeGreaterThan(3);        // Mayor que
expect(valor).toBeGreaterThanOrEqual(3); // Mayor o igual
expect(valor).toBeLessThan(5);           // Menor que

// Strings
expect(cadena).toContain('texto');       // Contiene substring
expect(cadena).toMatch(/regex/);         // Coincide con regex

// Arrays
expect(array).toHaveLength(3);           // Tiene longitud
expect(array).toContain(item);           // Contiene elemento

// Objetos
expect(obj).toHaveProperty('key');       // Tiene propiedad
expect(obj).toMatchObject({ a: 1 });     // Coincide parcialmente

// Funciones asíncronas con errores
await expect(
  funcionAsync()
).rejects.toThrow('Error esperado');

// Promesas
await expect(promise).resolves.toBe(valor);
```

## Helpers Disponibles

```javascript
// Limpieza de base de datos
import { limpiarTablas } from '../helpers/dbHelpers.js';

// Creación de datos de prueba
import { 
  crearClientePrueba,
  crearAbogadoPrueba,
  crearMultiplesClientes 
} from '../helpers/dbHelpers.js';

// Generadores de datos únicos
import {
  generarEmailUnico,
  generarTelefonoUnico,
  generarDatosCliente
} from '../helpers/testData.js';

// Ejemplo de uso
const cliente = await crearClientePrueba({
  nombre: 'Juan',
  email: generarEmailUnico()
});
```

## Tests de API con Supertest

```javascript
import request from 'supertest';
import app from '../../server.js';

test('debe crear un cliente', async () => {
  const response = await request(app)
    .post('/api/clientes')
    .send({ nombre: 'Juan', ... })
    .expect(201)
    .expect('Content-Type', /json/);

  expect(response.body.success).toBe(true);
  expect(response.body.data).toHaveProperty('id_cliente');
});
```

## Patrones AAA (Arrange-Act-Assert)

```javascript
test('debe actualizar cliente', async () => {
  // ARRANGE: Preparar el escenario
  const cliente = await crearClientePrueba();
  const nuevoNombre = 'Nuevo Nombre';
  
  // ACT: Ejecutar la acción
  const resultado = await clientesService.actualizar(
    cliente.id_cliente,
    { nombre: nuevoNombre }
  );
  
  // ASSERT: Verificar el resultado
  expect(resultado.nombre).toBe(nuevoNombre);
  expect(resultado.id_cliente).toBe(cliente.id_cliente);
});
```

## Consejos Rápidos

1. **Un test, una cosa**: Cada test debe verificar una sola funcionalidad
2. **Nombres descriptivos**: "debe rechazar email inválido" es mejor que "test 1"
3. **Independencia**: Los tests no deben depender unos de otros
4. **Limpieza**: Usa `beforeEach` para limpiar datos entre tests
5. **Datos únicos**: Usa los generadores para evitar conflictos

## Errores Comunes

### Test pasa pero no debería
```javascript
// ❌ MAL - Olvidas el await
test('debe crear cliente', async () => {
  clientesService.crear(datos); // Sin await
  expect(true).toBe(true); // Siempre pasa
});

// ✅ BIEN
test('debe crear cliente', async () => {
  const cliente = await clientesService.crear(datos);
  expect(cliente).toBeDefined();
});
```

### Tests interfieren entre sí
```javascript
// ❌ MAL - No limpias entre tests
describe('Tests', () => {
  test('crea cliente 1', async () => { ... });
  test('crea cliente 2', async () => { ... }); // Puede fallar
});

// ✅ BIEN
describe('Tests', () => {
  beforeEach(async () => {
    await limpiarTablas(); // Limpia antes de cada test
  });
  
  test('crea cliente 1', async () => { ... });
  test('crea cliente 2', async () => { ... });
});
```

### No verificas errores
```javascript
// ❌ MAL - No verificas que lance error
test('debe rechazar email inválido', async () => {
  await clientesService.crear({ email: 'invalido' });
  // Test pasa aunque no debería
});

// ✅ BIEN
test('debe rechazar email inválido', async () => {
  await expect(
    clientesService.crear({ email: 'invalido' })
  ).rejects.toThrow('formato del mail');
});
```

## Interpretando Cobertura

```
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
clientes_service  |   85.71 |   75.00  |   88.89 |   85.71 |
```

- **Objetivo**: >70% en todos los indicadores
- **Verde**: >80% - Excelente cobertura
- **Amarillo**: 70-80% - Buena cobertura
- **Rojo**: <70% - Necesita más tests

## Próximos Pasos

1. Copia todos los archivos a tu proyecto
2. Ejecuta `npm install --save-dev jest supertest @types/jest`
3. Ejecuta `npm test` para verificar
4. Usa `npm run test:watch` durante desarrollo
5. Mantén cobertura >70%
