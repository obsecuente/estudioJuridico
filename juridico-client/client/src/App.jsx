import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/auth/Login";
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
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz redirige a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Ruta de login */}
          <Route path="/login" element={<Login />} />

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

            {/* Módulo de abogados */}
            {/* Módulo de abogados */}
            <Route path="abogados" element={<AbogadosList />} />
            <Route path="abogados/:id" element={<AbogadoDetail />} />
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<div>404 - Página no encontrada</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
