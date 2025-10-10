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
    cargarDevoluciones();
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
    <div className="pendientes-credito-container">
      <div className="pendientes-credito-wrapper">
        {/* Header */}
        <div className="header-card">
          <div className="header-top">
            <div className="header-title-section">
              <h1>
                <FileText style={{ color: '#3b82f6' }} size={32} />
                Pendientes Crédito y Cobranza
              </h1>
              <p>Valida la situación crediticia y registra en PNV</p>
            </div>
            <div className="header-counter">
              <div className="counter-number">{devolucionesPendientes.length}</div>
              <div className="counter-label">Pendientes</div>
            </div>
          </div>

          {/* Filtros y Botón Recargar */}
          <div className="filters-container">
            <div className="filters-group">
              <Filter size={20} style={{ color: '#6b7280' }} />
              <select
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="filter-select"
              >
                <option value="todas">Todas las empresas</option>
                <option value="Distribuidora">Distribuidora</option>
                <option value="Rodrigo">Rodrigo</option>
              </select>

              <select
                value={filtroExcepcion}
                onChange={(e) => setFiltroExcepcion(e.target.value)}
                className="filter-select"
              >
                <option value="todas">Todas</option>
                <option value="normal">Flujo Normal</option>
                <option value="excepcion">Excepciones Autorizadas</option>
              </select>
            </div>

            <button
              onClick={cargarDevoluciones}
              disabled={loading}
              className={`reload-button ${loading ? 'loading' : ''}`}
            >
              <RefreshCw size={16} className={loading ? 'icon-spin' : ''} />
              Recargar
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="error-alert">
            <AlertCircle style={{ color: '#dc2626', flexShrink: 0 }} size={24} />
            <p>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && devolucionesPendientes.length === 0 ? (
          <div className="loading-container">
            <RefreshCw size={48} className="loading-icon" />
            <p className="loading-text">Cargando devoluciones...</p>
          </div>
        ) : devolucionesPendientes.length === 0 ? (
          <div className="empty-state">
            <CheckCircle style={{ color: '#10b981', margin: '0 auto 1rem' }} size={48} />
            <h3>¡Todo al día!</h3>
            <p>No hay devoluciones pendientes de validación</p>
          </div>
        ) : (
          <div className="devoluciones-list">
            {devolucionesPendientes.map((dev) => (
              <DevolucionCard 
                key={dev.id} 
                devolucion={dev} 
                onAprobar={() => abrirModal(dev, 'aprobar')}
                onRechazar={() => abrirModal(dev, 'rechazar')}
                onCorreccion={() => abrirModal(dev, 'correccion')}
              />
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
    </div>
  );
};

// Componente Card de Devolución
const DevolucionCard = ({ devolucion, onAprobar, onRechazar, onCorreccion }) => {
  return (
    <div className="devolucion-card">
      {/* Alerta de Excepción */}
      {devolucion.estado_actual === 'autorizada' && (
        <div className={`excepcion-alert ${devolucion.tipo_excepcion === 'fuera_plazo' ? 'fuera-plazo' : 'no-devolvible'}`}>
          <div className="excepcion-content">
            <AlertTriangle 
              style={{ color: devolucion.tipo_excepcion === 'fuera_plazo' ? '#ea580c' : '#dc2626' }} 
              size={20} 
            />
            <span className="excepcion-text">
              {devolucion.tipo_excepcion === 'fuera_plazo' 
                ? `⚠️ EXCEPCIÓN: Fuera de plazo (${devolucion.dias_diferencia} días, máx ${devolucion.plazo_maximo})`
                : '🚫 EXCEPCIÓN: Producto NO devolvible'
              }
            </span>
            <span className="excepcion-badge">
              ✓ Autorizada por Administración
            </span>
          </div>
          {devolucion.motivo_autorizacion && (
            <p className="excepcion-motivo">
              <strong>Motivo autorización:</strong> {devolucion.motivo_autorizacion}
            </p>
          )}
        </div>
      )}

      <div className="devolucion-content">
        {/* Info Principal */}
        <div className="info-grid">
          <div>
            <div className="info-item-label">
              <FileText size={16} />
              Nota de Venta
            </div>
            <div className="info-item-value">{devolucion.numero_nota}</div>
            <div style={{ marginTop: '0.25rem' }}>
              <span className="info-item-badge">
                {devolucion.empresa}
              </span>
            </div>
          </div>

          <div>
            <div className="info-item-label">
              <Building2 size={16} />
              Cliente
            </div>
            <div className="info-item-secondary">{devolucion.cliente}</div>
            <div className="info-item-text">
              <User size={14} />
              {devolucion.vendedor_nombre}
            </div>
          </div>

          <div>
            <div className="info-item-label">
              <Calendar size={16} />
              Fechas
            </div>
            <div className="info-item-dates">
              <div>Remisión: {new Date(devolucion.fecha_remision).toLocaleDateString('es-MX')}</div>
              <div>Devolución: {new Date(devolucion.fecha_devolucion).toLocaleDateString('es-MX')}</div>
              <div className={`dias-diferencia ${devolucion.dias_diferencia <= devolucion.plazo_maximo ? 'dentro-plazo' : 'fuera-plazo'}`}>
                {devolucion.dias_diferencia} días ({devolucion.tipo_cliente})
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="productos-container">
          <div className="productos-header">
            <Package size={18} />
            Productos Devueltos
            <span className="tipo-devolucion-badge">
              {devolucion.tipo_devolucion === 'total' ? 'DEVOLUCIÓN TOTAL' : 'DEVOLUCIÓN PARCIAL'}
            </span>
          </div>
          {devolucion.devoluciones_detalle?.map((prod, idx) => (
            <div 
              key={idx} 
              className={`producto-item ${idx < devolucion.devoluciones_detalle.length - 1 ? 'with-border' : ''}`}
            >
              <div>
                <div className="producto-info-name">{prod.concepto_sustancia}</div>
                <div className="producto-info-estado">Estado: {prod.estado_producto}</div>
              </div>
              <div className="producto-cantidad">
                <div className="producto-cantidad-value">x{prod.cantidad}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Observaciones */}
        {devolucion.observaciones_almacen && (
          <div className="observaciones-almacen">
            <div className="observaciones-title">
              📝 Observaciones de Almacén:
            </div>
            <div className="observaciones-text">{devolucion.observaciones_almacen}</div>
          </div>
        )}

        <div className="motivo-container">
          <strong>Motivo:</strong> {devolucion.motivo_devolucion_general}
        </div>

        {/* Acciones */}
        <div className="acciones-container">
          <button
            onClick={onAprobar}
            className="btn-accion btn-aprobar"
          >
            <CheckCircle size={20} />
            Aprobar y Registrar en PNV
          </button>
          <button
            onClick={onRechazar}
            className="btn-accion btn-rechazar"
          >
            <XCircle size={20} />
            Rechazar
          </button>
          <button
            onClick={onCorreccion}
            className="btn-accion btn-correccion"
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
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className={`modal-header ${accion}`}>
          <h2>
            {accion === 'aprobar' && <CheckCircle style={{ color: '#10b981' }} />}
            {accion === 'rechazar' && <XCircle style={{ color: '#ef4444' }} />}
            {accion === 'correccion' && <AlertCircle style={{ color: '#f59e0b' }} />}
            {accion === 'aprobar' && 'Aprobar y Registrar en PNV'}
            {accion === 'rechazar' && 'Rechazar Devolución'}
            {accion === 'correccion' && 'Solicitar Corrección'}
          </h2>
        </div>

        <div className="modal-body">
          <div className="modal-info-box">
            <div className="modal-info-title">
              Nota: {devolucion.numero_nota}
            </div>
            <div className="modal-info-item">
              Cliente: {devolucion.cliente}
            </div>
            <div className="modal-info-item">
              Vendedor: {devolucion.vendedor_nombre}
            </div>
          </div>

          {accion === 'aprobar' && (
            <div className="modal-form-group">
              <label className="modal-label">
                Observaciones de Crédito (opcional):
              </label>
              <textarea
                value={observacionesCredito}
                onChange={(e) => setObservacionesCredito(e.target.value)}
                placeholder="Ej: Cuenta al corriente, sin adeudos..."
                className="modal-textarea"
              />
              <p className="modal-help-text">
                Al aprobar, la devolución se registrará automáticamente en el sistema PNV.
              </p>
            </div>
          )}

          {(accion === 'rechazar' || accion === 'correccion') && (
            <div className="modal-form-group">
              <label className={`modal-label ${accion === 'rechazar' ? 'rechazar' : ''}`}>
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
                className={`modal-textarea ${accion === 'rechazar' ? 'rechazar' : ''}`}
              />
            </div>
          )}

          <div className="modal-actions">
            <button
              onClick={onCerrar}
              className="btn-modal btn-cancelar"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className={`btn-modal btn-confirmar ${accion}`}
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