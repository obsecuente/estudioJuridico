/**
 * finanzas_motor.test.js
 *
 * Test masivo del motor financiero:
 * 1. Crear 100 movimientos JUS y verificar saldo total
 * 2. Cambiar valor global de JUS → recalcular cartera
 * 3. Egresos restan del balance
 * 4. ratio_cobrabilidad NO da división por cero
 */
import { sequelize, MovimientoFinanciero, Cuota, ConfiguracionEstudio, Cliente, Abogado, Caso } from "../../src/models/index.js";
import * as finanzasService from "../../src/services/finanzas_service.js";
import configuracionService from "../../src/services/configuracion_service.js";

// ═══ HELPERS ═══

let testAbogado;
let testCliente;
let testCaso;

/**
 * Crea las entidades base necesarias para los tests
 */
const crearEntidadesBase = async () => {
    testAbogado = await Abogado.create({
        dni: "12345678",
        nombre: "Test",
        apellido: "Abogado",
        email: "test@estudio.com",
        password: "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345",
        rol: "admin",
    });

    testCliente = await Cliente.create({
        nombre: "Cliente",
        apellido: "Test",
        email: "cliente@test.com",
        telefono: "+541112345000",
    });

    testCaso = await Caso.create({
        descripcion: "Caso de prueba masiva",
        estado: "abierto",
        id_cliente: testCliente.id_cliente,
        id_abogado: testAbogado.id_abogado,
    });

    // Configurar valor JUS inicial: $80.000
    await ConfiguracionEstudio.upsert({ clave: "VALOR_JUS_NQN", valor: "80000" });
    await ConfiguracionEstudio.upsert({ clave: "VALOR_JUS_RN", valor: "75000" });
};

// ═══ TESTS ═══

describe("Motor Financiero — Tests Masivos", () => {

    beforeAll(async () => {
        await crearEntidadesBase();
    });

    // ───────────────────────────────────────────────────
    // MÓDULO 1: 100 Movimientos JUS + Recálculo de Cartera
    // ───────────────────────────────────────────────────
    describe("Módulo JUS: 100 movimientos y recálculo de cartera", () => {

        test("Debería crear 100 movimientos de ingreso en JUS correctamente", async () => {
            const movimientos = [];

            for (let i = 0; i < 100; i++) {
                const jus = Math.floor(Math.random() * 10) + 1; // 1 a 10 JUS
                movimientos.push({
                    tipo: "ingreso",
                    categoria: "honorarios",
                    descripcion: `Honorario test #${i + 1}`,
                    monto_jus: jus,
                    monto_ars: jus * 80000, // Calculado con valor JUS actual
                    valor_jus_referencia: 80000,
                    estado: "pendiente",
                    id_caso: testCaso.id_caso,
                    id_cliente: testCliente.id_cliente,
                    id_abogado: testAbogado.id_abogado,
                });
            }

            await MovimientoFinanciero.bulkCreate(movimientos);

            const count = await MovimientoFinanciero.count({
                where: {
                    tipo: "ingreso",
                    categoria: "honorarios",
                    id_abogado: testAbogado.id_abogado,
                },
            });

            expect(count).toBe(100);
        }, 30000);

        test("El dashboard debería reflejar el total de JUS pendientes correctamente", async () => {
            const resumen = await finanzasService.obtenerResumenEstudio("NQN", {
                id_abogado: testAbogado.id_abogado,
                rol: "admin",
            });

            // Sumar todos los JUS que creamos
            const totalJus = await MovimientoFinanciero.sum("monto_jus", {
                where: {
                    tipo: "ingreso",
                    estado: "pendiente",
                    id_abogado: testAbogado.id_abogado,
                    monto_jus: { [sequelize.Sequelize.Op.gt]: 0 },
                },
            });

            expect(resumen.cartera.pendiente_jus).toBe(totalJus);
            // Con JUS a $80.000
            expect(resumen.cartera.pendiente_jus_actualizado).toBe(totalJus * 80000);
            expect(resumen.indicadores.valor_jus_actual).toBe(80000);
        }, 15000);

        test("Al cambiar el valor global de JUS, la cartera debe recalcularse dinámicamente", async () => {
            // Guardar total JUS antes
            const totalJusAntes = await MovimientoFinanciero.sum("monto_jus", {
                where: {
                    tipo: "ingreso",
                    estado: "pendiente",
                    id_abogado: testAbogado.id_abogado,
                    monto_jus: { [sequelize.Sequelize.Op.gt]: 0 },
                },
            });

            // Cambiar JUS de $80.000 a $100.000
            await configuracionService.actualizarValorJus("NQN", 100000);

            const resumenNuevo = await finanzasService.obtenerResumenEstudio("NQN", {
                id_abogado: testAbogado.id_abogado,
                rol: "admin",
            });

            // La cartera debe reflejar el NUEVO valor
            expect(resumenNuevo.indicadores.valor_jus_actual).toBe(100000);
            expect(resumenNuevo.cartera.pendiente_jus_actualizado).toBe(totalJusAntes * 100000);

            // Verificar que NO cambió el monto_ars original del movimiento
            const primerMov = await MovimientoFinanciero.findOne({
                where: {
                    tipo: "ingreso",
                    id_abogado: testAbogado.id_abogado,
                    monto_jus: { [sequelize.Sequelize.Op.gt]: 0 },
                },
            });
            // El monto_ars del registro NO debe cambiar (es histórico)
            expect(parseFloat(primerMov.valor_jus_referencia)).toBe(80000);

            // Restaurar valor
            await configuracionService.actualizarValorJus("NQN", 80000);
        }, 15000);
    });

    // ───────────────────────────────────────────────────
    // MÓDULO 2: Egresos y Balance de Caja
    // ───────────────────────────────────────────────────
    describe("Módulo Gastos: egresos y balance de caja", () => {

        test("Los egresos pagados deben restar del balance mensual", async () => {
            const hoy = new Date().toISOString().split("T")[0];

            // Crear un ingreso cobrado este mes
            await MovimientoFinanciero.create({
                tipo: "ingreso",
                categoria: "consulta",
                descripcion: "Consulta pagada",
                monto_ars: 500000,
                estado: "pagado",
                fecha_cobro: hoy,
                id_abogado: testAbogado.id_abogado,
            });

            // Crear un egreso pagado este mes
            await MovimientoFinanciero.create({
                tipo: "egreso",
                categoria: "alquiler",
                descripcion: "Alquiler oficina",
                monto_ars: 200000,
                estado: "pagado",
                fecha_pago: hoy,
                id_abogado: testAbogado.id_abogado,
            });

            const resumen = await finanzasService.obtenerResumenEstudio("NQN", {
                id_abogado: testAbogado.id_abogado,
                rol: "admin",
            });

            // Los egresos deben ser >= 200000
            expect(resumen.caja.egresos).toBeGreaterThanOrEqual(200000);
            // El neto = percibido - egresos (puede haber otros del test anterior)
            expect(resumen.caja.neto).toBe(resumen.caja.percibido - resumen.caja.egresos);
        }, 10000);
    });

    // ───────────────────────────────────────────────────
    // MÓDULO 3: Ratio de Cobrabilidad sin División por Cero
    // ───────────────────────────────────────────────────
    describe("Módulo KPIs: ratio_cobrabilidad edge cases", () => {

        test("ratio_cobrabilidad NO debe dar NaN ni error si no hay deudas", async () => {
            // Limpiar todos los movimientos
            await MovimientoFinanciero.destroy({ where: { id_abogado: testAbogado.id_abogado } });

            const resumen = await finanzasService.obtenerResumenEstudio("NQN", {
                id_abogado: testAbogado.id_abogado,
                rol: "admin",
            });

            // Sin movimientos: ratio debe ser 0, NO NaN ni Infinity
            expect(resumen.indicadores.ratio_cobrabilidad).toBe(0);
            expect(Number.isFinite(resumen.indicadores.ratio_cobrabilidad)).toBe(true);
            expect(Number.isNaN(resumen.indicadores.ratio_cobrabilidad)).toBe(false);
        }, 10000);

        test("ratio_cobrabilidad debe ser 100% si todo está cobrado y no hay deuda", async () => {
            const hoy = new Date().toISOString().split("T")[0];

            await MovimientoFinanciero.create({
                tipo: "ingreso",
                categoria: "consulta",
                descripcion: "Todo cobrado",
                monto_ars: 100000,
                estado: "pagado",
                fecha_cobro: hoy,
                id_abogado: testAbogado.id_abogado,
            });

            const resumen = await finanzasService.obtenerResumenEstudio("NQN", {
                id_abogado: testAbogado.id_abogado,
                rol: "admin",
            });

            // 100% cobrado = ratio 100
            expect(resumen.indicadores.ratio_cobrabilidad).toBe(100);
        }, 10000);

        test("ratio_cobrabilidad debe calcular bien con mix de pagado y pendiente", async () => {
            // Limpiar
            await MovimientoFinanciero.destroy({ where: { id_abogado: testAbogado.id_abogado } });

            const hoy = new Date().toISOString().split("T")[0];

            // $500k cobrado
            await MovimientoFinanciero.create({
                tipo: "ingreso",
                categoria: "honorarios",
                monto_ars: 500000,
                estado: "pagado",
                fecha_cobro: hoy,
                id_abogado: testAbogado.id_abogado,
            });

            // $500k pendiente (sin JUS, ARS fijo)
            await MovimientoFinanciero.create({
                tipo: "ingreso",
                categoria: "honorarios",
                monto_ars: 500000,
                estado: "pendiente",
                id_abogado: testAbogado.id_abogado,
            });

            const resumen = await finanzasService.obtenerResumenEstudio("NQN", {
                id_abogado: testAbogado.id_abogado,
                rol: "admin",
            });

            // Ratio = 500k / (500k + 500k) * 100 = 50
            expect(resumen.indicadores.ratio_cobrabilidad).toBe(50);
        }, 10000);
    });

    // ───────────────────────────────────────────────────
    // MÓDULO 4: Plan de Cuotas
    // ───────────────────────────────────────────────────
    describe("Módulo Cuotas: plan de pago con installments", () => {

        test("Crear movimiento con plan de cuotas debe generar N cuotas", async () => {
            const movimiento = await finanzasService.crearMovimiento({
                tipo: "ingreso",
                categoria: "honorarios",
                descripcion: "Test cuotas",
                monto_ars: 300000,
                id_abogado: testAbogado.id_abogado,
                id_caso: testCaso.id_caso,
                id_cliente: testCliente.id_cliente,
                plan_cuotas: {
                    cantidad: 3,
                    fecha_primera: "2026-03-01",
                },
            });

            expect(movimiento.es_plan_cuotas).toBe(true);
            expect(movimiento.cantidad_cuotas).toBe(3);
            expect(movimiento.estado).toBe("parcial");

            // Verificar cuotas creadas
            const cuotas = await Cuota.findAll({
                where: { id_movimiento: movimiento.id_movimiento },
                order: [["numero_cuota", "ASC"]],
            });

            expect(cuotas.length).toBe(3);
            expect(parseFloat(cuotas[0].monto_cuota)).toBe(100000); // 300k / 3
            expect(cuotas[0].fecha_vencimiento).toContain("2026-03");
            // Verificar que las cuotas son mensuales progresivas
            const fecha1 = new Date(cuotas[0].fecha_vencimiento);
            const fecha2 = new Date(cuotas[1].fecha_vencimiento);
            const fecha3 = new Date(cuotas[2].fecha_vencimiento);
            expect(fecha2.getTime()).toBeGreaterThan(fecha1.getTime());
            expect(fecha3.getTime()).toBeGreaterThan(fecha2.getTime());
        }, 15000);

        test("Marcar todas las cuotas como pagadas debe actualizar el estado del movimiento a pagado", async () => {
            // Crear movimiento con 2 cuotas
            const mov = await finanzasService.crearMovimiento({
                tipo: "ingreso",
                categoria: "honorarios",
                descripcion: "Test cuotas para marcar",
                monto_ars: 200000,
                id_abogado: testAbogado.id_abogado,
                plan_cuotas: {
                    cantidad: 2,
                    fecha_primera: "2026-04-01",
                },
            });

            const cuotas = await Cuota.findAll({
                where: { id_movimiento: mov.id_movimiento },
                order: [["numero_cuota", "ASC"]],
            });

            // Pagar cuota 1
            await finanzasService.marcarCuotaPagada(cuotas[0].id_cuota);
            let movActualizado = await MovimientoFinanciero.findByPk(mov.id_movimiento);
            expect(movActualizado.estado).toBe("parcial");

            // Pagar cuota 2
            await finanzasService.marcarCuotaPagada(cuotas[1].id_cuota);
            movActualizado = await MovimientoFinanciero.findByPk(mov.id_movimiento);
            expect(movActualizado.estado).toBe("pagado");
        }, 15000);
    });
});
