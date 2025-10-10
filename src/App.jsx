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

          {/* Usuarios - Solo Admin */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <div className="container py-xl">
                  <h1>Gestión de Usuarios</h1>
                  <p>Módulo de usuarios en desarrollo</p>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Configuración - Solo Admin */}
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <div className="container py-xl">
                  <h1>Configuración</h1>
                  <p>Módulo de configuración en desarrollo</p>
                </div>
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