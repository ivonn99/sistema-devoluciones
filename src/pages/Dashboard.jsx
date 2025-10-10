// pages/Dashboard.jsx
import { Package, FileText, CreditCard, Warehouse, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import TablaDevoluciones from './devoluciones/TablaDevoluciones';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const accessConfig = {
    jefe_almacen: [
      {
        path: '/devoluciones/nueva',
        icon: Package,
        title: 'Nueva Devolución',
        description: 'Registrar nueva devolución'
      },
      {
        path: '/devoluciones/pendientes-almacen',
        icon: Warehouse,
        title: 'Pendientes Almacén',
        description: 'Revisar devoluciones en almacén'
      }
    ],
    credito_cobranza: [
      {
        path: '/devoluciones/nueva',
        icon: Package,
        title: 'Nueva Devolución',
        description: 'Registrar nueva devolución'
      },
      {
        path: '/devoluciones/pendientes-credito',
        icon: CreditCard,
        title: 'Pendientes Crédito',
        description: 'Revisar devoluciones en crédito'
      }
    ],
    administrador: [
      {
        path: '/devoluciones/nueva',
        icon: Package,
        title: 'Nueva Devolución',
        description: 'Registrar nueva devolución'
      },
      {
        path: '/devoluciones/pendientes-almacen',
        icon: Warehouse,
        title: 'Pendientes Almacén',
        description: 'Revisar devoluciones en almacén'
      },
      {
        path: '/devoluciones/pendientes-credito',
        icon: CreditCard,
        title: 'Pendientes Crédito',
        description: 'Revisar devoluciones en crédito'
      },
      {
        path: '/devoluciones/pendientes-representante',
        icon: Users,
        title: 'Pendientes Representante',
        description: 'Revisar devoluciones del representante'
      },
      {
        path: '/reportes',
        icon: FileText,
        title: 'Reportes',
        description: 'Ver estadísticas y reportes'
      }
    ]
  };

  const accessItems = user ? accessConfig[user.rol] || [] : [];

  return (
    <div className="dashboard-public-container">
      <div className="dashboard-public-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div>
              <h1 className="dashboard-title">Dashboard de Devoluciones</h1>
              {user ? (
                <p className="dashboard-welcome">
                  Bienvenido, <strong>{user.nombre || user.email}</strong>
                </p>
              ) : (
                <p className="dashboard-welcome">
                  Bienvenido al sistema de devoluciones
                </p>
              )}
            </div>
            
            {/* Botones de Login/Logout */}
            <div className="dashboard-actions">
              {!user ? (
                <button 
                  onClick={() => navigate('/login')} 
                  className="btn-login"
                >
                  Iniciar Sesión
                </button>
              ) : (
                <button 
                  onClick={handleLogout} 
                  className="btn-logout"
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Accesos rápidos - Solo si hay usuario */}
        {user && accessItems.length > 0 && (
          <section className="dashboard-section">
            <h2 className="section-title">Accesos Rápidos</h2>
            <div className="access-grid">
              {accessItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="access-card"
                  >
                    <Icon size={24} className="access-card-icon" />
                    <h3 className="access-card-title">{item.title}</h3>
                    <p className="access-card-description">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Tabla de devoluciones */}
        <section className="dashboard-section">
          <TablaDevoluciones />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;