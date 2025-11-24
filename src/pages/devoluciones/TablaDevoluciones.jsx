import React, { useState, useEffect, useRef, useCallback } from "react";
import { Eye, Clock, FileText, TrendingUp, AlertCircle, CheckCircle, XCircle, Package } from "lucide-react";
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

  // Helper para obtener badge Bootstrap según estado
  const getEstadoBadge = (estado) => {
    const estadoMap = {
      'registrada': { class: 'bg-primary', text: 'Registrada' },
      'aprobada_almacen': { class: 'bg-info', text: 'Aprobada Almacén' },
      'requiere_correccion': { class: 'bg-warning text-dark', text: 'Requiere Corrección' },
      'requiere_autorizacion': { class: 'bg-danger', text: 'Requiere Autorización' },
      'autorizada': { class: 'bg-success', text: 'Autorizada' },
      'rechazada': { class: 'bg-danger', text: 'Rechazada' },
      'registrada_pnv': { class: 'bg-success', text: 'Registrada PNV' }
    };
    
    const estadoInfo = estadoMap[estado] || { class: 'bg-secondary', text: estado };
    return <span className={`badge ${estadoInfo.class}`}>{estadoInfo.text}</span>;
  };

  // Renderizado de tabla (desktop)
  const renderTabla = (items) => (
    <div className="table-responsive">
      <table className="table table-hover table-striped align-middle">
        <thead className="table-light">
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
            <th className="text-center">Acciones</th>
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
                {dev.dentro_plazo === null ? (
                  <span className="badge bg-secondary">N/A</span>
                ) : dev.dentro_plazo ? (
                  <span className="badge bg-success d-inline-flex align-items-center gap-1">
                    <CheckCircle size={12} />
                    Sí
                  </span>
                ) : (
                  <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                    <XCircle size={12} />
                    No
                  </span>
                )}
              </td>
              <td data-label="Días transcurridos">
                <span className="td-content">{dev.dias_transcurridos ?? "-"}</span>
              </td>
              <td data-label="Estado">
                {getEstadoBadge(dev.estado_actual)}
              </td>
              <td data-label="Acciones" className="text-center">
                <button 
                  className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1" 
                  onClick={() => abrirDetalles(dev)}
                  title="Ver detalles completos"
                >
                  <Eye size={16} /> 
                  <span className="d-none d-md-inline">Detalles</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Renderizado de cards (móvil/tablet)
  const renderCards = (items) => (
    <div className="cards-view">
      {items.map((dev) => (
        <div key={dev.id} className={`card-devolucion estado-${dev.estado_actual}`}>
          <div className="card-devolucion-header">
            <div>
              <div className="card-devolucion-id">#{dev.numero_nota || dev.id}</div>
              <div className="card-devolucion-cliente">{dev.cliente}</div>
            </div>
            <div className="card-devolucion-estado">
              {getEstadoBadge(dev.estado_actual)}
            </div>
          </div>
          
          <div className="card-devolucion-body">
            <div className="card-devolucion-field">
              <span className="card-devolucion-label">Fecha</span>
              <span className="card-devolucion-value">
                {convertirSoloFechaCDMX(dev.fecha_devolucion)}
              </span>
            </div>
            
            <div className="card-devolucion-field">
              <span className="card-devolucion-label">Vendedor</span>
              <span className="card-devolucion-value">
                {dev.vendedor_nombre || "-"}
              </span>
            </div>
            
            <div className="card-devolucion-field">
              <span className="card-devolucion-label">Empresa</span>
              <span className="card-devolucion-value">{dev.empresa}</span>
            </div>
            
            <div className="card-devolucion-field">
              <span className="card-devolucion-label">Tipo Cliente</span>
              <span className="card-devolucion-value">{dev.tipo_cliente}</span>
            </div>
            
            <div className="card-devolucion-field" style={{ gridColumn: '1 / -1' }}>
              <span className="card-devolucion-label">Motivo</span>
              <span className="card-devolucion-value">{dev.motivo_devolucion_general}</span>
            </div>
            
            <div className="card-devolucion-field">
              <span className="card-devolucion-label">Días Diferencia</span>
              <span className="card-devolucion-value">{dev.dias_diferencia ?? "-"}</span>
            </div>
            
            <div className="card-devolucion-field">
              <span className="card-devolucion-label">Días Transcurridos</span>
              <span className="card-devolucion-value">{dev.dias_transcurridos ?? "-"}</span>
            </div>
            
            <div className="card-devolucion-field" style={{ gridColumn: '1 / -1' }}>
              <span className="card-devolucion-label">Dentro Plazo</span>
              <div>
                {dev.dentro_plazo === null ? (
                  <span className="badge bg-secondary">N/A</span>
                ) : dev.dentro_plazo ? (
                  <span className="badge bg-success d-inline-flex align-items-center gap-1">
                    <CheckCircle size={12} />
                    Sí
                  </span>
                ) : (
                  <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                    <XCircle size={12} />
                    No
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="card-devolucion-footer">
            <button 
              className="btn btn-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2" 
              onClick={() => abrirDetalles(dev)}
            >
              <Eye size={16} /> 
              Ver Detalles Completos
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Calcular estadísticas rápidas
  const estadisticasRapidas = {
    total: dataParaMostrar.length,
    finalizadas: dataParaMostrar.filter(d => d.estado_actual === 'registrada_pnv').length,
    enProceso: dataParaMostrar.filter(d => d.proceso_en !== 'finalizado' && d.estado_actual !== 'registrada_pnv' && d.estado_actual !== 'rechazada').length,
    rechazadas: dataParaMostrar.filter(d => d.estado_actual === 'rechazada').length,
    conExcepcion: dataParaMostrar.filter(d => d.tipo_excepcion !== null).length
  };

  return (
    <div className="tabla-container">
      {/* Header mejorado con Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-6">
              <div className="d-flex align-items-center gap-3">
                <FileText size={28} className="text-primary" />
                <div>
                  <h2 className="h5 mb-0 fw-bold">
                    {showSearchResults
                      ? 'Resultados de Búsqueda'
                      : 'Todas las Devoluciones'}
                  </h2>
                  <small className="text-muted">
                    {dataParaMostrar.length} {dataParaMostrar.length === 1 ? 'registro' : 'registros'}
                    {!hasMoreData && dataParaMostrar.length > 0 ? ' (todos cargados)' : hasMoreData ? ' (mostrando algunos...)' : ''}
                  </small>
                </div>
              </div>
            </div>
            
            {showSearchResults && searchTerm && (
              <div className="col-12 col-md-6">
                <div className="d-flex align-items-center gap-2 justify-content-md-end">
                  <span className="badge bg-info fs-6 px-3 py-2">
                    Buscando: <strong>{searchTerm}</strong>
                  </span>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => window.location.reload()}
                    title="Limpiar búsqueda"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Estadísticas rápidas */}
            {!showSearchResults && dataParaMostrar.length > 0 && (
              <div className="col-12">
                <div className="row g-2">
                  <div className="col-6 col-md-auto">
                    <div className="d-flex align-items-center gap-2 text-primary">
                      <TrendingUp size={16} />
                      <small className="fw-semibold">{estadisticasRapidas.finalizadas} Finalizadas</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <div className="d-flex align-items-center gap-2 text-warning">
                      <Clock size={16} />
                      <small className="fw-semibold">{estadisticasRapidas.enProceso} En Proceso</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-auto">
                    <div className="d-flex align-items-center gap-2 text-danger">
                      <XCircle size={16} />
                      <small className="fw-semibold">{estadisticasRapidas.rechazadas} Rechazadas</small>
                    </div>
                  </div>
                  {estadisticasRapidas.conExcepcion > 0 && (
                    <div className="col-6 col-md-auto">
                      <div className="d-flex align-items-center gap-2 text-info">
                        <AlertCircle size={16} />
                        <small className="fw-semibold">{estadisticasRapidas.conExcepcion} Con Excepción</small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla con datos */}
      {dataParaMostrar.length === 0 && !isLoading ? (
        <div className="alert alert-info text-center py-5 mb-0">
          {showSearchResults
            ? `No se encontraron resultados para "${searchTerm}"`
            : 'No hay devoluciones registradas.'}
        </div>
      ) : (
        <>
          <div className="tabla-scroll">
            {renderTabla(dataParaMostrar)}
            {renderCards(dataParaMostrar)}
          </div>

          {/* 🆕 Loader y trigger para infinite scroll */}
          <div
            ref={observerTarget}
            className="d-flex flex-column align-items-center justify-content-center py-4 gap-2"
            style={{ minHeight: '60px' }}
          >
            {isLoading && (
              <div className="d-flex flex-column align-items-center gap-2">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted small mb-0">
                  Cargando más devoluciones...
                </p>
              </div>
            )}

            {!hasMoreData && dataParaMostrar.length > 0 && (
              <div className="alert alert-success mb-0 d-flex align-items-center gap-2">
                <CheckCircle size={18} />
                <span className="small mb-0">
                  Todos los registros cargados ({dataParaMostrar.length} total)
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {selectedDevolucion && (
        <ModalDetalles devolucion={selectedDevolucion} onClose={cerrarDetalles} />
      )}
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

  // Helper para obtener badge Bootstrap según estado
  const getEstadoBadge = (estado) => {
    const estadoMap = {
      'registrada': { class: 'bg-primary', text: 'Registrada' },
      'aprobada_almacen': { class: 'bg-info', text: 'Aprobada Almacén' },
      'requiere_correccion': { class: 'bg-warning text-dark', text: 'Requiere Corrección' },
      'requiere_autorizacion': { class: 'bg-danger', text: 'Requiere Autorización' },
      'autorizada': { class: 'bg-success', text: 'Autorizada' },
      'rechazada': { class: 'bg-danger', text: 'Rechazada' },
      'registrada_pnv': { class: 'bg-success', text: 'Registrada PNV' }
    };
    
    const estadoInfo = estadoMap[estado] || { class: 'bg-secondary', text: estado };
    return <span className={`badge ${estadoInfo.class}`}>{estadoInfo.text}</span>;
  };

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
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-dialog-scrollable modal-xl" onClick={(e) => e.stopPropagation()} role="document">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <div className="d-flex align-items-center gap-3">
              <FileText size={28} />
              <div>
                <h2 className="modal-title h4 mb-0 fw-bold">Detalles de Devolución</h2>
                <small className="opacity-75">Nota: {devolucion.numero_nota}</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Cerrar"></button>
          </div>

          <div className="modal-body">
          {/* Información general */}
          <section className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <FileText size={20} className="text-primary" />
              <h3 className="h5 mb-0 fw-bold">Información General</h3>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <ul className="list-unstyled mb-0">
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">ID:</strong>
                    <span className="badge bg-secondary">{devolucion.id}</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Empresa:</strong>
                    <span className="badge bg-primary">{devolucion.empresa}</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Cliente:</strong>
                    <span className="fw-semibold">{devolucion.cliente}</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Vendedor:</strong>
                    <span>{devolucion.vendedor_nombre || <span className="text-muted">No asignado</span>}</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Tipo cliente:</strong>
                    <span className="badge bg-info">{devolucion.tipo_cliente}</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Fecha remisión:</strong>
                    <span>{convertirSoloFechaCDMX(devolucion.fecha_remision)}</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Fecha devolución:</strong>
                    <span>{convertirSoloFechaCDMX(devolucion.fecha_devolucion)}</span>
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul className="list-unstyled mb-0">
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Estado actual:</strong>
                    {getEstadoBadge(devolucion.estado_actual)}
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Proceso en:</strong>
                    <span className="badge bg-secondary">{devolucion.proceso_en}</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Plazo máximo:</strong>
                    <span className="fw-semibold">{devolucion.plazo_maximo} días</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Días diferencia:</strong>
                    <span>{devolucion.dias_diferencia ?? "—"}</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Dentro del plazo:</strong>
                    {devolucion.dentro_plazo === null ? (
                      <span className="badge bg-secondary">N/A</span>
                    ) : devolucion.dentro_plazo ? (
                      <span className="badge bg-success d-inline-flex align-items-center gap-1">
                        <CheckCircle size={12} />
                        Sí
                      </span>
                    ) : (
                      <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                        <XCircle size={12} />
                        No
                      </span>
                    )}
                  </li>
                  <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                    <strong className="text-muted">Días transcurridos:</strong>
                    <span>{devolucion.dias_transcurridos ?? "—"}</span>
                  </li>
                  {devolucion.fecha_registro_almacen && (
                    <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                      <strong className="text-muted">Registro almacén:</strong>
                      <small className="text-muted">{convertirAHoraCDMX(devolucion.fecha_registro_almacen)}</small>
                    </li>
                  )}
                  {devolucion.fecha_registrada_pnv && (
                    <li className="d-flex justify-content-between align-items-start py-2 border-bottom">
                      <strong className="text-muted">Registrada PNV:</strong>
                      <small className="text-muted">{convertirAHoraCDMX(devolucion.fecha_registrada_pnv)}</small>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            {/* Motivo destacado */}
            <div className="alert alert-light border mt-3 mb-0">
              <strong className="text-muted d-block mb-1">Motivo de devolución:</strong>
              <p className="mb-0">{devolucion.motivo_devolucion_general}</p>
            </div>
          </section>

          {/* Productos */}
          <section className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <Package size={20} className="text-primary" />
                <h3 className="h5 mb-0 fw-bold">Productos Devueltos</h3>
              </div>
              <span className="badge bg-primary">
                {devolucion.devoluciones_detalle?.length || 0} producto{(devolucion.devoluciones_detalle?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            {!devolucion.devoluciones_detalle || devolucion.devoluciones_detalle.length === 0 ? (
              <div className="alert alert-info mb-0">
                <AlertCircle size={18} className="me-2" />
                No hay productos asociados a esta devolución.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Concepto / Sustancia</th>
                      <th className="text-center" style={{ width: '100px' }}>Cantidad</th>
                      <th className="text-center" style={{ width: '150px' }}>Estado</th>
                      <th>Motivo</th>
                      <th>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devolucion.devoluciones_detalle.map((p, i) => (
                      <tr key={p.id || i}>
                        <td>
                          <span className="badge bg-secondary">#{i + 1}</span>
                        </td>
                        <td>
                          <strong>{p.concepto_sustancia}</strong>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-info fs-6">{p.cantidad}</span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-warning text-dark">
                            {p.estado_producto?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <small>{p.motivo_devolucion_producto || "-"}</small>
                        </td>
                        <td>
                          <small className="text-muted">{p.comentarios || "-"}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Seguimiento */}
          <section className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <Clock size={20} className="text-primary" />
                <h3 className="h5 mb-0 fw-bold">Historial de Seguimiento</h3>
              </div>
              {seguimiento.length > 0 && (
                <span className="badge bg-primary">{seguimiento.length} movimiento{seguimiento.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            {loadingSeguimiento ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted small mt-2 mb-0">Cargando historial...</p>
              </div>
            ) : seguimiento.length === 0 ? (
              <div className="alert alert-info mb-0">
                <AlertCircle size={18} className="me-2" />
                No hay movimientos registrados en el historial.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {seguimiento.map((s, i) => (
                  <div key={s.id} className="card border">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center py-2">
                      <span className="badge bg-primary">#{seguimiento.length - i}</span>
                      <span className="text-muted small">{convertirAHoraCDMX(s.fecha_cambio)}</span>
                    </div>

                    <div className="card-body">
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <span className="d-block small text-uppercase fw-semibold text-muted mb-1">Área</span>
                          <span className="badge bg-info">{s.area}</span>
                        </div>
                        <div className="col-md-6">
                          <span className="d-block small text-uppercase fw-semibold text-muted mb-1">Acción</span>
                          <span className="badge bg-secondary">{s.accion}</span>
                        </div>
                      </div>

                      <div className="row g-3 mb-3">
                        <div className="col-12">
                          <span className="d-block small text-uppercase fw-semibold text-muted mb-1">Cambio por</span>
                          <span>{s.cambiado_por}</span>
                        </div>
                      </div>

                      {(s.estado_anterior || s.estado_nuevo) && (
                        <div className="p-2 bg-light rounded mb-3">
                          <span className="d-block small text-uppercase fw-semibold text-muted mb-2">Estado:</span>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            {s.estado_anterior && getEstadoBadge(s.estado_anterior)}
                            {s.estado_anterior && s.estado_nuevo && (
                              <span className="fw-bold text-muted">→</span>
                            )}
                            {s.estado_nuevo && getEstadoBadge(s.estado_nuevo)}
                          </div>
                        </div>
                      )}

                      {(s.proceso_anterior || s.proceso_nuevo) && (
                        <div className="p-2 bg-light rounded mb-3">
                          <span className="d-block small text-uppercase fw-semibold text-muted mb-2">Proceso:</span>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            {s.proceso_anterior && (
                              <span className="badge bg-secondary">{s.proceso_anterior}</span>
                            )}
                            {s.proceso_anterior && s.proceso_nuevo && (
                              <span className="fw-bold text-muted">→</span>
                            )}
                            <span className="badge bg-secondary">{s.proceso_nuevo}</span>
                          </div>
                        </div>
                      )}

                      {s.motivo && (
                        <div className="mb-3">
                          <span className="d-block small text-uppercase fw-semibold text-muted mb-1">Motivo</span>
                          <span>{s.motivo}</span>
                        </div>
                      )}

                      {s.observaciones && (
                        <div>
                          <span className="d-block small text-uppercase fw-semibold text-muted mb-1">Observaciones</span>
                          <span>{s.observaciones}</span>
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
    </div>
  );
};