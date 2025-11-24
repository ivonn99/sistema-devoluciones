import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useClientesStore from '../../stores/clientesStore';
import Swal from 'sweetalert2';
import {
  Users,
  Search,
  PlusCircle,
  X,
  Trash2,
  AlertCircle
} from 'lucide-react';
import './Clientes.css';

const Clientes = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.rol?.toLowerCase() === 'administrador';

  const {
    clientes,
    loading,
    loadingMore,
    hasMore,
    searchClientes,
    loadMoreClientes,
    createCliente,
    deleteCliente,
    deleteAllClientes
  } = useClientesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    ruta_reparto: ''
  });

  // Cargar clientes iniciales
  useEffect(() => {
    searchClientes('', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      searchClientes(searchTerm, true); // resetPage = true
    }, 500);

    setSearchDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.clientes-tabla-container');
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

      // Si estamos cerca del final (100px antes)
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        if (!loadingMore && hasMore) {
          loadMoreClientes(searchTerm);
        }
      }
    };

    const scrollContainer = document.querySelector('.clientes-tabla-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [loadingMore, hasMore, searchTerm, loadMoreClientes]);

  const abrirModal = () => {
    setNuevoCliente({ nombre: '', ruta_reparto: '' });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNuevoCliente({ nombre: '', ruta_reparto: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nuevoCliente.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del cliente es obligatorio',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Crear nuevo cliente?',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;">Se creará el siguiente cliente:</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>👤 <strong>Nombre:</strong> ${nuevoCliente.nombre}</li>
            <li>🚚 <strong>Ruta:</strong> ${nuevoCliente.ruta_reparto || 'Sin especificar'}</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      await ejecutarCreacion();
    }
  };

  const ejecutarCreacion = async () => {
    cerrarModal();

    Swal.fire({
      title: 'Creando cliente...',
      html: 'Por favor espera',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const clienteData = {
        nombre: nuevoCliente.nombre.trim(),
        ruta_reparto: nuevoCliente.ruta_reparto.trim() || null
      };

      const resultado = await createCliente(clienteData);

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al crear cliente');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Cliente Creado',
        html: `
          <div style="text-align: center;">
            <p style="font-size: 1.1em; margin-bottom: 10px;">
              El cliente <strong>${nuevoCliente.nombre}</strong> ha sido creado exitosamente
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        timer: 2500,
        timerProgressBar: true
      });

      // Recargar lista
      await searchClientes(searchTerm, true);

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Ocurrió un error al crear el cliente',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleEliminar = async (cliente) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px; color: #991b1b;">
            <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer
          </p>
          <ul style="list-style: none; padding-left: 0;">
            <li>👤 <strong>Cliente:</strong> ${cliente.nombre}</li>
            <li>🆔 <strong>ID:</strong> ${cliente.id}</li>
          </ul>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Eliminando...',
        html: 'Por favor espera',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const resultado = await deleteCliente(cliente.id);

        if (!resultado.success) {
          throw new Error(resultado.error || 'Error al eliminar cliente');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Cliente Eliminado',
          text: `${cliente.nombre} ha sido eliminado`,
          confirmButtonColor: '#10b981',
          timer: 2000,
          timerProgressBar: true
        });

      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'Ocurrió un error al eliminar el cliente',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  const handleDeleteAllClientes = async () => {
    const result = await Swal.fire({
      title: 'Eliminar todos los clientes',
      html: `
        <p>¿Estás seguro de que deseas eliminar <strong>TODOS</strong> los registros de clientes?</p>
        <p style="color: #dc3545; font-weight: bold;">Esta acción NO se puede deshacer.</p>
        <p>Escribe <strong>ELIMINAR TODO</strong> para confirmar:</p>
      `,
      input: 'text',
      inputPlaceholder: 'Escribe: ELIMINAR TODO',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      preConfirm: (inputValue) => {
        if (inputValue !== 'ELIMINAR TODO') {
          Swal.showValidationMessage('Debes escribir exactamente "ELIMINAR TODO"');
          return false;
        }
        return true;
      }
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Eliminando todos los clientes...',
        html: 'Por favor espera',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const deleteResult = await deleteAllClientes();

      if (deleteResult.success) {
        Swal.fire({
          icon: 'success',
          title: 'Clientes eliminados',
          text: 'Todos los registros de clientes han sido eliminados.',
          timer: 2000,
          showConfirmButton: false
        });
        await searchClientes('', true);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: deleteResult.error,
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  if (!user) {
    return (
      <div className="loading-container">
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2>Debes iniciar sesión para acceder a esta página</h2>
      </div>
    );
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
                <h1 className="h3 mb-0 fw-bold">Gestión de Clientes</h1>
                <p className="mb-0 opacity-75">Busca y administra clientes del sistema</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones y búsqueda */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Buscar Cliente</label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={20} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar cliente por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-6 d-flex gap-2 justify-content-md-end">
              <button
                onClick={abrirModal}
                className="btn btn-primary d-flex align-items-center gap-2"
              >
                <PlusCircle size={20} />
                Nuevo Cliente
              </button>
              {isAdmin && (
                <button
                  onClick={handleDeleteAllClientes}
                  className="btn btn-danger d-flex align-items-center gap-2"
                  title="Eliminar todos los clientes (Solo Admin)"
                >
                  <Trash2 size={20} />
                  Eliminar Todos
                </button>
              )}
            </div>
          </div>
          <div className="mt-3">
            <small className="text-muted">
              {loading ? (
                'Buscando...'
              ) : (
                <>
                  Mostrando <strong>{clientes.length}</strong> cliente{clientes.length !== 1 ? 's' : ''}
                  {searchTerm && ` para "${searchTerm}"`}
                </>
              )}
            </small>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      {loading && clientes.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mb-0">Cargando clientes...</p>
          </div>
        </div>
      ) : clientes.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <Users size={64} className="text-muted mb-3" />
            <h3 className="h5">No se encontraron clientes</h3>
            <p className="text-muted mb-0">
              {searchTerm
                ? `No hay resultados para "${searchTerm}"`
                : 'No hay clientes registrados'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Ruta de Reparto</th>
                    <th className="text-center" style={{ width: '100px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="fw-semibold">{cliente.id}</td>
                      <td>{cliente.nombre}</td>
                      <td className="text-muted">{cliente.ruta_reparto || '-'}</td>
                      <td className="text-center">
                        <button
                          onClick={() => handleEliminar(cliente)}
                          className="btn btn-danger btn-sm"
                          title="Eliminar cliente"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Indicador de carga al hacer scroll */}
            {loadingMore && (
              <div className="card-footer text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <small className="text-muted">Cargando más clientes...</small>
              </div>
            )}
            {/* Indicador de que no hay más resultados */}
            {!loadingMore && !hasMore && clientes.length > 0 && (
              <div className="card-footer text-center py-2">
                <small className="text-success">✓ No hay más clientes para mostrar</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {modalAbierto && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={cerrarModal} tabIndex="-1">
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <PlusCircle size={24} />
                  Nuevo Cliente
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold d-flex align-items-center gap-2">
                      <Users size={16} />
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={nuevoCliente.nombre}
                      onChange={handleInputChange}
                      placeholder="Ej: FARMACIA SAN JOSE"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">🚚 Ruta de Reparto</label>
                    <input
                      type="text"
                      name="ruta_reparto"
                      value={nuevoCliente.ruta_reparto}
                      onChange={handleInputChange}
                      placeholder="Ej: Ruta 1, Zona Norte"
                      className="form-control"
                    />
                    <small className="text-muted">
                      Opcional - Especifica la ruta de entrega
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-flex align-items-center gap-2"
                  >
                    <PlusCircle size={18} />
                    Crear Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
