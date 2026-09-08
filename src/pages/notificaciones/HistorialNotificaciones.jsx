import { useState, useEffect, useMemo } from 'react';
import { History, RefreshCw, Search, Filter, Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import useNotificacionesLogStore from '../../stores/notificacionesLogStore';
import { PROCESOS_NOTIFICABLES, getProcesoInfo } from '../../stores/destinatariosStore';
import { reenviarNotificacion } from '../../utils/emailServiceSimple';
import NotificacionesTabs from './NotificacionesTabs';
import './destinatarios.css';

const HistorialNotificaciones = () => {
  const { logs, loading, tablaDisponible, fetchLogs } = useNotificacionesLogStore();

  const [busqueda, setBusqueda] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('todos');
  const [filtroResultado, setFiltroResultado] = useState('todos');
  const [reenviando, setReenviando] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      const texto = busqueda.toLowerCase();
      const cumpleBusqueda =
        (log.numero_nota || '').toLowerCase().includes(texto) ||
        (log.destinatarios || '').toLowerCase().includes(texto) ||
        (log.usuario || '').toLowerCase().includes(texto);

      const cumpleProceso = filtroProceso === 'todos' || log.proceso === filtroProceso;
      const cumpleResultado = filtroResultado === 'todos' ||
        (filtroResultado === 'exito' && log.exito) ||
        (filtroResultado === 'fallido' && !log.exito);

      return cumpleBusqueda && cumpleProceso && cumpleResultado;
    });
  }, [logs, busqueda, filtroProceso, filtroResultado]);

  const estadisticas = useMemo(() => ({
    total: logs.length,
    exitosos: logs.filter(l => l.exito).length,
    fallidos: logs.filter(l => !l.exito).length
  }), [logs]);

  const handleReenviar = async (log) => {
    const confirmacion = await Swal.fire({
      title: 'Reenviar Notificación',
      html: `Se enviará de nuevo el correo de la nota <strong>${log.numero_nota || log.devolucion_id}</strong> a:<br><small>${log.destinatarios}</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, reenviar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!confirmacion.isConfirmed) return;

    setReenviando(log.id);
    const result = await reenviarNotificacion(log);
    setReenviando(null);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Correo Reenviado',
        timer: 2000,
        showConfirmButton: false
      });
      fetchLogs();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo reenviar',
        text: result.error,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleVerError = (log) => {
    Swal.fire({
      icon: 'info',
      title: 'Detalle del envío',
      html: `
        <div class="text-start">
          <p class="mb-1"><strong>Nota:</strong> ${log.numero_nota || log.devolucion_id || 'N/A'}</p>
          <p class="mb-1"><strong>Proceso:</strong> ${getProcesoInfo(log.proceso).label}</p>
          <p class="mb-1"><strong>Destinatarios:</strong> ${log.destinatarios || 'Ninguno'}</p>
          <p class="mb-1"><strong>Origen:</strong> ${log.origen === 'panel' ? 'Destinatarios configurados' : 'Respaldo por rol'}</p>
          <p class="mb-0"><strong>Motivo:</strong> ${log.error || 'Sin detalle'}</p>
        </div>
      `,
      confirmButtonColor: '#0d6efd'
    });
  };

  if (!tablaDisponible) {
    return (
      <div className="container-fluid py-4">
        <NotificacionesTabs />
        <div className="alert alert-warning d-flex align-items-start gap-2">
          <AlertCircle size={20} className="flex-shrink-0 mt-1" />
          <div>
            <strong>Falta crear la tabla del historial.</strong> Ejecuta el archivo{' '}
            <code>supabase/migrations/create_notificaciones_log.sql</code> en el SQL Editor de Supabase
            y vuelve a entrar a esta pantalla.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <NotificacionesTabs />

      {/* Header */}
      <div className="card border-primary mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <History size={32} />
              <div>
                <h1 className="h3 mb-0 fw-bold">Historial de Envíos</h1>
                <p className="mb-0 opacity-75">Últimos correos enviados por el sistema</p>
              </div>
            </div>
            <button
              className="btn btn-light d-flex align-items-center gap-2"
              onClick={() => fetchLogs()}
              disabled={loading}
            >
              <RefreshCw size={20} className={loading ? 'spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="card border-primary hover-lift">
            <div className="card-body d-flex align-items-center gap-3">
              <History size={32} className="text-primary" />
              <div>
                <div className="h4 mb-0 fw-bold text-primary">{estadisticas.total}</div>
                <small className="text-muted">Envíos registrados</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="card border-success hover-lift">
            <div className="card-body d-flex align-items-center gap-3">
              <CheckCircle2 size={32} className="text-success" />
              <div>
                <div className="h4 mb-0 fw-bold text-success">{estadisticas.exitosos}</div>
                <small className="text-muted">Enviados</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="card border-danger hover-lift">
            <div className="card-body d-flex align-items-center gap-3">
              <XCircle size={32} className="text-danger" />
              <div>
                <div className="h4 mb-0 fw-bold text-danger">{estadisticas.fallidos}</div>
                <small className="text-muted">Con problema</small>
              </div>
            </div>
          </div>
        </div>
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
                  placeholder="Buscar por nota, correo o usuario..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Filter size={16} />
                Proceso
              </label>
              <select className="form-select" value={filtroProceso} onChange={(e) => setFiltroProceso(e.target.value)}>
                <option value="todos">Todos los procesos</option>
                {PROCESOS_NOTIFICABLES.map(proceso => (
                  <option key={proceso.value} value={proceso.value}>{proceso.label}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Filter size={16} />
                Resultado
              </label>
              <select className="form-select" value={filtroResultado} onChange={(e) => setFiltroResultado(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="exito">Enviados</option>
                <option value="fallido">Con problema</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de envíos */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Nota</th>
                  <th>Proceso</th>
                  <th>Destinatarios</th>
                  <th>Origen</th>
                  <th>Usuario</th>
                  <th>Resultado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      {logs.length === 0
                        ? 'Todavía no hay envíos registrados'
                        : 'No se encontraron envíos con esos filtros'}
                    </td>
                  </tr>
                ) : (
                  logsFiltrados.map(log => (
                    <tr key={log.id}>
                      <td className="text-nowrap">
                        <small>
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString('es-MX', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </small>
                      </td>
                      <td className="fw-semibold">
                        {log.numero_nota || log.devolucion_id || '-'}
                        {log.reenvio && <span className="badge bg-info ms-2">Reenvío</span>}
                      </td>
                      <td>
                        <span className={`badge ${getProcesoInfo(log.proceso).badge}`}>
                          {getProcesoInfo(log.proceso).label}
                        </span>
                      </td>
                      <td>
                        {log.destinatarios ? (
                          <small className="text-break">{log.destinatarios}</small>
                        ) : (
                          <span className="text-muted small">Ninguno</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${log.origen === 'panel' ? 'bg-primary' : 'bg-secondary'}`}>
                          {log.origen === 'panel' ? 'Configurado' : 'Por rol'}
                        </span>
                      </td>
                      <td>
                        <small>{log.usuario || <span className="text-muted">-</span>}</small>
                      </td>
                      <td>
                        <span className={`badge ${log.exito ? 'bg-success' : 'bg-danger'}`}>
                          {log.exito ? 'Enviado' : 'Falló'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleVerError(log)}
                            title="Ver detalle"
                          >
                            <AlertCircle size={16} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleReenviar(log)}
                            disabled={!log.payload || reenviando === log.id}
                            title={log.payload ? 'Reenviar correo' : 'Este registro no tiene datos para reenviar'}
                          >
                            <Send size={16} />
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
    </div>
  );
};

export default HistorialNotificaciones;
