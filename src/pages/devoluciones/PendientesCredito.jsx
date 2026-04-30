import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useDevolucionesStore from '../../stores/devolucionesStore';
import Swal from 'sweetalert2';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Package, 
  User, 
  Building2, 
  Clock, 
  AlertTriangle,
  Filter,
  RefreshCw
} from 'lucide-react';
import './PendientesCredito.css';

const PendientesCredito = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    devoluciones,
    loading,
    error,
    fetchDevoluciones,
    resetDevoluciones,
    aprobarYRegistrarPNV,
    updateEstado
  } = useDevolucionesStore();

  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionActual, setAccionActual] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [observacionesCredito, setObservacionesCredito] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');
  const [filtroExcepcion, setFiltroExcepcion] = useState('todas');

  useEffect(() => {
    resetDevoluciones(); // Limpiar estado previo del store
    cargarDevoluciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDevoluciones = async () => {
    await fetchDevoluciones({ proceso_en: 'credito' });
  };

  if (!user) {
    return (
      <div className="loading-container">
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2>Debes iniciar sesión para acceder a esta página</h2>
      </div>
    );
  }

  const devolucionesPendientes = devoluciones.filter(dev => 
    dev.proceso_en === 'credito' && 
    (dev.estado_actual === 'registrada' || dev.estado_actual === 'autorizada')
  ).filter(dev => {
    if (filtroEmpresa !== 'todas' && dev.empresa !== filtroEmpresa) return false;
    if (filtroExcepcion === 'excepcion' && dev.estado_actual !== 'autorizada') return false;
    if (filtroExcepcion === 'normal' && dev.estado_actual === 'autorizada') return false;
    return true;
  });

  const abrirModal = (devolucion, accion) => {
    setDevolucionSeleccionada(devolucion);
    setAccionActual(accion);
    setModalAbierto(true);
    setMotivo('');
    setObservacionesCredito('');
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDevolucionSeleccionada(null);
    setAccionActual(null);
    setMotivo('');
    setObservacionesCredito('');
  };

  const ejecutarAccion = async () => {
    if (!devolucionSeleccionada) return;

    const usuarioActual = user.username || 'credito_user';

    cerrarModal();

    Swal.fire({
      title: 'Procesando...',
      html: 'Por favor espera',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let resultado;

      if (accionActual === 'aprobar') {
        resultado = await aprobarYRegistrarPNV(
          devolucionSeleccionada.id,
          observacionesCredito,
          usuarioActual
        );

        if (resultado.success) {
          await Swal.fire({
            icon: 'success',
            title: '✅ Devolución Aprobada',
            html: `
              <div style="text-align: center;">
                <p style="font-size: 1.1em; margin-bottom: 10px;">
                  La devolución ha sido <strong>aprobada</strong> y registrada en PNV
                </p>
                <p style="color: #6b7280; font-size: 0.9em;">
                  Nota: ${devolucionSeleccionada.numero_nota}
                </p>
              </div>
            `,
            confirmButtonColor: '#10b981',
            timer: 3000,
            timerProgressBar: true
          });
          await cargarDevoluciones();
        } else {
          throw new Error(resultado.error || 'Error al aprobar');
        }

      } else if (accionActual === 'rechazar') {
        if (!motivo.trim()) {
          Swal.fire({
            icon: 'warning',
            title: '⚠️ Motivo requerido',
            text: 'Debes especificar el motivo del rechazo',
            confirmButtonColor: '#f59e0b'
          });
          return;
        }

        resultado = await updateEstado(
          devolucionSeleccionada.id,
          'rechazada',
          'finalizado',
          motivo,
          usuarioActual
        );

        if (resultado.success) {
          await Swal.fire({
            icon: 'error',
            title: '❌ Devolución Rechazada',
            html: `
              <div style="text-align: center;">
                <p style="font-size: 1.1em; margin-bottom: 10px;">
                  La devolución ha sido <strong>rechazada</strong>
                </p>
                <p style="color: #6b7280; font-size: 0.9em;">
                  Nota: ${devolucionSeleccionada.numero_nota}
                </p>
                <div style="background-color: #fee2e2; padding: 10px; border-radius: 4px; margin-top: 15px;">
                  <p style="color: #991b1b; font-size: 0.9em; margin: 0;">
                    <strong>Motivo:</strong> ${motivo}
                  </p>
                </div>
              </div>
            `,
            confirmButtonColor: '#ef4444'
          });
          await cargarDevoluciones();
        } else {
          throw new Error(resultado.error || 'Error al rechazar');
        }

      } else if (accionActual === 'correccion') {
        if (!motivo.trim()) {
          Swal.fire({
            icon: 'warning',
            title: '⚠️ Detalles requeridos',
            text: 'Debes especificar qué se debe corregir',
            confirmButtonColor: '#f59e0b'
          });
          return;
        }

        resultado = await updateEstado(
          devolucionSeleccionada.id,
          'requiere_correccion',
          'almacen',
          motivo,
          usuarioActual
        );

        if (resultado.success) {
          await Swal.fire({
            icon: 'info',
            title: '🔄 Corrección Solicitada',
            html: `
              <div style="text-align: center;">
                <p style="font-size: 1.1em; margin-bottom: 10px;">
                  Se ha enviado una <strong>solicitud de corrección</strong> a Almacén
                </p>
                <p style="color: #6b7280; font-size: 0.9em;">
                  Nota: ${devolucionSeleccionada.numero_nota}
                </p>
                <div style="background-color: #fef3c7; padding: 10px; border-radius: 4px; margin-top: 15px;">
                  <p style="color: #92400e; font-size: 0.9em; margin: 0;">
                    <strong>Detalles:</strong> ${motivo}
                  </p>
                </div>
              </div>
            `,
            confirmButtonColor: '#f59e0b'
          });
          await cargarDevoluciones();
        } else {
          throw new Error(resultado.error || 'Error al solicitar corrección');
        }
      }

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Ocurrió un error al procesar la solicitud',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const confirmarAccion = async () => {
    if (!devolucionSeleccionada) return;

    let tituloConfirmacion = '';
    let htmlConfirmacion = '';
    let iconoConfirmacion = 'question';
    let colorBoton = '#3b82f6';
    let textoBoton = 'Confirmar';

    if (accionActual === 'aprobar') {
      tituloConfirmacion = '¿Aprobar y Registrar en PNV?';
      htmlConfirmacion = `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;">Esta acción registrará la devolución en el sistema PNV</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📝 <strong>Nota:</strong> ${devolucionSeleccionada.numero_nota}</li>
            <li>👤 <strong>Cliente:</strong> ${devolucionSeleccionada.cliente}</li>
            <li>📦 <strong>Productos:</strong> ${devolucionSeleccionada.devoluciones_detalle?.length || 0}</li>
          </ul>
        </div>
      `;
      iconoConfirmacion = 'question';
      colorBoton = '#10b981';
      textoBoton = 'Sí, aprobar y registrar';
    } else if (accionActual === 'rechazar') {
      if (!motivo.trim()) {
        Swal.fire({
          icon: 'warning',
          title: '⚠️ Motivo requerido',
          text: 'Debes especificar el motivo del rechazo antes de continuar',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }
      tituloConfirmacion = '¿Rechazar Devolución?';
      htmlConfirmacion = `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px; color: #991b1b;">Esta acción rechazará permanentemente la devolución</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📝 <strong>Nota:</strong> ${devolucionSeleccionada.numero_nota}</li>
            <li>❌ <strong>Motivo:</strong> ${motivo}</li>
          </ul>
        </div>
      `;
      iconoConfirmacion = 'warning';
      colorBoton = '#ef4444';
      textoBoton = 'Sí, rechazar';
    } else if (accionActual === 'correccion') {
      if (!motivo.trim()) {
        Swal.fire({
          icon: 'warning',
          title: '⚠️ Detalles requeridos',
          text: 'Debes especificar qué se debe corregir antes de continuar',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }
      tituloConfirmacion = '¿Solicitar Corrección?';
      htmlConfirmacion = `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;">Se enviará una solicitud de corrección a Almacén</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📝 <strong>Nota:</strong> ${devolucionSeleccionada.numero_nota}</li>
            <li>🔄 <strong>Detalles:</strong> ${motivo}</li>
          </ul>
        </div>
      `;
      iconoConfirmacion = 'info';
      colorBoton = '#f59e0b';
      textoBoton = 'Sí, solicitar corrección';
    }

    const result = await Swal.fire({
      title: tituloConfirmacion,
      html: htmlConfirmacion,
      icon: iconoConfirmacion,
      showCancelButton: true,
      confirmButtonColor: colorBoton,
      cancelButtonColor: '#6b7280',
      confirmButtonText: textoBoton,
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      await ejecutarAccion();
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="card border-primary mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <FileText size={32} />
              <div>
                <h1 className="h3 mb-1 fw-bold">Pendientes Crédito y Cobranza</h1>
                <p className="mb-0 opacity-75">Valida la situación crediticia y registra en PNV</p>
              </div>
            </div>
            <div className="text-center bg-white bg-opacity-50 rounded p-3">
              <div className="display-4 fw-bold text-dark">{devolucionesPendientes.length}</div>
              <div className="small fw-semibold">Pendientes</div>
            </div>
          </div>
        </div>
        <div className="card-body bg-light">
          {/* Filtros */}
          <div className="row g-3 align-items-end">
            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Filter size={20} />
                Empresa
              </label>
              <select
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="form-select"
              >
                <option value="todas">Todas las empresas</option>
                <option value="Distribuidora">Distribuidora</option>
                <option value="Rodrigo">Rodrigo</option>
              </select>
            </div>
            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold">Tipo</label>
              <select
                value={filtroExcepcion}
                onChange={(e) => setFiltroExcepcion(e.target.value)}
                className="form-select"
              >
                <option value="todas">Todas</option>
                <option value="normal">Flujo Normal</option>
                <option value="excepcion">Excepciones Autorizadas</option>
              </select>
            </div>
            <div className="col-md-12 col-lg-2">
              <button
                onClick={cargarDevoluciones}
                disabled={loading}
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <RefreshCw size={16} className={loading ? 'spinner-border spinner-border-sm' : ''} />
                Recargar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-3 mb-4">
          <AlertCircle size={24} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading / Empty / List */}
      {loading && devolucionesPendientes.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mb-0">Cargando devoluciones...</p>
          </div>
        </div>
      ) : devolucionesPendientes.length === 0 ? (
        <div className="card border-success">
          <div className="card-body text-center py-5">
            <CheckCircle size={64} className="text-success mb-3" />
            <h3 className="h4 mb-2">¡Todo al día!</h3>
            <p className="text-muted mb-0">No hay devoluciones pendientes de validación</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {devolucionesPendientes.map((dev) => (
            <div key={dev.id} className="col-12">
              <DevolucionCard
                devolucion={dev}
                onAprobar={() => abrirModal(dev, 'aprobar')}
                onRechazar={() => abrirModal(dev, 'rechazar')}
                onCorreccion={() => abrirModal(dev, 'correccion')}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAbierto && devolucionSeleccionada && (
        <ModalAccion
          devolucion={devolucionSeleccionada}
          accion={accionActual}
          motivo={motivo}
          setMotivo={setMotivo}
          observacionesCredito={observacionesCredito}
          setObservacionesCredito={setObservacionesCredito}
          onConfirmar={confirmarAccion}
          onCerrar={cerrarModal}
        />
      )}
    </div>
  );
};

// Componente Card de Devolución
const DevolucionCard = ({ devolucion, onAprobar, onRechazar, onCorreccion }) => {
  const esExcepcion = devolucion.estado_actual === 'autorizada';
  const esFueraPlazo = devolucion.tipo_excepcion === 'fuera_plazo';

  return (
    <div className="card border-0 shadow-sm">
      {/* Alerta de Excepción */}
      {esExcepcion && (
        <div className={`alert ${esFueraPlazo ? 'alert-warning' : 'alert-danger'} border-start border-4 mb-0 rounded-top rounded-bottom-0`}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <AlertTriangle
              style={{ color: esFueraPlazo ? '#ea580c' : '#dc2626' }}
              size={20}
            />
            <span className="fw-bold">
              {esFueraPlazo
                ? `⚠️ EXCEPCIÓN: Fuera de plazo (${devolucion.dias_diferencia} días, máx ${devolucion.plazo_maximo})`
                : '🚫 EXCEPCIÓN: Producto NO devolvible'
              }
            </span>
            <span className="badge bg-success ms-auto">
              ✓ Autorizada por Administración
            </span>
          </div>
          {devolucion.motivo_autorizacion && (
            <p className="mb-0 small">
              <strong>Motivo autorización:</strong> {devolucion.motivo_autorizacion}
            </p>
          )}
        </div>
      )}

      <div className="card-body">
        {/* Info Principal */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2 text-muted mb-2">
              <FileText size={16} />
              <span className="fw-semibold">Nota de Venta</span>
            </div>
            <div className="h5 mb-2">{devolucion.numero_nota}</div>
            <span className="badge bg-primary">{devolucion.empresa}</span>
          </div>

          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2 text-muted mb-2">
              <Building2 size={16} />
              <span className="fw-semibold">Cliente</span>
            </div>
            <div className="fw-bold mb-2">{devolucion.cliente}</div>
            <div className="text-muted small d-flex align-items-center gap-1">
              <User size={14} />
              {devolucion.vendedor_nombre}
            </div>
          </div>

          <div className="col-md-4">
            <div className="d-flex align-items-center gap-2 text-muted mb-2">
              <Calendar size={16} />
              <span className="fw-semibold">Fechas</span>
            </div>
            <div className="small">
              <div>Remisión: {new Date(devolucion.fecha_remision).toLocaleDateString('es-MX')}</div>
              <div>Devolución: {new Date(devolucion.fecha_devolucion).toLocaleDateString('es-MX')}</div>
              <div className={`badge mt-1 ${devolucion.dias_diferencia <= devolucion.plazo_maximo ? 'bg-success' : 'bg-danger'}`}>
                {devolucion.dias_diferencia} días ({devolucion.tipo_cliente})
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2 fw-semibold">
              <Package size={18} />
              Productos Devueltos
            </div>
            <span className={`badge ${devolucion.tipo_devolucion === 'total' ? 'bg-danger' : 'bg-warning'}`}>
              {devolucion.tipo_devolucion === 'total' ? 'DEVOLUCIÓN TOTAL' : 'DEVOLUCIÓN PARCIAL'}
            </span>
          </div>
          <div className="d-flex flex-column gap-2">
            {devolucion.devoluciones_detalle?.map((prod, idx) => (
              <div key={`${prod.concepto_sustancia || 'producto'}-${prod.cantidad || 0}-${idx}`} className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                <div>
                  <div className="fw-medium">{prod.concepto_sustancia}</div>
                  <small className="text-muted">Estado: {prod.estado_producto}</small>
                </div>
                <span className="badge bg-secondary">x{prod.cantidad}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Observaciones */}
        {devolucion.observaciones_almacen && (
          <div className="alert alert-primary mb-4">
            <div className="fw-semibold mb-1">📝 Observaciones de Almacén:</div>
            <div className="small">{devolucion.observaciones_almacen}</div>
          </div>
        )}

        {/* Motivo */}
        <div className="p-3 bg-light rounded mb-4">
          <strong>Motivo:</strong> {devolucion.motivo_devolucion_general}
        </div>

        {/* Acciones */}
        <div className="d-flex gap-2 flex-wrap">
          <button
            onClick={onAprobar}
            className="btn btn-success flex-grow-1 d-flex align-items-center justify-content-center gap-2"
          >
            <CheckCircle size={20} />
            Aprobar y Registrar en PNV
          </button>
          <button
            onClick={onRechazar}
            className="btn btn-danger d-flex align-items-center gap-2"
          >
            <XCircle size={20} />
            Rechazar
          </button>
          <button
            onClick={onCorreccion}
            className="btn btn-warning d-flex align-items-center gap-2"
          >
            <AlertCircle size={20} />
            Solicitar Corrección
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Modal
const ModalAccion = ({
  devolucion,
  accion,
  motivo,
  setMotivo,
  observacionesCredito,
  setObservacionesCredito,
  onConfirmar,
  onCerrar
}) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCerrar();
    }
  };

  const getTitleAndIcon = () => {
    switch (accion) {
      case 'aprobar':
        return { icon: <CheckCircle size={24} />, text: 'Aprobar y Registrar en PNV' };
      case 'rechazar':
        return { icon: <XCircle size={24} />, text: 'Rechazar Devolución' };
      case 'correccion':
        return { icon: <AlertCircle size={24} />, text: 'Solicitar Corrección' };
      default:
        return { icon: null, text: '' };
    }
  };

  const { icon, text } = getTitleAndIcon();

  const getHeaderColor = () => {
    switch (accion) {
      case 'aprobar': return 'bg-success';
      case 'rechazar': return 'bg-danger';
      case 'correccion': return 'bg-warning';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={handleOverlayClick} tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className={`modal-header ${getHeaderColor()} text-white`}>
            <h2 className="modal-title d-flex align-items-center gap-2 mb-0 h4 fw-bold">
              {icon}
              {text}
            </h2>
            <button onClick={onCerrar} className="btn-close btn-close-white" type="button"></button>
          </div>

          <div className="modal-body">
          {/* Info Box */}
          <div className="alert alert-secondary mb-4">
            <div className="fw-bold mb-2">Nota: {devolucion.numero_nota}</div>
            <div className="small">Cliente: {devolucion.cliente}</div>
            <div className="small">Vendedor: {devolucion.vendedor_nombre}</div>
          </div>

          {/* Aprobar */}
          {accion === 'aprobar' && (
            <div className="mb-4">
              <label className="form-label fw-semibold">
                Observaciones de Crédito (opcional):
              </label>
              <textarea
                value={observacionesCredito}
                onChange={(e) => setObservacionesCredito(e.target.value)}
                placeholder="Ej: Cuenta al corriente, sin adeudos..."
                className="form-control"
                rows="4"
              />
              <small className="form-text text-muted">
                Al aprobar, la devolución se registrará automáticamente en el sistema PNV.
              </small>
            </div>
          )}

          {/* Rechazar o Corrección */}
          {(accion === 'rechazar' || accion === 'correccion') && (
            <div className="mb-4">
              <label className="form-label fw-semibold">
                {accion === 'rechazar' ? 'Motivo del rechazo *' : 'Detalles de la corrección *'}
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={
                  accion === 'rechazar'
                    ? "Ej: Cliente tiene adeudos pendientes, no se puede procesar..."
                    : "Ej: Falta información del estado del producto en la línea 2..."
                }
                className="form-control"
                rows="4"
              />
            </div>
          )}
        </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              onClick={onCerrar}
              className="btn btn-secondary"
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className={`btn ${accion === 'aprobar' ? 'btn-success' : accion === 'rechazar' ? 'btn-danger' : 'btn-warning'} d-flex align-items-center gap-2`}
              type="button"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendientesCredito;