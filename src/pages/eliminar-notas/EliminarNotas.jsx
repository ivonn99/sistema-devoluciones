import { Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import useDevolucionesStore from '../../stores/devolucionesStore';
import './EliminarNotas.css';

const EliminarNotas = () => {
  const {
    devoluciones,
    searchResults,
    fetchDevoluciones,
    searchDevoluciones,
    resetSearch,
    loading,
    searchLoading,
    hasMore,
    searchHasMore
  } = useDevolucionesStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // ID de la nota a eliminar
  const observerTarget = useRef(null);
  const isLoadingMore = useRef(false); // Prevenir cargas múltiples simultáneas

  // Carga inicial
  useEffect(() => {
    fetchDevoluciones({}, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Resetear flag de carga al cambiar búsqueda
    isLoadingMore.current = false;

    if (searchTerm.trim() === "") {
      resetSearch();
      return;
    }

    const timer = setTimeout(() => {
      resetSearch();
      searchDevoluciones(searchTerm, {}, true);
    }, 500);

    setSearchDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Infinite scroll con IntersectionObserver
  useEffect(() => {
    const currentHasMore = searchTerm.trim() !== "" ? searchHasMore : hasMore;
    const isLoading = loading || searchLoading;

    // No crear observer si no hay más datos
    if (!currentHasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Solo cargar si está intersectando, no está cargando, y no hay una carga en progreso
        if (entries[0].isIntersecting && !isLoading && !isLoadingMore.current && currentHasMore) {
          isLoadingMore.current = true;

          // Cargar más datos según si hay búsqueda activa o no
          const loadPromise = searchTerm.trim() !== ""
            ? searchDevoluciones(searchTerm, {}, false)
            : fetchDevoluciones({}, false);

          // Liberar el flag después de que termine la carga
          loadPromise.finally(() => {
            // Pequeño delay para evitar cargas inmediatas consecutivas
            setTimeout(() => {
              isLoadingMore.current = false;
            }, 300);
          });
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, searchHasMore, loading, searchLoading, searchTerm, fetchDevoluciones, searchDevoluciones]);

  const limpiarBusqueda = () => {
    setSearchTerm("");
    resetSearch();
    isLoadingMore.current = false;
  };

  const handleDelete = async (id) => {
    const { deleteDevolucion } = useDevolucionesStore.getState();

    const result = await deleteDevolucion(id);

    if (result.success) {
      setDeleteConfirm(null);
      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'El registro ha sido eliminado exitosamente.',
        timer: 2000,
        showConfirmButton: false
      });
      // No es necesario recargar, el store ya actualizó el estado
      // eliminando el registro de ambas listas (devoluciones y searchResults)
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: result.error,
        confirmButtonColor: '#dc3545'
      });
      setDeleteConfirm(null);
    }
  };

  const dataToShow = searchTerm.trim() !== "" ? searchResults : devoluciones;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="card border-danger mb-4 shadow-sm">
        <div className="card-header bg-danger text-white">
          <h1 className="h3 mb-0 fw-bold">Eliminar Notas</h1>
          <p className="mb-0 opacity-75">Busca y elimina registros de devoluciones</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="input-group mb-2">
            <span className="input-group-text bg-white">
              <Search size={20} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nota, cliente, empresa, vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn btn-outline-secondary" type="button" onClick={limpiarBusqueda}>
                <X size={18} />
              </button>
            )}
          </div>
          <small className="text-muted">
            {searchLoading
              ? '🔍 Buscando en el servidor...'
              : '💡 La búsqueda se realiza automáticamente. Haz scroll para cargar más registros.'}
          </small>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-body p-0">
          {dataToShow.length === 0 && !loading && !searchLoading ? (
            <div className="text-center py-5">
              <p className="text-muted">No se encontraron registros</p>
            </div>
          ) : (
            <>
              <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                <table className="table table-hover table-striped align-middle mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Nota</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Empresa</th>
                      <th>Vendedor</th>
                      <th>Estado</th>
                      <th>Proceso en</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataToShow.map((dev) => (
                      <tr key={dev.id}>
                        <td className="fw-semibold">{dev.numero_nota || '-'}</td>
                        <td>{dev.fecha_devolucion ? new Date(dev.fecha_devolucion).toLocaleDateString() : '-'}</td>
                        <td>{dev.cliente || '-'}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {dev.empresa || '-'}
                          </span>
                        </td>
                        <td>{dev.vendedor_nombre || '-'}</td>
                        <td>
                          <span className={`badge-estado badge bg-info`}>
                            {dev.estado_actual?.replace(/_/g, ' ') || '-'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {dev.proceso_en || '-'}
                          </span>
                        </td>
                        <td className="text-center">
                          {deleteConfirm === dev.id ? (
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleDelete(dev.id)}
                              >
                                Sí
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => setDeleteConfirm(dev.id)}
                              title="Eliminar registro"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Observer target para infinite scroll */}
              <div ref={observerTarget} style={{ height: '20px' }}></div>

              {/* Loading indicator cuando carga más datos */}
              {(loading || searchLoading) && dataToShow.length > 0 && (
                <div className="card-footer text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <small className="text-muted">Cargando más registros...</small>
                </div>
              )}

              {/* Mensaje cuando no hay más datos */}
              {!loading && !searchLoading && dataToShow.length > 0 &&
               !(searchTerm.trim() !== "" ? searchHasMore : hasMore) && (
                <div className="card-footer text-center py-2">
                  <small className="text-success">✓ No hay más registros para mostrar</small>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mensaje de advertencia */}
      <div className="alert alert-warning mt-4 d-flex align-items-center gap-2">
        <AlertTriangle size={20} />
        <div>
          <strong>Advertencia:</strong> La eliminación de registros es permanente y no se puede deshacer.
        </div>
      </div>
    </div>
  );
};

export default EliminarNotas;
