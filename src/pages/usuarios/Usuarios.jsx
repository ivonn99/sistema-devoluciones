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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="card border-primary mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <Users size={32} />
              <div>
                <h1 className="h3 mb-0 fw-bold">Gestión de Usuarios</h1>
                <p className="mb-0 opacity-75">Administra los usuarios del sistema</p>
              </div>
            </div>
            <button className="btn btn-light d-flex align-items-center gap-2" onClick={handleNuevoUsuario}>
              <UserPlus size={20} />
              Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-primary hover-lift">
            <div className="card-body d-flex align-items-center gap-3">
              <Users size={32} className="text-primary" />
              <div>
                <div className="h4 mb-0 fw-bold text-primary">{estadisticas.total}</div>
                <small className="text-muted">Total Usuarios</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-success hover-lift">
            <div className="card-body d-flex align-items-center gap-3">
              <Power size={32} className="text-success" />
              <div>
                <div className="h4 mb-0 fw-bold text-success">{estadisticas.activos}</div>
                <small className="text-muted">Activos</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-danger hover-lift">
            <div className="card-body d-flex align-items-center gap-3">
              <Power size={32} className="text-danger" />
              <div>
                <div className="h4 mb-0 fw-bold text-danger">{estadisticas.inactivos}</div>
                <small className="text-muted">Inactivos</small>
              </div>
            </div>
          </div>
        </div>

        {estadisticas.porRol.map((rol, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-lg-3">
            <div className="card border-info hover-lift">
              <div className="card-body d-flex align-items-center gap-3">
                <Shield size={32} className="text-info" />
                <div>
                  <div className="h4 mb-0 fw-bold text-info">{rol.cantidad}</div>
                  <small className="text-muted">{rol.nombre}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0 d-flex align-items-center gap-2">
            <Filter size={20} />
            Filtros y Búsqueda
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Buscar</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={20} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por usuario o nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Filter size={16} />
                Rol
              </label>
              <select className="form-select" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                <option value="todos">Todos los roles</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>{rol.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Filter size={16} />
                Estado
              </label>
              <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Usuario</th>
                  <th>Nombre Completo</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map(usuario => (
                    <tr key={usuario.id} className={!usuario.activo ? 'opacity-50' : ''}>
                      <td className="fw-semibold">{usuario.username}</td>
                      <td>{usuario.nombre_completo}</td>
                      <td>
                        {usuario.email ? (
                          <span className="d-flex align-items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <small>{usuario.email}</small>
                          </span>
                        ) : (
                          <span className="text-muted small">Sin correo</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getRolBadgeClass(usuario.roles?.name)}`}>
                          {usuario.roles?.name || 'Sin rol'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${usuario.activo ? 'bg-success' : 'bg-secondary'}`}>
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
                      <td className="text-center">
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditarUsuario(usuario)}
                            title="Editar usuario"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => handleCambiarPassword(usuario)}
                            title="Cambiar contraseña"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            className={`btn btn-sm ${usuario.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => handleToggleEstado(usuario)}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
