import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Clock,
  UserCheck,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UsersRound,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from "../../stores/authStore";
import './Sidebar.css';

// 🎯 Configuración del menú por roles
const menuConfig = {
  // Todos los usuarios autenticados ven estas opciones
  common: [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    }
  ],
  
  // 🔵 JEFE DE ALMACÉN
  jefe_almacen: [
    {
      path: '/devoluciones/nueva',
      label: 'Nueva Devolución',
      icon: Package,
    },
    {
      path: '/devoluciones/pendientes-almacen',
      label: 'Pendientes Almacén',
      icon: ClipboardList,
    },
    {
      path: '/clientes',
      label: 'Clientes',
      icon: UsersRound,
    }
  ],
  
  // 🟢 CRÉDITO Y COBRANZA
  credito_cobranza: [
    {
      path: '/devoluciones/nueva',
      label: 'Nueva Devolución',
      icon: Package,
    },
    {
      path: '/devoluciones/pendientes-credito',
      label: 'Pendientes Crédito',
      icon: Clock,
    },
    {
      path: '/clientes',
      label: 'Clientes',
      icon: UsersRound,
    },
    {
      path: '/clientes-plantilla',
      label: 'Clientes Plantilla',
      icon: FileSpreadsheet,
    }
  ],
  
  // 🔴 ADMINISTRADOR (acceso total)
  administrador: [
    {
      path: '/devoluciones/nueva',
      label: 'Nueva Devolución',
      icon: Package,
    },
    {
      path: '/devoluciones/pendientes-almacen',
      label: 'Almacén',
      icon: ClipboardList,
    },
    {
      path: '/devoluciones/pendientes-credito',
      label: 'Crédito',
      icon: Clock,
    },
    {
      path: '/devoluciones/pendientes-representante',
      label: 'Representante',
      icon: UserCheck,
    },
    {
      path: '/reportes',
      label: 'Reportes',
      icon: BarChart3,
    },
    {
      path: '/clientes',
      label: 'Clientes',
      icon: UsersRound,
    },
    {
      path: '/clientes-plantilla',
      label: 'Clientes Plantilla',
      icon: FileSpreadsheet,
    },
    {
      path: '/usuarios',
      label: 'Usuarios',
      icon: Users,
    },
    {
      path: '/eliminar-notas',
      label: 'Eliminar notas',
      icon: Trash2,
    }
  ]
};

const Sidebar = () => {
  const { user, signOut } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🎯 Obtener opciones de menú según el rol del usuario
  const getMenuItems = () => {
    if (!user) return menuConfig.common;
    
    const roleMenu = menuConfig[user.rol] || [];
    return [...menuConfig.common, ...roleMenu];
  };

  const handleLogout = () => {
    signOut();
    window.location.href = '/login';
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-brand">
            <Package size={32} className="brand-icon" />
            <div>
              <h2>Devoluciones</h2>
              <p className="text-xs text-gray-400">Sistema de Gestión</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="collapse-btn"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {user.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="user-info">
              <p className="user-name">{user.nombre || 'Usuario'}</p>
              <p className="user-role">{user.rol || 'Sin rol'}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={20} className="nav-icon" />
              {!isCollapsed && (
                <span className="nav-label">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      {user && (
        <div className="sidebar-footer">
          <button 
            onClick={handleLogout}
            className="logout-btn"
            title={isCollapsed ? 'Cerrar Sesión' : ''}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;