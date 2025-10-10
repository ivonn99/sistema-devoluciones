import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useDevolucionesStore from '../../stores/devolucionesStore';
import Swal from 'sweetalert2';
import { 
  Shield, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Package, 
  User, 
  Building2,
  CheckCircle,
  XCircle,
  Send,
  Edit,
  Filter,
  RefreshCw,
  Trash2,
  PlusCircle,
  AlertTriangle
} from 'lucide-react';
import './PendientesRepresentante.css';

const PendientesRepresentante = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    devoluciones, 
    loading, 
    error,
    fetchDevoluciones,
    updateDevolucion,
    updateEstado 
  } = useDevolucionesStore();

  const [devolucionSeleccionada, setDevolucionSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [accionActual, setAccionActual] = useState(null);
  const [justificacion, setJustificacion] = useState('');
  const [productosEditables, setProductosEditables] = useState([]);
  const [observacionesEdicion, setObservacionesEdicion] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');
  const [filtroExcepcion, setFiltroExcepcion] = useState('todas');

  useEffect(() => {
    cargarDevoluciones();
  }, []);

  const cargarDevoluciones = async () => {
    await fetchDevoluciones({ 
      estado_actual: 'requiere_autorizacion',
      proceso_en: 'representante' 
    });
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
    dev.estado_actual === 'requiere_autorizacion' && 
    dev.proceso_en === 'representante'
  ).filter(dev => {
    if (filtroEmpresa !== 'todas' && dev.empresa !== filtroEmpresa) return false;
    if (filtroExcepcion !== 'todas' && dev.tipo_excepcion !== filtroExcepcion) return false;
    return true;
  });

  const abrirModal = (devolucion, accion) => {
    setDevolucionSeleccionada(devolucion);
    setAccionActual(accion);
    setModalAbierto(true);
    setJustificacion('');
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setDevolucionSeleccionada(null);
    setAccionActual(null);
    setJustificacion('');
  };

  const abrirModalEdicion = (devolucion) => {
    setDevolucionSeleccionada(devolucion);
    const productosConId = (devolucion.devoluciones_detalle || []).map((prod, idx) => ({
      id: `prod_${idx}`,
      concepto_sustancia: prod.concepto_sustancia,
      cantidad: prod.cantidad,
      estado_producto: prod.estado_producto,
      comentarios: prod.comentarios || '',
      esNuevo: false
    }));
    setProductosEditables(productosConId);
    setObservacionesEdicion('');
    setModalEdicionAbierto(true);
  };

  const cerrarModalEdicion = () => {
    setModalEdicionAbierto(false);
    setDevolucionSeleccionada(null);
    setProductosEditables([]);
    setObservacionesEdicion('');
  };

  const agregarProducto = () => {
    const nuevoProducto = {
      id: `temp_${Date.now()}`,
      concepto_sustancia: '',
      cantidad: 1,
      estado_producto: 'buen_estado',
      comentarios: '',
      esNuevo: true
    };
    setProductosEditables([...productosEditables, nuevoProducto]);
  };

  const editarProducto = (index, campo, valor) => {
    const nuevosProductos = [...productosEditables];
    nuevosProductos[index][campo] = valor;
    setProductosEditables(nuevosProductos);
  };

  const eliminarProducto = async (index) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción quitará este producto de la devolución',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      const nuevosProductos = productosEditables.filter((_, i) => i !== index);
      setProductosEditables(nuevosProductos);
    }
  };

  const validarProductos = () => {
    if (productosEditables.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Debe haber al menos un producto en la devolución',
        confirmButtonColor: '#f59e0b'
      });
      return false;
    }

    for (let i = 0; i < productosEditables.length; i++) {
      const prod = productosEditables[i];
      
      if (!prod.concepto_sustancia || prod.concepto_sustancia.trim() === '') {
        Swal.fire({
          icon: 'warning',
          title: 'Producto incompleto',
          text: `El producto #${i + 1} no tiene concepto/sustancia`,
          confirmButtonColor: '#f59e0b'
        });
        return false;
      }
      
      if (!prod.cantidad || prod.cantidad <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Cantidad inválida',
          text: `El producto #${i + 1} debe tener cantidad mayor a 0`,
          confirmButtonColor: '#f59e0b'
        });
        return false;
      }
      
      if (!prod.estado_producto) {
        Swal.fire({
          icon: 'warning',
          title: 'Estado requerido',
          text: `El producto #${i + 1} debe tener un estado`,
          confirmButtonColor: '#f59e0b'
        });
        return false;
      }
    }
    
    return true;
  };

  const guardarEdicion = async () => {
    if (!validarProductos()) return;

    if (!observacionesEdicion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '⚠️ Observaciones requeridas',
        text: 'Debes describir qué ajustes realizaste',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Guardar cambios?',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;">Se guardarán los cambios en los productos</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📝 <strong>Nota:</strong> ${devolucionSeleccionada.numero_nota}</li>
            <li>📦 <strong>Productos:</strong> ${productosEditables.length}</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      await ejecutarEdicion();
    }
  };

  const ejecutarEdicion = async () => {
    cerrarModalEdicion();

    Swal.fire({
      title: 'Procesando...',
      html: 'Guardando cambios',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const usuarioActual = user.username || 'admin_user';

      const productosParaGuardar = productosEditables.map(prod => ({
        concepto_sustancia: prod.concepto_sustancia,
        cantidad: prod.cantidad,
        estado_producto: prod.estado_producto,
        comentarios: prod.comentarios || null,
        aceptado: true
      }));

      const nuevasObservaciones = devolucionSeleccionada.observaciones_almacen
        ? `${devolucionSeleccionada.observaciones_almacen}\n\n✏️ AJUSTE ADMINISTRACIÓN: ${observacionesEdicion}`
        : `✏️ AJUSTE ADMINISTRACIÓN: ${observacionesEdicion}`;

      const resultadoUpdate = await updateDevolucion(
        devolucionSeleccionada.id,
        {
          observaciones_almacen: nuevasObservaciones,
          motivo_devolucion_general: devolucionSeleccionada.motivo_devolucion_general,
          productos: productosParaGuardar
        }
      );

      if (!resultadoUpdate.success) {
        throw new Error(resultadoUpdate.error || 'Error al actualizar productos');
      }

      await Swal.fire({
        icon: 'success',
        title: '✅ Cambios Guardados',
        html: `
          <div style="text-align: center;">
            <p style="font-size: 1.1em; margin-bottom: 10px;">
              Los productos han sido actualizados
            </p>
            <p style="color: #6b7280; font-size: 0.9em;">
              Nota: ${devolucionSeleccionada.numero_nota}
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        timer: 2000,
        timerProgressBar: true
      });

      await cargarDevoluciones();

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Ocurrió un error al guardar los cambios',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const confirmarAccion = async () => {
    if (!devolucionSeleccionada) return;

    if (!justificacion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '⚠️ Justificación requerida',
        text: 'Debes justificar tu decisión',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    let tituloConfirmacion = '';
    let htmlConfirmacion = '';
    let iconoConfirmacion = 'question';
    let colorBoton = '#3b82f6';
    let textoBoton = 'Confirmar';

    if (accionActual === 'autorizar_credito') {
      tituloConfirmacion = '¿Autorizar y Enviar a Crédito?';
      htmlConfirmacion = `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;">La devolución será enviada a Crédito y Cobranza para validación crediticia</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📝 <strong>Nota:</strong> ${devolucionSeleccionada.numero_nota}</li>
            <li>✅ <strong>Justificación:</strong> ${justificacion.substring(0, 50)}...</li>
          </ul>
        </div>
      `;
      colorBoton = '#10b981';
      textoBoton = 'Sí, autorizar y enviar';
    } else if (accionActual === 'autorizar_pnv') {
      tituloConfirmacion = '¿Autorizar y Registrar en PNV?';
      htmlConfirmacion = `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px; color: #d97706;">
            <strong>⚠️ Bypass de Crédito:</strong> Se registrará directo en PNV sin validación crediticia
          </p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📝 <strong>Nota:</strong> ${devolucionSeleccionada.numero_nota}</li>
            <li>✅ <strong>Justificación:</strong> ${justificacion.substring(0, 50)}...</li>
          </ul>
        </div>
      `;
      colorBoton = '#3b82f6';
      textoBoton = 'Sí, registrar en PNV';
    } else if (accionActual === 'rechazar') {
      tituloConfirmacion = '¿Rechazar Excepción?';
      htmlConfirmacion = `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px; color: #991b1b;">Esta acción rechazará permanentemente la devolución</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📝 <strong>Nota:</strong> ${devolucionSeleccionada.numero_nota}</li>
            <li>❌ <strong>Justificación:</strong> ${justificacion.substring(0, 50)}...</li>
          </ul>
        </div>
      `;
      iconoConfirmacion = 'warning';
      colorBoton = '#ef4444';
      textoBoton = 'Sí, rechazar';
    } else if (accionActual === 'correccion') {
      tituloConfirmacion = '¿Solicitar Corrección?';
      htmlConfirmacion = `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;">Se enviará una solicitud de corrección a Almacén</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📝 <strong>Nota:</strong> ${devolucionSeleccionada.numero_nota}</li>
            <li>🔄 <strong>Detalles:</strong> ${justificacion.substring(0, 50)}...</li>
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

  const ejecutarAccion = async () => {
    if (!devolucionSeleccionada) return;

    const usuarioActual = user.username || 'admin_user';

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

      if (accionActual === 'autorizar_credito') {
        resultado = await updateEstado(
          devolucionSeleccionada.id,
          'autorizada',
          'credito',
          justificacion,
          usuarioActual
        );

        if (resultado.success) {
          await updateDevolucion(devolucionSeleccionada.id, {
            motivo_autorizacion: justificacion
          });

          await Swal.fire({
            icon: 'success',
            title: '✅ Excepción Autorizada',
            html: `
              <div style="text-align: center;">
                <p style="font-size: 1.1em; margin-bottom: 10px;">
                  La devolución ha sido <strong>autorizada</strong> y enviada a Crédito y Cobranza
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
          throw new Error(resultado.error || 'Error al autorizar');
        }

      } else if (accionActual === 'autorizar_pnv') {
        resultado = await updateEstado(
          devolucionSeleccionada.id,
          'registrada_pnv',
          'finalizado',
          justificacion,
          usuarioActual
        );

        if (resultado.success) {
          await updateDevolucion(devolucionSeleccionada.id, {
            motivo_autorizacion: justificacion,
            fecha_registrada_pnv: new Date().toISOString(),
            registrada_pnv_por: usuarioActual
          });

          await Swal.fire({
            icon: 'success',
            title: '✅ Registrada en PNV',
            html: `
              <div style="text-align: center;">
                <p style="font-size: 1.1em; margin-bottom: 10px;">
                  La devolución ha sido <strong>autorizada y registrada en PNV</strong>
                </p>
                <p style="color: #6b7280; font-size: 0.9em;">
                  Nota: ${devolucionSeleccionada.numero_nota}
                </p>
                <p style="color: #d97706; font-size: 0.85em; margin-top: 10px;">
                  ⚠️ Bypass de Crédito aplicado
                </p>
              </div>
            `,
            confirmButtonColor: '#3b82f6',
            timer: 3000,
            timerProgressBar: true
          });
          await cargarDevoluciones();
        } else {
          throw new Error(resultado.error || 'Error al registrar en PNV');
        }

      } else if (accionActual === 'rechazar') {
        resultado = await updateEstado(
          devolucionSeleccionada.id,
          'rechazada',
          'finalizado',
          justificacion,
          usuarioActual
        );

        if (resultado.success) {
          await Swal.fire({
            icon: 'error',
            title: '❌ Excepción Rechazada',
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
                    <strong>Justificación:</strong> ${justificacion}
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
        resultado = await updateEstado(
          devolucionSeleccionada.id,
          'requiere_correccion',
          'almacen',
          justificacion,
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

  return (
    <div className="pendientes-representante-container">
      <div className="pendientes-representante-wrapper">
        <div className="header-card">
          <div className="header-top">
            <div className="header-title-section">
              <h1>
                <Shield style={{ color: '#8b5cf6' }} size={32} />
                Autorización de Excepciones - Administración
              </h1>
              <p>Evalúa y autoriza devoluciones fuera de política</p>
            </div>
            <div className="header-counter">
              <div className="counter-number">{devolucionesPendientes.length}</div>
              <div className="counter-label">Excepciones</div>
            </div>
          </div>

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
                <option value="todas">Todos los tipos</option>
                <option value="fuera_plazo">Fuera de Plazo</option>
                <option value="producto_no_devoluble">Producto No Devolvible</option>
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

        {error && (
          <div className="error-alert">
            <AlertCircle style={{ color: '#dc2626', flexShrink: 0 }} size={24} />
            <p>{error}</p>
          </div>
        )}

        {loading && devolucionesPendientes.length === 0 ? (
          <div className="loading-container">
            <RefreshCw size={48} className="loading-icon" />
            <p className="loading-text">Cargando excepciones...</p>
          </div>
        ) : devolucionesPendientes.length === 0 ? (
          <div className="empty-state">
            <CheckCircle style={{ color: '#10b981', margin: '0 auto 1rem' }} size={48} />
            <h3>¡Sin excepciones!</h3>
            <p>No hay devoluciones pendientes de autorización</p>
          </div>
        ) : (
          <div className="devoluciones-list">
            {devolucionesPendientes.map((dev) => (
              <DevolucionCard 
                key={dev.id} 
                devolucion={dev} 
                onAutorizarCredito={() => abrirModal(dev, 'autorizar_credito')}
                onAutorizarPNV={() => abrirModal(dev, 'autorizar_pnv')}
                onRechazar={() => abrirModal(dev, 'rechazar')}
                onCorreccion={() => abrirModal(dev, 'correccion')}
                onEditarProductos={() => abrirModalEdicion(dev)}
              />
            ))}
          </div>
        )}

        {modalAbierto && devolucionSeleccionada && (
          <ModalAccion
            devolucion={devolucionSeleccionada}
            accion={accionActual}
            justificacion={justificacion}
            setJustificacion={setJustificacion}
            onConfirmar={confirmarAccion}
            onCerrar={cerrarModal}
          />
        )}

        {modalEdicionAbierto && devolucionSeleccionada && (
          <ModalEdicionProductos
            devolucion={devolucionSeleccionada}
            productosEditables={productosEditables}
            onAgregarProducto={agregarProducto}
            onEditarProducto={editarProducto}
            onEliminarProducto={eliminarProducto}
            observacionesEdicion={observacionesEdicion}
            setObservacionesEdicion={setObservacionesEdicion}
            onConfirmar={guardarEdicion}
            onCerrar={cerrarModalEdicion}
          />
        )}
      </div>
    </div>
  );
};

// Componente Card de Devolución
const DevolucionCard = ({ 
  devolucion, 
  onAutorizarCredito, 
  onAutorizarPNV, 
  onRechazar, 
  onCorreccion,
  onEditarProductos 
}) => {
  const getExcepcionInfo = () => {
    if (devolucion.tipo_excepcion === 'fuera_plazo') {
      return {
        clase: 'fuera-plazo',
        icono: '⏰',
        titulo: 'EXCEPCIÓN: Fuera de Plazo',
        descripcion: `${devolucion.dias_diferencia} días (máx ${devolucion.plazo_maximo}) - ${devolucion.tipo_cliente}`
      };
    } else if (devolucion.tipo_excepcion === 'producto_no_devoluble') {
      return {
        clase: 'no-devolvible',
        icono: '🚫',
        titulo: 'EXCEPCIÓN: Producto NO Devolvible',
        descripcion: 'Contiene productos que no pueden ser devueltos por política'
      };
    }
    return {
      clase: 'default',
      icono: '⚠️',
      titulo: 'EXCEPCIÓN',
      descripcion: 'Requiere autorización'
    };
  };

  const excepcionInfo = getExcepcionInfo();

  return (
    <div className="devolucion-card">
      <div className={`excepcion-badge ${excepcionInfo.clase}`}>
        <div className="excepcion-header">
          <AlertTriangle size={20} />
          <span className="excepcion-titulo">
            {excepcionInfo.icono} {excepcionInfo.titulo}
          </span>
        </div>
        <p className="excepcion-descripcion">{excepcionInfo.descripcion}</p>
      </div>

      <div className="devolucion-content">
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
            onClick={onEditarProductos}
            className="btn-accion btn-editar"
          >
            <Edit size={20} />
            Ajustar Productos
          </button>
          <button
            onClick={onAutorizarCredito}
            className="btn-accion btn-autorizar"
          >
            <CheckCircle size={20} />
            Autorizar y Enviar a Crédito
          </button>
          <button
            onClick={onAutorizarPNV}
            className="btn-accion btn-pnv"
          >
            <Send size={20} />
            Autorizar y Registrar en PNV
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

// Componente Modal de Acción
const ModalAccion = ({ 
  devolucion, 
  accion, 
  justificacion, 
  setJustificacion, 
  onConfirmar, 
  onCerrar 
}) => {
  const getTituloModal = () => {
    switch (accion) {
      case 'autorizar_credito':
        return 'Autorizar y Enviar a Crédito';
      case 'autorizar_pnv':
        return 'Autorizar y Registrar en PNV';
      case 'rechazar':
        return 'Rechazar Excepción';
      case 'correccion':
        return 'Solicitar Corrección';
      default:
        return 'Acción';
    }
  };

  const getIcono = () => {
    switch (accion) {
      case 'autorizar_credito':
        return <CheckCircle style={{ color: '#10b981' }} />;
      case 'autorizar_pnv':
        return <Send style={{ color: '#3b82f6' }} />;
      case 'rechazar':
        return <XCircle style={{ color: '#ef4444' }} />;
      case 'correccion':
        return <AlertCircle style={{ color: '#f59e0b' }} />;
      default:
        return null;
    }
  };

  const getPlaceholder = () => {
    switch (accion) {
      case 'autorizar_credito':
        return 'Ej: Cliente cumple con política de pago, se autoriza devolución...';
      case 'autorizar_pnv':
        return 'Ej: Se autoriza bypass de crédito por situación especial del cliente...';
      case 'rechazar':
        return 'Ej: El producto excede el tiempo permitido sin justificación válida...';
      case 'correccion':
        return 'Ej: Falta especificar el estado del producto 2, revisar cantidad...';
      default:
        return 'Escribe aquí...';
    }
  };

  const getDescripcion = () => {
    switch (accion) {
      case 'autorizar_credito':
        return 'La devolución será enviada a Crédito y Cobranza para validación crediticia antes de registrarse en PNV.';
      case 'autorizar_pnv':
        return '⚠️ BYPASS DE CRÉDITO: La devolución se registrará directamente en PNV sin pasar por validación de Crédito y Cobranza.';
      case 'rechazar':
        return 'Esta acción rechazará permanentemente la devolución. El vendedor será notificado del rechazo.';
      case 'correccion':
        return 'Se enviará una solicitud a Almacén para que corrija la información de la devolución.';
      default:
        return '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className={`modal-header ${accion}`}>
          <h2>
            {getIcono()}
            {getTituloModal()}
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
            <div className="modal-info-item">
              Tipo de excepción: {devolucion.tipo_excepcion === 'fuera_plazo' ? 'Fuera de Plazo' : 'Producto No Devolvible'}
            </div>
          </div>

          <div className="modal-description">
            {getDescripcion()}
          </div>

          <div className="modal-form-group">
            <label className={`modal-label ${accion === 'rechazar' ? 'rechazar' : ''}`}>
              {accion === 'rechazar' ? 'Justificación del rechazo *' : 
               accion === 'correccion' ? 'Detalles de la corrección *' : 
               'Justificación de la autorización *'}
            </label>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder={getPlaceholder()}
              className={`modal-textarea ${accion === 'rechazar' ? 'rechazar' : ''}`}
            />
            <p className="modal-help-text">
              * Este campo es obligatorio para documentar la decisión
            </p>
          </div>

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

// Componente Modal de Edición de Productos
const ModalEdicionProductos = ({ 
  devolucion, 
  productosEditables,
  onAgregarProducto,
  onEditarProducto,
  onEliminarProducto,
  observacionesEdicion,
  setObservacionesEdicion,
  onConfirmar, 
  onCerrar 
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content modal-edicion">
        <div className="modal-header editar">
          <h2 className="modal-title">
            <Edit style={{ color: '#8b5cf6' }} />
            Ajustar Productos - Nota {devolucion.numero_nota}
          </h2>
        </div>

        <div className="modal-body">
          <div className="info-alert">
            <AlertTriangle style={{ color: '#d97706', flexShrink: 0 }} size={20} />
            <div>
              <strong>Importante:</strong> Puedes agregar, editar o eliminar productos antes de autorizar la excepción.
              Esto permite corregir errores sin necesidad de solicitar corrección a Almacén.
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="productos-edit-header">
              <Package size={20} />
              Productos Devueltos
              <span className="productos-count-badge">
                {productosEditables.length} producto{productosEditables.length !== 1 ? 's' : ''}
              </span>
            </div>

            {productosEditables.map((producto, index) => (
              <div key={producto.id} className="producto-edit-card">
                {producto.esNuevo && (
                  <span className="producto-nuevo-badge">NUEVO</span>
                )}

                <button
                  onClick={() => onEliminarProducto(index)}
                  className="btn-eliminar-producto"
                  title="Eliminar producto"
                >
                  <Trash2 size={14} />
                  Quitar
                </button>

                <div className="producto-number">Producto #{index + 1}</div>

                <div className="form-group">
                  <label className="form-label">Concepto/Sustancia *</label>
                  <input
                    type="text"
                    value={producto.concepto_sustancia}
                    onChange={(e) => onEditarProducto(index, 'concepto_sustancia', e.target.value)}
                    placeholder="Ej: Amoxicilina 500mg"
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      value={producto.cantidad}
                      onChange={(e) => onEditarProducto(index, 'cantidad', parseInt(e.target.value) || 1)}
                      className="form-input-number"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado del producto *</label>
                    <select
                      value={producto.estado_producto}
                      onChange={(e) => onEditarProducto(index, 'estado_producto', e.target.value)}
                      className="form-select"
                    >
                      <option value="buen_estado">Buen estado</option>
                      <option value="danado_caducado">Dañado/Caducado</option>
                      <option value="defecto_fabrica">Defecto de fábrica</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Comentarios</label>
                  <textarea
                    value={producto.comentarios || ''}
                    onChange={(e) => onEditarProducto(index, 'comentarios', e.target.value)}
                    placeholder="Observaciones adicionales del producto..."
                    className="form-textarea"
                    rows="2"
                  />
                </div>
              </div>
            ))}

            <button onClick={onAgregarProducto} className="btn-agregar-producto">
              <PlusCircle size={20} />
              Agregar Producto
            </button>
          </div>

          <div className="observaciones-edicion-container">
            <label className="observaciones-edicion-label">
              Descripción de los ajustes realizados *
            </label>
            <textarea
              value={observacionesEdicion}
              onChange={(e) => setObservacionesEdicion(e.target.value)}
              placeholder="Describe qué ajustes realizaste... Ej: Se agregó Paracetamol 500mg que no estaba registrado. Se corrigió la cantidad del producto 1 de 3 a 5 unidades."
              className="observaciones-edicion-textarea"
              rows="3"
            />
            <p className="observaciones-help-text">
              * Es importante documentar los cambios para mantener trazabilidad
            </p>
          </div>

          <div className="modal-footer">
            <button onClick={onCerrar} className="btn-cancelar">
              Cancelar
            </button>
            <button onClick={onConfirmar} className="btn-confirmar editar">
              <Edit size={20} />
              Guardar Ajustes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendientesRepresentante;