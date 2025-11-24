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
    resetDevoluciones,
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
    resetDevoluciones(); // Limpiar estado previo del store
    cargarDevoluciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="card border-danger mb-4 shadow-sm">
        <div className="card-header bg-danger text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <Shield size={32} />
              <div>
                <h1 className="h3 mb-1 fw-bold">Autorización de Excepciones - Administración</h1>
                <p className="mb-0 opacity-75">Evalúa y autoriza devoluciones fuera de política</p>
              </div>
            </div>
            <div className="text-center bg-white bg-opacity-50 rounded p-3">
              <div className="display-4 fw-bold text-dark">{devolucionesPendientes.length}</div>
              <div className="small fw-semibold">Excepciones</div>
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
              <label className="form-label fw-semibold">Tipo de Excepción</label>
              <select
                value={filtroExcepcion}
                onChange={(e) => setFiltroExcepcion(e.target.value)}
                className="form-select"
              >
                <option value="todas">Todos los tipos</option>
                <option value="fuera_plazo">Fuera de Plazo</option>
                <option value="producto_no_devoluble">Producto No Devolvible</option>
              </select>
            </div>
            <div className="col-md-12 col-lg-2">
              <button
                onClick={cargarDevoluciones}
                disabled={loading}
                className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2"
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
            <div className="spinner-border text-danger mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mb-0">Cargando excepciones...</p>
          </div>
        </div>
      ) : devolucionesPendientes.length === 0 ? (
        <div className="card border-success">
          <div className="card-body text-center py-5">
            <CheckCircle size={64} className="text-success mb-3" />
            <h3 className="h4 mb-2">¡Sin excepciones!</h3>
            <p className="text-muted mb-0">No hay devoluciones pendientes de autorización</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {devolucionesPendientes.map((dev) => (
            <div key={dev.id} className="col-12">
              <DevolucionCard
                devolucion={dev}
                onAutorizarCredito={() => abrirModal(dev, 'autorizar_credito')}
                onAutorizarPNV={() => abrirModal(dev, 'autorizar_pnv')}
                onRechazar={() => abrirModal(dev, 'rechazar')}
                onCorreccion={() => abrirModal(dev, 'correccion')}
                onEditarProductos={() => abrirModalEdicion(dev)}
              />
            </div>
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
  const alertClass = excepcionInfo.clase === 'fuera-plazo' ? 'alert-warning' : 'alert-danger';

  return (
    <div className="card border-0 shadow-sm">
      {/* Badge de Excepción */}
      <div className={`alert ${alertClass} border-start border-4 mb-0 rounded-top rounded-bottom-0`}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <AlertTriangle size={20} />
          <span className="fw-bold">
            {excepcionInfo.icono} {excepcionInfo.titulo}
          </span>
        </div>
        <p className="mb-0 small">{excepcionInfo.descripcion}</p>
      </div>

      <div className="card-body">
        {/* Info Grid */}
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
              <div key={idx} className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
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
          <div className="alert alert-info mb-4">
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
            onClick={onEditarProductos}
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
          >
            <Edit size={18} />
            Ajustar Productos
          </button>
          <button
            onClick={onAutorizarCredito}
            className="btn btn-success flex-grow-1 d-flex align-items-center justify-content-center gap-2"
          >
            <CheckCircle size={20} />
            Autorizar → Crédito
          </button>
          <button
            onClick={onAutorizarPNV}
            className="btn btn-primary d-flex align-items-center gap-2"
          >
            <Send size={20} />
            Autorizar → PNV
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCerrar();
    }
  };

  const getHeaderColor = () => {
    switch (accion) {
      case 'autorizar_credito': return 'bg-success';
      case 'autorizar_pnv': return 'bg-primary';
      case 'rechazar': return 'bg-danger';
      case 'correccion': return 'bg-warning';
      default: return 'bg-danger';
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={handleOverlayClick} tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className={`modal-header ${getHeaderColor()} text-white`}>
            <h2 className="modal-title d-flex align-items-center gap-2 mb-0 h4 fw-bold">
              {getIcono()}
              {getTituloModal()}
            </h2>
            <button onClick={onCerrar} className="btn-close btn-close-white" type="button"></button>
          </div>

          <div className="modal-body">
          {/* Info Box */}
          <div className="alert alert-secondary mb-4">
            <div className="fw-bold mb-2">Nota: {devolucion.numero_nota}</div>
            <div className="small">Cliente: {devolucion.cliente}</div>
            <div className="small">Vendedor: {devolucion.vendedor_nombre}</div>
            <div className="small">Tipo de excepción: {devolucion.tipo_excepcion === 'fuera_plazo' ? 'Fuera de Plazo' : 'Producto No Devolvible'}</div>
          </div>

          {/* Descripción */}
          <div className={`alert ${accion === 'autorizar_pnv' ? 'alert-warning' : 'alert-info'} mb-4`}>
            {getDescripcion()}
          </div>

          {/* Textarea de Justificación */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              {accion === 'rechazar' ? 'Justificación del rechazo *' :
               accion === 'correccion' ? 'Detalles de la corrección *' :
               'Justificación de la autorización *'}
            </label>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder={getPlaceholder()}
              className="form-control"
              rows="4"
            />
            <small className="form-text text-muted">
              * Este campo es obligatorio para documentar la decisión
            </small>
          </div>
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
              className={`btn ${accion === 'autorizar_credito' ? 'btn-success' : accion === 'rechazar' ? 'btn-danger' : accion === 'correccion' ? 'btn-warning' : 'btn-primary'} d-flex align-items-center gap-2`}
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
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-secondary text-white">
            <h2 className="modal-title h4 mb-0 d-flex align-items-center gap-2">
              <Edit size={24} />
              Ajustar Productos - Nota {devolucion.numero_nota}
            </h2>
            <button onClick={onCerrar} className="btn-close btn-close-white" aria-label="Cerrar"></button>
          </div>

          <div className="modal-body">
          <div className="alert alert-warning d-flex align-items-start gap-3 border-start border-4 border-warning">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Importante:</strong> Puedes agregar, editar o eliminar productos antes de autorizar la excepción.
              Esto permite corregir errores sin necesidad de solicitar corrección a Almacén.
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <Package size={20} />
              <span className="fw-bold">Productos Devueltos</span>
              <span className="badge bg-secondary ms-2">
                {productosEditables.length} producto{productosEditables.length !== 1 ? 's' : ''}
              </span>
            </div>

            {productosEditables.map((producto, index) => (
              <div key={producto.id} className="card mb-3 border shadow-sm position-relative">
                {producto.esNuevo && (
                  <span className="position-absolute top-0 start-0 badge bg-success rounded-0 rounded-bottom-end">
                    NUEVO
                  </span>
                )}

                <button
                  onClick={() => onEliminarProducto(index)}
                  className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 d-flex align-items-center gap-1"
                  title="Eliminar producto"
                >
                  <Trash2 size={14} />
                  Quitar
                </button>

                <div className="card-body pt-4">
                  <div className="text-muted small mb-3">Producto #{index + 1}</div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Concepto/Sustancia *</label>
                    <input
                      type="text"
                      value={producto.concepto_sustancia}
                      onChange={(e) => onEditarProducto(index, 'concepto_sustancia', e.target.value)}
                      placeholder="Ej: Amoxicilina 500mg"
                      className="form-control"
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Cantidad *</label>
                      <input
                        type="number"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => onEditarProducto(index, 'cantidad', parseInt(e.target.value) || 1)}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Estado del producto *</label>
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

                  <div className="mb-0">
                    <label className="form-label fw-medium">Comentarios</label>
                    <textarea
                      value={producto.comentarios || ''}
                      onChange={(e) => onEditarProducto(index, 'comentarios', e.target.value)}
                      placeholder="Observaciones adicionales del producto..."
                      className="form-control"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={onAgregarProducto} className="btn btn-outline-success d-flex align-items-center gap-2 w-100">
              <PlusCircle size={20} />
              Agregar Producto
            </button>
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold">
              Descripción de los ajustes realizados *
            </label>
            <textarea
              value={observacionesEdicion}
              onChange={(e) => setObservacionesEdicion(e.target.value)}
              placeholder="Describe qué ajustes realizaste... Ej: Se agregó Paracetamol 500mg que no estaba registrado. Se corrigió la cantidad del producto 1 de 3 a 5 unidades."
              className="form-control"
              rows="3"
            />
            <p className="text-muted small mt-2 mb-0">
              * Es importante documentar los cambios para mantener trazabilidad
            </p>
          </div>
          </div>

          <div className="modal-footer">
            <button onClick={onCerrar} className="btn btn-secondary">
              Cancelar
            </button>
            <button onClick={onConfirmar} className="btn btn-secondary d-flex align-items-center gap-2">
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