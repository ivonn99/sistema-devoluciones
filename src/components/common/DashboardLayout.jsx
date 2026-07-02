import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { isCollapsed, closeSidebar, toggleSidebar } = useSidebar();

  return (
    <div className="dashboard-layout d-flex">
      {!isCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <Sidebar />
      <main className="main-content flex-grow-1">
        {isCollapsed && (
          <button
            type="button"
            className="sidebar-mobile-toggle"
            onClick={toggleSidebar}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="container-fluid py-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;