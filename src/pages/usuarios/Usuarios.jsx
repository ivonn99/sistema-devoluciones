import { useState, useEffect, useMemo } from 'react';
import { Users, UserPlus, Search, Filter, Edit2, Power, Key, Shield } from 'lucide-react';
import Swal from 'sweetalert2';
import useUsuariosStore from '../../stores/usuariosStore';
import UsuarioModal from './UsuarioModal';
import CambiarPasswordModal from './CambiarPasswordModal';
import './usuarios.css';

const Usuarios = () => {
  const { usuarios, roles, loading, fetchUsuarios, fetchRoles, deleteUsuario, activarUsuario } = useUsuariosStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [usuarioPassword, setUsuarioPassword] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  // Filtrar usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      const cumpleBusqueda =
        usuario.username.toLowerCase().includes(busqueda.toLowerCase()) ||
        usuario.nombre_completo.toLowerCase().includes(busqueda.toLowerCase());

      const cumpleRol = filtroRol === 'todos' || usuario.rol_id === parseInt(filtroRol);
      const cumpleEstado = filtroEstado === 'todos' ||
        (filtroEstado === 'activo' && usuario.activo) ||
        (filtroEstado === 'inactivo' && !usuario.activo);

      return cumpleBusqueda && cumpleRol && cumpleEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  // Estadísticas
  const estadisticas = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    inactivos: usuarios.filter(u => !u.activo).length,
    porRol: roles.map(rol => ({
      nombre: rol.name,
      cantidad: usuarios.filter(u => u.rol_id === rol.id).length
    }))
  }), [usuarios, roles]);

  const handleNuevoUsuario = () => {
    setUsuarioEdit(null);
    setModalOpen(true);
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioEdit(usuario);
    setModalOpen(true);
  };

  const handleCambiarPassword = (usuario) => {
    setUsuarioPassword(usuario);
    setPasswordModalOpen(true);
  };

  const handleToggleEstado = async (usuario) => {
    const result = await Swal.fire({
      title: usuario.activo ? 'Desactivar Usuario' : 'Activar Usuario',
      text: usuario.activo
        ? `¿Está seguro de desactivar al usuario "${usuario.username}"?`
        : `¿Está seguro de activar al usuario "${usuario.username}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: usuario.activo ? '#dc3545' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: usuario.activo ? 'Sí, desactivar' : 'Sí, activar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        if (usuario.activo) {
          await deleteUsuario(usuario.id);
          Swal.fire({
            icon: 'success',
            title: 'Usuario Desactivado',
            text: `El usuario "${usuario.username}" ha sido desactivado exitosamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          await activarUsuario(usuario.id);
          Swal.fire({
            icon: 'success',
            title: 'Usuario Activado',
            text: `El usuario "${usuario.username}" ha sido activado exitosamente.`,
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al cambiar el estado del usuario.',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  const getRolBadgeClass = (rolName) => {
    const rolMap = {
      'admin': 'badge-danger',
      'credito': 'badge-info',
      'almacen': 'badge-warning',
      'vendedor': 'badge-success'
    };
    return rolMap[rolName?.toLowerCase()] || 'badge-secondary';
  };

  if (loading && usuarios.length === 0) {
    return <div className="usuarios-loading">Cargando usuarios...</div>;
  }

  return (
    <div className="usuarios-container">
      {/* Header */}
      <div className="usuarios-header">
        <div className="header-left">
          <Users size={32} />
          <div>
            <h1>Gestión de Usuarios</h1>
            <p>Administra los usuarios del sistema</p>
          </div>
        </div>
        <button className="btn-nuevo-usuario" onClick={handleNuevoUsuario}>
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Usuarios</span>
            <span className="stat-value">{estadisticas.total}</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <Power size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Activos</span>
            <span className="stat-value">{estadisticas.activos}</span>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon">
            <Power size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Inactivos</span>
            <span className="stat-value">{estadisticas.inactivos}</span>
          </div>
        </div>

        {estadisticas.porRol.map((rol, idx) => (
          <div key={idx} className="stat-card stat-info">
            <div className="stat-icon">
              <Shield size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">{rol.nombre}</span>
              <span className="stat-value">{rol.cantidad}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <div className="filtros-section">
        <div className="busqueda-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por usuario o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtro-group">
          <Filter size={16} />
          <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
            <option value="todos">Todos los roles</option>
            {roles.map(rol => (
              <option key={rol.id} value={rol.id}>{rol.name}</option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <Filter size={16} />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="usuarios-tabla-container">
        <table className="usuarios-tabla">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map(usuario => (
                <tr key={usuario.id} className={!usuario.activo ? 'row-inactivo' : ''}>
                  <td className="usuario-username">
                    <strong>{usuario.username}</strong>
                  </td>
                  <td>{usuario.nombre_completo}</td>
                  <td>
                    <span className={`badge ${getRolBadgeClass(usuario.roles?.name)}`}>
                      {usuario.roles?.name || 'Sin rol'}
                    </span>
                  </td>
                  <td>
                    <span className={`estado-badge ${usuario.activo ? 'estado-activo' : 'estado-inactivo'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {new Date(usuario.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="acciones-cell">
                    <button
                      className="btn-accion btn-editar"
                      onClick={() => handleEditarUsuario(usuario)}
                      title="Editar usuario"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-accion btn-password"
                      onClick={() => handleCambiarPassword(usuario)}
                      title="Cambiar contraseña"
                    >
                      <Key size={16} />
                    </button>
                    <button
                      className={`btn-accion ${usuario.activo ? 'btn-desactivar' : 'btn-activar'}`}
                      onClick={() => handleToggleEstado(usuario)}
                      title={usuario.activo ? 'Desactivar' : 'Activar'}
                    >
                      <Power size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición */}
      {modalOpen && (
        <UsuarioModal
          usuario={usuarioEdit}
          roles={roles}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Modal de Cambiar Contraseña */}
      {passwordModalOpen && (
        <CambiarPasswordModal
          usuario={usuarioPassword}
          onClose={() => setPasswordModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Usuarios;
