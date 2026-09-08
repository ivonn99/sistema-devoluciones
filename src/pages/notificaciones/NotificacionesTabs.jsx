import { NavLink } from 'react-router-dom';
import { Users, History } from 'lucide-react';

const NotificacionesTabs = () => (
  <ul className="nav nav-tabs mb-4">
    <li className="nav-item">
      <NavLink
        to="/notificaciones/destinatarios"
        className={({ isActive }) => `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
      >
        <Users size={18} />
        Destinatarios
      </NavLink>
    </li>
    <li className="nav-item">
      <NavLink
        to="/notificaciones/historial"
        className={({ isActive }) => `nav-link d-flex align-items-center gap-2 ${isActive ? 'active' : ''}`}
      >
        <History size={18} />
        Historial de Envíos
      </NavLink>
    </li>
  </ul>
);

export default NotificacionesTabs;
