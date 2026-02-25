import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./components/layout/Dashboard";
import Home from "./pages/dashboard/Home";
import ClientesList from "./pages/clientes/ClientesList";
import ClienteDetail from "./pages/clientes/ClienteDetail";

import AbogadosList from "./pages/abogados/AbogadosList";
import AbogadoDetail from "./pages/abogados/AbogadoDetail";

import ConsultasList from "./pages/consultas/ConsultasList";
import ConsultaDetail from "./pages/consultas/ConsultaDetail";

import CasosList from "./pages/casos/CasosList";
import CasoDetail from "./pages/casos/CasoDetail";

import DocumentosList from "./pages/documentos/DocumentosList";
import DocumentoDetail from "./pages/documentos/DocumentoDetail";

import EventosList from "./pages/eventos/EventosList";
import VencimientosList from "./pages/vencimientos/VencimientosList";
import CalculadoraPage from "./pages/calculadora/CalculadoraPage";
import ConfiguracionJUS from "./pages/configuracion/ConfiguracionJUS";
import FinanzasDashboard from "./pages/finanzas/FinanzasDashboard";
import GastosFijos from "./pages/finanzas/GastosFijos";
import EstadisticasFinanzas from "./pages/finanzas/EstadisticasFinanzas";
import "./App.css";



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz redirige a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas de autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Rutas protegidas del dashboard (Usando ProtectedRoute para autenticación básica) */}
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

            {/* Rutas de módulos (placeholders) */}

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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
