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
    <div className="clientes-container">
      <div className="clientes-header">
        <div className="header-titulo">
          <Users size={32} style={{ color: '#3b82f6' }} />
          <h1>Gestión de Clientes</h1>
        </div>
        <p className="header-descripcion">
          Busca y administra clientes del sistema
        </p>
      </div>

      <div className="clientes-actions">
        <div className="search-box">
          <Search size={20} style={{ color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Buscar cliente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="search-clear"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={abrirModal}
            className="btn-nuevo-cliente"
          >
            <PlusCircle size={20} />
            Nuevo Cliente
          </button>

          {isAdmin && (
            <button
              onClick={handleDeleteAllClientes}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500',
                fontSize: '0.95rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
              title="Eliminar todos los clientes (Solo Admin)"
            >
              <Trash2 size={20} />
              Eliminar Todos
            </button>
          )}
        </div>
      </div>

      <div className="clientes-info">
        <p>
          {loading ? (
            'Buscando...'
          ) : (
            <>
              Mostrando <strong>{clientes.length}</strong> cliente{clientes.length !== 1 ? 's' : ''}
              {searchTerm && ` para "${searchTerm}"`}
            </>
          )}
        </p>
      </div>

      {loading && clientes.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="empty-state">
          <Users size={64} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
          <h3>No se encontraron clientes</h3>
          <p>
            {searchTerm
              ? `No hay resultados para "${searchTerm}"`
              : 'No hay clientes registrados'}
          </p>
        </div>
      ) : (
        <div className="clientes-tabla-container">
          <table className="clientes-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Ruta de Reparto</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="td-id">{cliente.id}</td>
                  <td className="td-nombre">{cliente.nombre}</td>
                  <td className="td-ruta">{cliente.ruta_reparto || '-'}</td>
                  <td className="td-acciones">
                    <button
                      onClick={() => handleEliminar(cliente)}
                      className="btn-eliminar"
                      title="Eliminar cliente"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Indicador de carga al hacer scroll */}
          {loadingMore && (
            <div className="loading-more">
              <div className="spinner-small"></div>
              <p>Cargando más clientes...</p>
            </div>
          )}

          {/* Indicador de que no hay más resultados */}
          {!loadingMore && !hasMore && clientes.length > 0 && (
            <div className="no-more-results">
              <p>No hay más clientes para mostrar</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <PlusCircle size={24} style={{ marginRight: '0.5rem' }} />
                Nuevo Cliente
              </h2>
              <button onClick={cerrarModal} className="modal-close">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    <Users size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={nuevoCliente.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: FARMACIA SAN JOSE"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    🚚 Ruta de Reparto
                  </label>
                  <input
                    type="text"
                    name="ruta_reparto"
                    value={nuevoCliente.ruta_reparto}
                    onChange={handleInputChange}
                    placeholder="Ej: Ruta 1, Zona Norte"
                    className="form-input"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    Opcional - Especifica la ruta de entrega
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-guardar"
                >
                  <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
                  Crear Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
