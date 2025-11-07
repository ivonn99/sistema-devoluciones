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
    <div className="eliminar-notas-container">
      <div className="eliminar-notas-header">
        <div>
          <h1>Eliminar Notas</h1>
          <p className="subtitle">Busca y elimina registros de devoluciones</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="busqueda-section">
        <div className="busqueda-wrapper">
          <Search className="busqueda-icon" size={20} />
          <input
            type="text"
            className="busqueda-input"
            placeholder="Buscar por nota, cliente, empresa, vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="busqueda-clear" onClick={limpiarBusqueda}>
              <X size={18} />
            </button>
          )}
        </div>
        <small className="busqueda-hint">
          {searchLoading
            ? '🔍 Buscando en el servidor...'
            : '💡 La búsqueda se realiza automáticamente. Haz scroll para cargar más registros.'}
        </small>
      </div>

      {/* Tabla */}
      <div className="tabla-section">
        {dataToShow.length === 0 && !loading && !searchLoading ? (
          <div className="empty-state">
            <p>No se encontraron registros</p>
          </div>
        ) : (
          <>
            <div className="tabla-wrapper">
              <table className="tabla-eliminar">
                <thead>
                  <tr>
                    <th>Nota</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Empresa</th>
                    <th>Vendedor</th>
                    <th>Estado</th>
                    <th>Proceso en</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dataToShow.map((dev) => (
                    <tr key={dev.id}>
                      <td className="nota-cell">{dev.numero_nota || '-'}</td>
                      <td>{dev.fecha_nota ? new Date(dev.fecha_nota).toLocaleDateString() : '-'}</td>
                      <td className="cliente-cell">{dev.cliente_nombre || '-'}</td>
                      <td>
                        <span className={`badge badge-${dev.empresa?.toLowerCase()}`}>
                          {dev.empresa || '-'}
                        </span>
                      </td>
                      <td>{dev.vendedor_nombre || '-'}</td>
                      <td>
                        <span className={`badge badge-estado badge-${dev.estado_actual}`}>
                          {dev.estado_actual?.replace(/_/g, ' ') || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-proceso badge-${dev.proceso_en}`}>
                          {dev.proceso_en || '-'}
                        </span>
                      </td>
                      <td>
                        {deleteConfirm === dev.id ? (
                          <div className="confirm-delete">
                            <button
                              className="btn-confirm-yes"
                              onClick={() => handleDelete(dev.id)}
                            >
                              Sí
                            </button>
                            <button
                              className="btn-confirm-no"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-delete"
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
            <div ref={observerTarget} className="scroll-observer"></div>

            {/* Loading indicator cuando carga más datos */}
            {(loading || searchLoading) && dataToShow.length > 0 && (
              <div className="loading-more">
                <div className="spinner-small"></div>
                <p>Cargando más registros...</p>
              </div>
            )}

            {/* Mensaje cuando no hay más datos */}
            {!loading && !searchLoading && dataToShow.length > 0 &&
             !(searchTerm.trim() !== "" ? searchHasMore : hasMore) && (
              <div className="no-more-data">
                <p>No hay más registros para mostrar</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mensaje de advertencia */}
      <div className="warning-box">
        <AlertTriangle size={20} />
        <div>
          <strong>Advertencia:</strong> La eliminación de registros es permanente y no se puede deshacer.
        </div>
      </div>
    </div>
  );
};

export default EliminarNotas;
