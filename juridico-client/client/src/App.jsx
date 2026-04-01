import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Dashboard from "./components/layout/Dashboard";
import "./App.css";

// ═══════════════════════════════════════════════════════════════
// LAZY LOADING — Cada página se descarga SOLO cuando se navega
// Esto reduce el bundle inicial de ~5MB a ~1MB
// ═══════════════════════════════════════════════════════════════

// Auth (se cargan rápido, son livianas)
const Login = lazy(() => import("./pages/auth/Login"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Dashboard Home
const Home = lazy(() => import("./pages/dashboard/Home"));

// Módulos principales
const ClientesList = lazy(() => import("./pages/clientes/ClientesList"));
const ClienteDetail = lazy(() => import("./pages/clientes/ClienteDetail"));

const ConsultasList = lazy(() => import("./pages/consultas/ConsultasList"));
const ConsultaDetail = lazy(() => import("./pages/consultas/ConsultaDetail"));

const CasosList = lazy(() => import("./pages/casos/CasosList"));
const CasoDetail = lazy(() => import("./pages/casos/CasoDetail"));

const DocumentosList = lazy(() => import("./pages/documentos/DocumentosList"));
const DocumentoDetail = lazy(() => import("./pages/documentos/DocumentoDetail"));

const EventosList = lazy(() => import("./pages/eventos/EventosList"));
const VencimientosList = lazy(() => import("./pages/vencimientos/VencimientosList"));

const AbogadosList = lazy(() => import("./pages/abogados/AbogadosList"));
const AbogadoDetail = lazy(() => import("./pages/abogados/AbogadoDetail"));

// Herramientas
const CalculadoraPage = lazy(() => import("./pages/calculadora/CalculadoraPage"));
const ConfiguracionJUS = lazy(() => import("./pages/configuracion/ConfiguracionJUS"));

// Finanzas
const FinanzasDashboard = lazy(() => import("./pages/finanzas/FinanzasDashboard"));
const GastosFijos = lazy(() => import("./pages/finanzas/GastosFijos"));
const EstadisticasFinanzas = lazy(() => import("./pages/finanzas/EstadisticasFinanzas"));

// ═══════════════════════════════════════════════════════════════
// LOADING FALLBACK — Spinner minimalista mientras carga el chunk
// ═══════════════════════════════════════════════════════════════
const PageLoader = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: "60vh",
    color: "#94a3b8",
    fontSize: "14px",
    gap: "10px",
  }}>
    <div style={{
      width: "20px",
      height: "20px",
      border: "2px solid rgba(212, 175, 55, 0.2)",
      borderTopColor: "#d4af37",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    Cargando...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Ruta raíz redirige a login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Rutas de autenticación */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Rutas protegidas del dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              {/* Ruta de inicio del dashboard */}
              <Route index element={<Home />} />

              {/* Módulo de clientes */}
              <Route path="clientes" element={<ClientesList />} />
              <Route path="clientes/:id" element={<ClienteDetail />} />

              {/* Módulo de consultas */}
              <Route path="consultas" element={<ConsultasList />} />
              <Route path="consultas/:id" element={<ConsultaDetail />} />

              {/* Módulo de casos */}
              <Route path="casos" element={<CasosList />} />
              <Route path="casos/:id" element={<CasoDetail />} />

              {/* Módulo de documentos */}
              <Route path="documentos" element={<DocumentosList />} />
              <Route path="documentos/:id" element={<DocumentoDetail />} />

              {/* Módulo de eventos */}
              <Route path="eventos" element={<EventosList />} />

              {/* Módulo de vencimientos */}
              <Route path="vencimientos" element={<VencimientosList />} />

              {/* Módulo de abogados */}
              <Route path="abogados" element={<AbogadosList />} />
              <Route path="abogados/:id" element={<AbogadoDetail />} />

              {/* Módulo de calculadora */}
              <Route path="calculadora" element={<CalculadoraPage />} />

              {/* Módulo de configuración */}
              <Route path="configuracion" element={<ConfiguracionJUS />} />

              {/* Módulo de finanzas */}
              <Route path="finanzas" element={<FinanzasDashboard />} />
              <Route path="finanzas/gastos-fijos" element={<GastosFijos />} />
              <Route path="finanzas/estadisticas" element={<EstadisticasFinanzas />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<div>404 - Página no encontrada</div>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
