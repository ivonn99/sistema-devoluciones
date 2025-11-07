// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';

// Layout
import DashboardLayout from './components/common/DashboardLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import NuevoRegistro from './pages/devoluciones/NuevoRegistro';
import PendientesAlmacen from './pages/devoluciones/PendientesAlmacen';
import PendientesCredito from './pages/devoluciones/PendientesCredito';
import PendientesRepresentante from './pages/devoluciones/PendientesRepresentante';
import Reportes from './pages/reportes/reportes';
import Clientes from './pages/clientes/Clientes';
import Usuarios from './pages/usuarios/Usuarios';
import EliminarNotas from './pages/eliminar-notas/EliminarNotas';
import ClientesPlantilla from './pages/clientes-plantilla/ClientesPlantilla';

// Componente para rutas protegidas con verificación de rol
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return (
      <div className="error-page">
        <h1>Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta página</p>
        <a href="/dashboard">Volver al dashboard</a>
      </div>
    );
  }

  return children;
};

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* ========== RUTA DE LOGIN (PÚBLICA) ========== */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />

        {/* ========== DASHBOARD (PÚBLICO) ========== */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* ========== RUTAS PROTEGIDAS (CON DASHBOARDLAYOUT) ========== */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          {/* Nueva Devolución - Todos los roles autenticados */}
          <Route 
            path="/devoluciones/nueva" 
            element={<NuevoRegistro />} 
          />

          {/* Pendientes Almacén - Jefe de Almacén y Admin */}
          <Route
            path="/devoluciones/pendientes-almacen"
            element={
              <ProtectedRoute allowedRoles={['jefe_almacen', 'administrador']}>
                <PendientesAlmacen />
              </ProtectedRoute>
            }
          />

          {/* Pendientes Crédito - Crédito y Cobranza y Admin */}
          <Route
            path="/devoluciones/pendientes-credito"
            element={
              <ProtectedRoute allowedRoles={['credito_cobranza', 'administrador']}>
                <PendientesCredito />
              </ProtectedRoute>
            }
          />

          {/* Pendientes Representante - Solo Admin */}
          <Route
            path="/devoluciones/pendientes-representante"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <PendientesRepresentante />
              </ProtectedRoute>
            }
          />

          {/* Reportes - Solo Admin */}
          <Route
            path="/reportes"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <Reportes />
              </ProtectedRoute>
            }
          />

          {/* Clientes - Almacén, Crédito y Admin */}
          <Route
            path="/clientes"
            element={
              <ProtectedRoute allowedRoles={['jefe_almacen', 'credito_cobranza', 'administrador']}>
                <Clientes />
              </ProtectedRoute>
            }
          />

          {/* Usuarios - Solo Admin */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <Usuarios />
              </ProtectedRoute>
            }
          />

          {/* Eliminar notas - Solo Admin */}
          <Route
            path="/eliminar-notas"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <EliminarNotas />
              </ProtectedRoute>
            }
          />

          {/* Clientes Plantilla - Admin y Crédito */}
          <Route
            path="/clientes-plantilla"
            element={
              <ProtectedRoute allowedRoles={['administrador', 'credito_cobranza']}>
                <ClientesPlantilla />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ========== REDIRECCIÓN POR DEFECTO ========== */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* ========== RUTA 404 ========== */}
        <Route
          path="*"
          element={
            <div className="error-page">
              <h1>404</h1>
              <p>Página no encontrada</p>
              <a href="/dashboard">Volver al dashboard</a>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;