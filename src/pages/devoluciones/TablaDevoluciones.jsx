import React, { useState, useEffect, useRef, useCallback } from "react";
import { Eye, Clock, Loader } from "lucide-react";
import useDevolucionesStore from "../../stores/devolucionesStore";
import { supabase } from "../../config/supabase";
import "./TablaDevoluciones.css";

// 🕐 Helper para convertir timestamp UTC a hora CDMX (maneja DST correctamente)
const convertirAHoraCDMX = (fechaUTC) => {
  if (!fechaUTC) return "-";

  const fecha = new Date(fechaUTC);

  // Usar toLocaleString con timezone de CDMX para manejar DST automáticamente
  const opciones = {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const partes = new Intl.DateTimeFormat('es-MX', opciones).formatToParts(fecha);
  const valores = Object.fromEntries(partes.map(p => [p.type, p.value]));

  return `${valores.day}/${valores.month}/${valores.year}, ${valores.hour}:${valores.minute}:${valores.second}`;
};

// 🕐 Helper para solo fecha (sin hora) con timezone CDMX
const convertirSoloFechaCDMX = (fechaUTC) => {
  if (!fechaUTC) return "-";

  const fecha = new Date(fechaUTC);

  const opciones = {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  const partes = new Intl.DateTimeFormat('es-MX', opciones).formatToParts(fecha);
  const valores = Object.fromEntries(partes.map(p => [p.type, p.value]));

  return `${valores.day}/${valores.month}/${valores.year}`;
};

const TablaDevoluciones = ({ 
  searchTerm, 
  isSearching,
  filters = {},
  onLoadMore
}) => {
  const { 
    devoluciones, 
    searchResults,
    loading, 
    searchLoading,
    hasMore,
    searchHasMore,
    totalCount 
  } = useDevolucionesStore();
  
  const [selectedDevolucion, setSelectedDevolucion] = useState(null);
  const observerTarget = useRef(null);

  // Determinar qué datos mostrar
  const showSearchResults = searchTerm && searchTerm.trim() !== '';
  const dataParaMostrar = showSearchResults ? searchResults : devoluciones;
  const isLoading = showSearchResults ? searchLoading : loading;
  const hasMoreData = showSearchResults ? searchHasMore : hasMore;

  // 🆕 Infinite Scroll Observer (optimizado para móvil)
  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasMoreData && !isLoading) {
      onLoadMore();
    }
  }, [hasMoreData, isLoading, onLoadMore]);

  useEffect(() => {
    const element = observerTarget.current;
    // 🔧 Opciones optimizadas para móvil
    const option = {
      threshold: 0,
      rootMargin: '200px' // Empieza a cargar 200px antes de llegar
    };
    const observer = new IntersectionObserver(handleObserver, option);

    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  // 🆕 Cargar más al hacer scroll manual (fallback para móvil)
  useEffect(() => {
    const handleScroll = () => {
      // Detectar si estamos cerca del final
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Si estamos a 300px del final
      if (scrollHeight - scrollTop - clientHeight < 300 && hasMoreData && !isLoading) {
        onLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreData, isLoading, onLoadMore]);

  const abrirDetalles = (devolucion) => {
    setSelectedDevolucion(devolucion);
  };

  const cerrarDetalles = () => {
    setSelectedDevolucion(null);
  };

  // Renderizado de tabla
  const renderTabla = (items) => (
    <table className="tabla">
      <thead>
        <tr>
          <th>Número de nota</th> 
          <th>Fecha devolución</th>
          <th>Cliente</th>
          <th>Vendedor</th>
          <th>Empresa</th>
          <th>Tipo cliente</th>
          <th>Motivo</th>
          <th>Días diferencia</th>
          <th>Dentro plazo</th>
          <th>Días transcurridos</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {items.map((dev) => (
          <tr key={dev.id} className={`estado-${dev.estado_actual}`}>
            <td data-label="Número de nota">
              <span className="td-content">{dev.numero_nota || "-"}</span>
            </td>
            <td data-label="Fecha devolución">
              <span className="td-content">{convertirSoloFechaCDMX(dev.fecha_devolucion)}</span>
            </td>
            <td data-label="Cliente">
              <span className="td-content">{dev.cliente}</span>
            </td>
            <td data-label="Vendedor">
              <span className="td-content">{dev.vendedor_nombre || "-"}</span>
            </td>
            <td data-label="Empresa">
              <span className="td-content">{dev.empresa}</span>
            </td>
            <td data-label="Tipo cliente">
              <span className="td-content">{dev.tipo_cliente}</span>
            </td>
            <td data-label="Motivo">
              <span className="td-content">{dev.motivo_devolucion_general}</span>
            </td>
            <td data-label="Días diferencia">
              <span className="td-content">{dev.dias_diferencia ?? "-"}</span>
            </td>
            <td data-label="Dentro plazo">
              <span className="td-content">
                {dev.dentro_plazo === null
                  ? "-"
                  : dev.dentro_plazo
                  ? "✅ Sí"
                  : "❌ No"}
              </span>
            </td>
            <td data-label="Días transcurridos">
              <span className="td-content">{dev.dias_transcurridos ?? "-"}</span>
            </td>
            <td data-label="Estado">
              <span className={`badge-estado ${dev.estado_actual}`}>
                {dev.estado_actual}
              </span>
            </td>
            <td data-label="Acciones">
              <button className="btn-ver" onClick={() => abrirDetalles(dev)}>
                <Eye size={18} color="currentColor" /> 
                <span>Ver detalles</span>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="tabla-container">
      {/* Header con información */}
      <div style={{ 
        marginBottom: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <h2 className="tabla-titulo">
          {showSearchResults 
            ? `Resultados de búsqueda (${dataParaMostrar.length})` 
            : `Todas las Devoluciones (${dataParaMostrar.length}${!hasMore ? '' : '+'})`}
        </h2>
        
        {showSearchResults && searchTerm && (
          <span style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            background: '#f3f4f6',
            padding: '0.5rem 1rem',
            borderRadius: '6px'
          }}>
            Buscando: <strong>{searchTerm}</strong>
          </span>
        )}
      </div>

      {/* Tabla con datos */}
      {dataParaMostrar.length === 0 && !isLoading ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          {showSearchResults 
            ? `No se encontraron resultados para "${searchTerm}"` 
            : 'No hay devoluciones registradas.'}
        </p>
      ) : (
        <>
          <div className="tabla-scroll">
            {renderTabla(dataParaMostrar)}
          </div>

          {/* 🆕 Loader y trigger para infinite scroll */}
          <div 
            ref={observerTarget}
            style={{ 
              padding: '2rem', 
              textAlign: 'center',
              minHeight: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading && (
              <>
                <Loader 
                  size={24} 
                  color="#3b82f6" 
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Cargando más devoluciones...
                </p>
              </>
            )}
            
            {!hasMoreData && dataParaMostrar.length > 0 && (
              <p style={{ 
                color: '#10b981', 
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                ✓ Todos los registros cargados ({dataParaMostrar.length} total)
              </p>
            )}
          </div>
        </>
      )}

      {selectedDevolucion && (
        <ModalDetalles devolucion={selectedDevolucion} onClose={cerrarDetalles} />
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TablaDevoluciones;

/* ----------------------------------------- */
/*              Modal Detalles               */
/* ----------------------------------------- */
const ModalDetalles = ({ devolucion, onClose }) => {
  const [seguimiento, setSeguimiento] = useState([]);
  const [loadingSeguimiento, setLoadingSeguimiento] = useState(true);

  React.useEffect(() => {
    const fetchSeguimiento = async () => {
      setLoadingSeguimiento(true);
      const { data, error } = await supabase
        .from("devoluciones_seguimiento")
        .select("*")
        .eq("devolucion_id", devolucion.id)
        .order("fecha_cambio", { ascending: false });

      if (error) {
        console.error("❌ Error cargando seguimiento:", error);
      } else {
        setSeguimiento(data);
      }
      setLoadingSeguimiento(false);
    };

    fetchSeguimiento();
  }, [devolucion.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <header className={`modal-header ${devolucion.estado_actual}`}>
          <h2>Detalles de Devolución</h2>
          <button className="btn-cerrar" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          {/* Información general */}
          <section className="bloque">
            <h3>Información general</h3>
            <ul className="lista-info">
              <li><strong>ID:</strong> {devolucion.id}</li>
              <li><strong>Empresa:</strong> {devolucion.empresa}</li>
              <li><strong>Cliente:</strong> {devolucion.cliente}</li>
              <li><strong>Vendedor:</strong> {devolucion.vendedor_nombre || "No asignado"}</li>
              <li><strong>Tipo cliente:</strong> {devolucion.tipo_cliente}</li>
              <li><strong>Fecha remisión:</strong> {devolucion.fecha_remision}</li>
              <li><strong>Fecha devolución:</strong> {devolucion.fecha_devolucion}</li>
              <li><strong>Motivo:</strong> {devolucion.motivo_devolucion_general}</li>
              <li>
                <strong>Estado actual:</strong>{" "}
                <span className={`badge-estado ${devolucion.estado_actual}`}>
                  {devolucion.estado_actual}
                </span>
              </li>
              <li><strong>Proceso en:</strong> {devolucion.proceso_en}</li>
              <li><strong>Plazo máximo:</strong> {devolucion.plazo_maximo} días</li>
              <li>
                <strong>Días entre remisión y devolución:</strong>{" "}
                {devolucion.dias_diferencia ?? "—"}
              </li>
              <li>
                <strong>Dentro del plazo:</strong>{" "}
                {devolucion.dentro_plazo === null
                  ? "—"
                  : devolucion.dentro_plazo
                  ? "✅ Sí"
                  : "❌ No"}
              </li>
              <li>
                <strong>Días transcurridos:</strong>{" "}
                {devolucion.dias_transcurridos ?? "—"}
              </li>
              <li>
                <strong>Registrado en sistema:</strong>{" "}
                {convertirAHoraCDMX(devolucion.created_at)}
              </li>
              <li>
                <strong>Última actualización:</strong>{" "}
                {convertirAHoraCDMX(devolucion.updated_at)}
              </li>
              {devolucion.fecha_registro_almacen && (
                <li>
                  <strong>Registro en almacén:</strong>{" "}
                  {convertirAHoraCDMX(devolucion.fecha_registro_almacen)}
                </li>
              )}
              {devolucion.fecha_registrada_pnv && (
                <li>
                  <strong>Registrada en PNV:</strong>{" "}
                  {convertirAHoraCDMX(devolucion.fecha_registrada_pnv)}
                </li>
              )}
            </ul>
          </section>

          {/* Productos */}
          <section className="bloque">
            <h3>Productos devueltos</h3>
            {devolucion.devoluciones_detalle?.length === 0 ? (
              <p>No hay productos asociados.</p>
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Concepto / Sustancia</th>
                    <th>Cantidad</th>
                    <th>Estado</th>
                    <th>Motivo</th>
                    <th>Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {devolucion.devoluciones_detalle.map((p, i) => (
                    <tr key={p.id || i}>
                      <td data-label="#">{i + 1}</td>
                      <td data-label="Concepto / Sustancia">{p.concepto_sustancia}</td>
                      <td data-label="Cantidad">{p.cantidad}</td>
                      <td data-label="Estado">{p.estado_producto}</td>
                      <td data-label="Motivo">{p.motivo_devolucion_producto}</td>
                      <td data-label="Comentarios">{p.comentarios || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Seguimiento */}
          <section className="bloque">
            <h3>
              <Clock size={16} color="#3b82f6" /> Historial de Seguimiento
            </h3>
            {loadingSeguimiento ? (
              <p>Cargando historial...</p>
            ) : seguimiento.length === 0 ? (
              <p>No hay movimientos registrados.</p>
            ) : (
              <div className="seguimiento-lista">
                {seguimiento.map((s, i) => (
                  <div key={s.id} className="seguimiento-card">
                    <div className="seguimiento-header">
                      <span className="seguimiento-numero">#{seguimiento.length - i}</span>
                      <span className="seguimiento-fecha">{convertirAHoraCDMX(s.fecha_cambio)}</span>
                    </div>

                    <div className="seguimiento-body">
                      <div className="seguimiento-row">
                        <div className="seguimiento-field">
                          <span className="field-label">Área</span>
                          <span className="field-value badge-area">{s.area}</span>
                        </div>
                        <div className="seguimiento-field">
                          <span className="field-label">Acción</span>
                          <span className="field-value badge-accion">{s.accion}</span>
                        </div>
                      </div>

                      <div className="seguimiento-row">
                        <div className="seguimiento-field">
                          <span className="field-label">Cambio por</span>
                          <span className="field-value">{s.cambiado_por}</span>
                        </div>
                      </div>

                      {(s.estado_anterior || s.estado_nuevo) && (
                        <div className="seguimiento-cambio">
                          <span className="cambio-label">Estado:</span>
                          <div className="cambio-flujo">
                            {s.estado_anterior && (
                              <span className={`badge-estado ${s.estado_anterior}`}>
                                {s.estado_anterior}
                              </span>
                            )}
                            {s.estado_anterior && s.estado_nuevo && (
                              <span className="cambio-flecha">→</span>
                            )}
                            <span className={`badge-estado ${s.estado_nuevo}`}>
                              {s.estado_nuevo}
                            </span>
                          </div>
                        </div>
                      )}

                      {(s.proceso_anterior || s.proceso_nuevo) && (
                        <div className="seguimiento-cambio">
                          <span className="cambio-label">Proceso:</span>
                          <div className="cambio-flujo">
                            {s.proceso_anterior && (
                              <span className="badge-proceso">{s.proceso_anterior}</span>
                            )}
                            {s.proceso_anterior && s.proceso_nuevo && (
                              <span className="cambio-flecha">→</span>
                            )}
                            <span className="badge-proceso">{s.proceso_nuevo}</span>
                          </div>
                        </div>
                      )}

                      {s.motivo && (
                        <div className="seguimiento-field full-width">
                          <span className="field-label">Motivo</span>
                          <span className="field-value">{s.motivo}</span>
                        </div>
                      )}

                      {s.observaciones && (
                        <div className="seguimiento-field full-width">
                          <span className="field-label">Observaciones</span>
                          <span className="field-value">{s.observaciones}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};