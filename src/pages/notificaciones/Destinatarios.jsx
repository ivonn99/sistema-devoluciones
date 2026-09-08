import { useState, useEffect, useMemo } from 'react';
import { Mail, MailPlus, Search, Filter, Edit2, Power, Trash2, Info, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import useDestinatariosStore, { PROCESOS_NOTIFICABLES, getProcesoInfo } from '../../stores/destinatariosStore';
import DestinatarioModal from './DestinatarioModal';
import NotificacionesTabs from './NotificacionesTabs';
import './destinatarios.css';

const Destinatarios = () => {
  const { destinatarios, loading, fetchDestinatarios, toggleActivo, deleteDestinatario } = useDestinatariosStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [destinatarioEdit, setDestinatarioEdit] = useState(null);
  const [procesoInicial, setProcesoInicial] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    fetchDestinatarios();
  }, []);

  const destinatariosFiltrados = useMemo(() => {
    return destinatarios.filter(destinatario => {
      const texto = busqueda.toLowerCase();
      const cumpleBusqueda =
        destinatario.email.toLowerCase().includes(texto) ||
        (destinatario.nombre || '').toLowerCase().includes(texto);

      const cumpleProceso = filtroProceso === 'todos' || destinatario.proceso === filtroProceso;
      const cumpleEstado = filtroEstado === 'todos' ||
        (filtroEstado === 'activo' && destinatario.activo) ||
        (filtroEstado === 'inactivo' && !destinatario.activo);

      return cumpleBusqueda && cumpleProceso && cumpleEstado;
    });
  }, [destinatarios, busqueda, filtroProceso, filtroEstado]);

  // Un proceso sin destinatarios activos sigue notificando por rol (respaldo)
  const resumenPorProceso = useMemo(() =>
    PROCESOS_NOTIFICABLES.map(proceso => ({
      ...proceso,
      activos: destinatarios.filter(d => d.proceso === proceso.value && d.activo).length
    })),
  [destinatarios]);

  const procesosEnRespaldo = resumenPorProceso.filter(p => p.activos === 0);

  const handleNuevoDestinatario = (proceso = '') => {
    setDestinatarioEdit(null);
    setProcesoInicial(proceso);
    setModalOpen(true);
  };

  const handleEditarDestinatario = (destinatario) => {
    setDestinatarioEdit(destinatario);
    setProcesoInicial('');
    setModalOpen(true);
  };

  const handleToggleEstado = async (destinatario) => {
    const result = await toggleActivo(destinatario.id, !destinatario.activo);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: destinatario.activo ? 'Destinatario Silenciado' : 'Destinatario Activado',
        text: destinatario.activo
          ? `"${destinatario.email}" ya no recibirá notificaciones.`
          : `"${destinatario.email}" volverá a recibir notificaciones.`,
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al cambiar el estado del destinatario.',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleEliminar = async (destinatario) => {
    const confirmacion = await Swal.fire({
      title: 'Eliminar Destinatario',
      text: `¿Está seguro de eliminar a "${destinatario.email}" de las notificaciones de ${getProcesoInfo(destinatario.proceso).label}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!confirmacion.isConfirmed) return;

    const result = await deleteDestinatario(destinatario.id);

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Destinatario Eliminado',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al eliminar el destinatario.',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  if (loading && destinatarios.length === 0) {
    return <div className="text-center py-5 text-muted">Cargando destinatarios...</div>;
  }

  return (
    <div className="container-fluid py-4">
      <NotificacionesTabs />

      {/* Header */}
      <div className="card border-primary mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <Mail size={32} />
              <div>
                <h1 className="h3 mb-0 fw-bold">Destinatarios de Notificaciones</h1>
                <p className="mb-0 opacity-75">Define a quién le llega el correo de cada proceso</p>
              </div>
            </div>
            <button className="btn btn-light d-flex align-items-center gap-2" onClick={() => handleNuevoDestinatario()}>
              <MailPlus size={20} />
              Nuevo Destinatario
            </button>
          </div>
        </div>
      </div>

      {/* Explicación del respaldo por rol */}
      <div className="alert alert-info d-flex align-items-start gap-2 mb-4">
        <Info size={20} className="flex-shrink-0 mt-1" />
        <div>
          <strong>Cómo funciona:</strong> cuando una devolución cambia de proceso, el correo se envía a los
          destinatarios activos de ese proceso. Si un proceso no tiene ninguno, el sistema sigue enviando a los
          usuarios que tengan el rol correspondiente, tal como lo hacía antes.
        </div>
      </div>

      {/* Resumen por proceso */}
      <div className="row g-3 mb-4">
        {resumenPorProceso.map(proceso => (
          <div key={proceso.value} className="col-12 col-lg-4">
            <div className={`card hover-lift ${proceso.activos === 0 ? 'border-warning' : 'border-primary'}`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <span className={`badge ${proceso.badge}`}>{proceso.label}</span>
                  <button
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    onClick={() => handleNuevoDestinatario(proceso.value)}
                    title={`Agregar destinatario a ${proceso.label}`}
                  >
                    <MailPlus size={14} />
                    Agregar
                  </button>
                </div>
                {proceso.activos === 0 ? (
                  <div className="d-flex align-items-center gap-2 text-warning">
                    <AlertTriangle size={20} />
                    <small>Sin destinatarios: se notifica al rol <strong>{proceso.rolFallback}</strong></small>
                  </div>
                ) : (
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="h4 mb-0 fw-bold text-primary">{proceso.activos}</span>
                    <small className="text-muted">
                      {proceso.activos === 1 ? 'destinatario activo' : 'destinatarios activos'}
                    </small>
                  </div>
                )}
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
                  placeholder="Buscar por correo o nombre..."
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
                Estado
              </label>
              <select className="form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Silenciados</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de destinatarios */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Correo</th>
                  <th>Nombre</th>
                  <th>Proceso</th>
                  <th>Estado</th>
                  <th>Fecha Alta</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {destinatariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      {destinatarios.length === 0
                        ? 'Aún no hay destinatarios configurados. Las notificaciones se envían por rol.'
                        : 'No se encontraron destinatarios con esos filtros'}
                    </td>
                  </tr>
                ) : (
                  destinatariosFiltrados.map(destinatario => (
                    <tr key={destinatario.id} className={!destinatario.activo ? 'opacity-50' : ''}>
                      <td className="fw-semibold">
                        <span className="d-flex align-items-center gap-2">
                          <Mail size={14} className="text-primary" />
                          {destinatario.email}
                        </span>
                      </td>
                      <td>
                        {destinatario.nombre || <span className="text-muted small">Sin nombre</span>}
                      </td>
                      <td>
                        <span className={`badge ${getProcesoInfo(destinatario.proceso).badge}`}>
                          {getProcesoInfo(destinatario.proceso).label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${destinatario.activo ? 'bg-success' : 'bg-secondary'}`}>
                          {destinatario.activo ? 'Activo' : 'Silenciado'}
                        </span>
                      </td>
                      <td>
                        {destinatario.created_at
                          ? new Date(destinatario.created_at).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '-'}
                      </td>
                      <td className="text-center">
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditarDestinatario(destinatario)}
                            title="Editar destinatario"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className={`btn btn-sm ${destinatario.activo ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleEstado(destinatario)}
                            title={destinatario.activo ? 'Silenciar' : 'Activar'}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleEliminar(destinatario)}
                            title="Eliminar destinatario"
                          >
                            <Trash2 size={16} />
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
        <DestinatarioModal
          destinatario={destinatarioEdit}
          procesoInicial={procesoInicial}
          onClose={() => setModalOpen(false)}
        />
      )}

      {procesosEnRespaldo.length > 0 && destinatarios.length > 0 && (
        <p className="text-muted small mt-3 mb-0">
          Procesos que aún notifican por rol: {procesosEnRespaldo.map(p => p.label).join(', ')}.
        </p>
      )}
    </div>
  );
};

export default Destinatarios;
