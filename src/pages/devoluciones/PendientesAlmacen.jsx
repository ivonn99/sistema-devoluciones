import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useDevolucionesStore from '../../stores/devolucionesStore';
import Swal from 'sweetalert2';
import { 
  Edit, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Package, 
  User, 
  Building2, 
  Filter,
  RefreshCw,
  Trash2,
  PlusCircle
} from 'lucide-react';
import './PendientesAlmacen.css';

const PendientesAlmacen = () => {
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
  const [productosEditables, setProductosEditables] = useState([]);
  const [observacionesCorreccion, setObservacionesCorreccion] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('todas');
  const [clienteEditable, setClienteEditable] = useState('');
  const [numeroNotaEditable, setNumeroNotaEditable] = useState('');

  useEffect(() => {
    resetDevoluciones(); // Limpiar estado previo del store
    cargarDevoluciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para controlar el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (modalAbierto) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'unset';
    };
  }, [modalAbierto]);

  const cargarDevoluciones = async () => {
    await fetchDevoluciones({
      estado_actual: 'requiere_correccion',
      proceso_en: 'almacen'
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
    dev.estado_actual === 'requiere_correccion' && 
    dev.proceso_en === 'almacen'
  ).filter(dev => {
    if (filtroEmpresa !== 'todas' && dev.empresa !== filtroEmpresa) return false;
    return true;
  });

  const abrirModal = useCallback((devolucion) => {
    setDevolucionSeleccionada(devolucion);

    const productosConId = (devolucion.devoluciones_detalle || []).map((prod, idx) => ({
      id: `prod_${Date.now()}_${idx}`,
      concepto_sustancia: prod.concepto_sustancia || '',
      cantidad: prod.cantidad || 1,
      estado_producto: prod.estado_producto || 'buen_estado',
      comentarios: prod.comentarios || '',
      esNuevo: false
    }));

    setProductosEditables(productosConId);
    setClienteEditable(devolucion.cliente || '');
    setNumeroNotaEditable(devolucion.numero_nota || '');
    setObservacionesCorreccion('');
    setModalAbierto(true);
  }, []);

  const cerrarModal = () => {
    setModalAbierto(false);
    setDevolucionSeleccionada(null);
    setProductosEditables([]);
    setClienteEditable('');
    setNumeroNotaEditable('');
    setObservacionesCorreccion('');
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

  const editarProducto = useCallback((index, campo, valor) => {
    setProductosEditables(prev => {
      const nuevosProductos = [...prev];
      if (nuevosProductos[index]) {
        nuevosProductos[index] = {
          ...nuevosProductos[index],
          [campo]: valor
        };
      }
      return nuevosProductos;
    });
  }, []);

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

  const validarProductos = useCallback(() => {
    if (!productosEditables || productosEditables.length === 0) {
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
      
      if (!prod) {
        console.error(`❌ Producto ${i} es null/undefined`);
        Swal.fire({
          icon: 'error',
          title: 'Error en validación',
          text: `Error al validar producto #${i + 1}`,
          confirmButtonColor: '#ef4444'
        });
        return false;
      }
      
      if (!prod.concepto_sustancia || prod.concepto_sustancia.trim() === '') {
        Swal.fire({
          icon: 'warning',
          title: 'Producto incompleto',
          text: `El producto #${i + 1} no tiene concepto/sustancia`,
          confirmButtonColor: '#f59e0b'
        });
        return false;
      }
      
      const cantidad = Number(prod.cantidad);
      if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
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
  }, [productosEditables]);

  const confirmarCorreccion = async () => {
    if (!validarProductos()) return;

    // Validar cliente
    if (!clienteEditable.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '⚠️ Cliente requerido',
        text: 'El nombre del cliente no puede estar vacío',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    // Validar número de nota
    if (!numeroNotaEditable.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '⚠️ Número de nota requerido',
        text: 'El número de nota no puede estar vacío',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!observacionesCorreccion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: '⚠️ Observaciones requeridas',
        text: 'Debes describir qué correcciones realizaste',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Guardar corrección?',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;">Se guardarán los cambios y la devolución regresará al área que la solicitó</p>
          <ul style="list-style: none; padding-left: 0;">
            <li>👤 <strong>Cliente:</strong> ${clienteEditable}</li>
            <li>📝 <strong>Nota:</strong> ${numeroNotaEditable}</li>
            <li>📦 <strong>Productos:</strong> ${productosEditables.length}</li>
            <li>🔄 <strong>Corrección:</strong> ${observacionesCorreccion.substring(0, 50)}...</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, guardar y reenviar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      await ejecutarCorreccion();
    }
  };

  const ejecutarCorreccion = async () => {
    cerrarModal();

    Swal.fire({
      title: 'Procesando...',
      html: 'Guardando corrección',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const usuarioActual = user.username || 'almacen_user';

      const productosParaGuardar = productosEditables.map(prod => ({
        concepto_sustancia: prod.concepto_sustancia,
        cantidad: prod.cantidad,
        estado_producto: prod.estado_producto,
        comentarios: prod.comentarios || null,
        aceptado: true
      }));

      const nuevasObservaciones = devolucionSeleccionada.observaciones_almacen
        ? `${devolucionSeleccionada.observaciones_almacen}\n\n🔄 CORRECCIÓN: ${observacionesCorreccion}`
        : `🔄 CORRECCIÓN: ${observacionesCorreccion}`;

      const esExcepcion = devolucionSeleccionada.tipo_excepcion !== null;
      const nuevoEstado = esExcepcion ? 'requiere_autorizacion' : 'registrada';
      const nuevoProceso = esExcepcion ? 'representante' : 'credito';

      const resultadoUpdate = await updateDevolucion(
        devolucionSeleccionada.id,
        {
          cliente: clienteEditable.trim(),
          numero_nota: numeroNotaEditable.trim(),
          observaciones_almacen: nuevasObservaciones,
          motivo_devolucion_general: devolucionSeleccionada.motivo_devolucion_general,
          productos: productosParaGuardar
        }
      );

      if (!resultadoUpdate.success) {
        throw new Error(resultadoUpdate.error || 'Error al actualizar productos');
      }

      const resultadoEstado = await updateEstado(
        devolucionSeleccionada.id,
        nuevoEstado,
        nuevoProceso,
        `Corrección realizada por Almacén: ${observacionesCorreccion}`,
        usuarioActual
      );

      if (!resultadoEstado.success) {
        throw new Error(resultadoEstado.error || 'Error al cambiar estado');
      }

      const nombreAreaDestino = nuevoProceso === 'credito' ? 'Crédito y Cobranza' : 'Representante/Administración';

      await Swal.fire({
        icon: 'success',
        title: '✅ Corrección Guardada',
        html: `
          <div style="text-align: center;">
            <p style="font-size: 1.1em; margin-bottom: 10px;">
              La corrección se ha guardado y reenviado a <strong>${nombreAreaDestino}</strong>
            </p>
            <p style="color: #6b7280; font-size: 0.9em;">
              Cliente: ${clienteEditable}<br/>
              Nota: ${numeroNotaEditable}
            </p>
          </div>
        `,
        confirmButtonColor: '#10b981',
        timer: 3000,
        timerProgressBar: true
      });

      await cargarDevoluciones();

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Ocurrió un error al guardar la corrección',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="card border-warning mb-4 shadow-sm">
        <div className="card-header bg-warning text-dark">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <Edit size={32} />
              <div>
                <h1 className="h3 mb-1 fw-bold">Correcciones Solicitadas - Almacén</h1>
                <p className="mb-0 opacity-75">Corrige la información de las devoluciones según lo solicitado</p>
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
            <div className="col-md-6 col-lg-4">
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
            <div className="col-md-6 col-lg-2">
              <button
                onClick={cargarDevoluciones}
                disabled={loading}
                className="btn btn-warning w-100 d-flex align-items-center justify-content-center gap-2"
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
            <div className="spinner-border text-warning mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mb-0">Cargando devoluciones...</p>
          </div>
        </div>
      ) : devolucionesPendientes.length === 0 ? (
        <div className="card border-success">
          <div className="card-body text-center py-5">
            <Edit size={64} className="text-success mb-3" />
            <h3 className="h4 mb-2">¡Todo al día!</h3>
            <p className="text-muted mb-0">No hay correcciones pendientes</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {devolucionesPendientes.map((dev) => (
            <div key={dev.id} className="col-12">
              <DevolucionCard
                devolucion={dev}
                onCorregir={() => abrirModal(dev)}
              />
            </div>
          ))}
        </div>
      )}

      {modalAbierto && devolucionSeleccionada && (
        <ModalCorreccion
          devolucion={devolucionSeleccionada}
          productosEditables={productosEditables}
          clienteEditable={clienteEditable}
          setClienteEditable={setClienteEditable}
          numeroNotaEditable={numeroNotaEditable}
          setNumeroNotaEditable={setNumeroNotaEditable}
          onAgregarProducto={agregarProducto}
          onEditarProducto={editarProducto}
          onEliminarProducto={eliminarProducto}
          observacionesCorreccion={observacionesCorreccion}
          setObservacionesCorreccion={setObservacionesCorreccion}
          onConfirmar={confirmarCorreccion}
          onCerrar={cerrarModal}
        />
      )}
    </div>
  );
};

const DevolucionCard = ({ devolucion, onCorregir }) => {
  return (
    <div className="card border-0 shadow-sm">
      {/* Header con motivo de corrección */}
      <div className="card-header bg-warning bg-opacity-10 border-warning border-start border-4 py-3">
        <div className="d-flex align-items-center gap-2 mb-2">
          <AlertCircle style={{ color: '#d97706' }} size={20} />
          <span className="fw-bold text-warning">🔄 SOLICITUD DE CORRECCIÓN</span>
        </div>
        <div className="alert alert-warning mb-0 py-2">
          <strong>Qué corregir:</strong> {devolucion.motivo_correccion || 'No especificado'}
        </div>
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
              <div className="badge bg-info mt-1">
                {devolucion.dias_diferencia} días ({devolucion.tipo_cliente})
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 fw-semibold mb-3">
            <Package size={18} />
            Productos Actuales
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
          <div className="alert alert-info mb-4">
            <div className="fw-semibold mb-1">📝 Observaciones previas de Almacén:</div>
            <div className="small">{devolucion.observaciones_almacen}</div>
          </div>
        )}

        {/* Botón de acción */}
        <div className="text-end">
          <button onClick={onCorregir} className="btn btn-warning btn-lg d-flex align-items-center gap-2">
            <Edit size={20} />
            Corregir y Reenviar
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalCorreccion = ({
  devolucion,
  productosEditables,
  clienteEditable,
  setClienteEditable,
  numeroNotaEditable,
  setNumeroNotaEditable,
  onAgregarProducto,
  onEditarProducto,
  onEliminarProducto,
  observacionesCorreccion,
  setObservacionesCorreccion,
  onConfirmar,
  onCerrar
}) => {
  // Cerrar modal al hacer clic en el overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCerrar();
    }
  };

  // Prevenir que el clic dentro del modal cierre el overlay
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={handleOverlayClick} tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable modal-lg" onClick={handleModalClick}>
        <div className="modal-content">
          <div className="modal-header bg-warning text-dark">
            <h2 className="modal-title d-flex align-items-center gap-2 mb-0 h4 fw-bold">
              <Edit size={24} />
              Corregir Devolución - Nota {devolucion.numero_nota}
            </h2>
            <button onClick={onCerrar} className="btn-close" type="button"></button>
          </div>

          <div className="modal-body">
          {/* Alert de corrección */}
          <div className="alert alert-warning border-warning border-2 mb-4">
            <div className="fw-bold mb-1">🔍 Qué se debe corregir:</div>
            <div>{devolucion.motivo_correccion || 'No especificado'}</div>
          </div>

          {/* Campos editables: Cliente y Número de Nota */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <User size={16} className="me-1" />
                Cliente *
              </label>
              <input
                type="text"
                value={clienteEditable}
                onChange={(e) => setClienteEditable(e.target.value)}
                placeholder="Nombre del cliente"
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">
                <FileText size={16} className="me-1" />
                Número de Nota *
              </label>
              <input
                type="text"
                value={numeroNotaEditable}
                onChange={(e) => setNumeroNotaEditable(e.target.value)}
                placeholder="Ej: 12345"
                className="form-control"
              />
            </div>
          </div>

          {/* Productos */}
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2 fw-bold">
                <Package size={20} />
                Productos Devueltos
              </div>
              <span className="badge bg-info">
                {productosEditables.length} producto{productosEditables.length !== 1 ? 's' : ''}
              </span>
            </div>

            {productosEditables.map((producto, index) => (
              <div key={producto.id} className="card mb-3 border-primary border-opacity-25">
                <div className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">
                    Producto #{index + 1}
                    {producto.esNuevo && <span className="badge bg-success ms-2">NUEVO</span>}
                  </span>
                  <button
                    onClick={() => onEliminarProducto(index)}
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    type="button"
                  >
                    <Trash2 size={14} />
                    Quitar
                  </button>
                </div>

                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">Concepto/Sustancia *</label>
                      <input
                        type="text"
                        value={producto.concepto_sustancia}
                        onChange={(e) => onEditarProducto(index, 'concepto_sustancia', e.target.value)}
                        placeholder="Ej: Amoxicilina 500mg"
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Cantidad *</label>
                      <input
                        type="number"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => onEditarProducto(index, 'cantidad', parseInt(e.target.value) || 1)}
                        onWheel={(e) => e.target.blur()}
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Estado del producto *</label>
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

                    <div className="col-12">
                      <label className="form-label fw-semibold">Comentarios</label>
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
              </div>
            ))}

            <button
              onClick={onAgregarProducto}
              className="btn btn-outline-success d-flex align-items-center gap-2 w-100"
              type="button"
            >
              <PlusCircle size={20} />
              Agregar Producto
            </button>
          </div>

          {/* Observaciones de corrección */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              Observaciones de la corrección realizada *
            </label>
            <textarea
              value={observacionesCorreccion}
              onChange={(e) => setObservacionesCorreccion(e.target.value)}
              placeholder="Describe qué correcciones realizaste... Ej: Se corrigió la cantidad del producto 1 de 3 a 5 unidades. Se agregó Paracetamol que faltaba en el registro inicial."
              className="form-control"
              rows="4"
            />
            <small className="form-text text-muted">
              * Es importante documentar los cambios realizados para trazabilidad
            </small>
          </div>
        </div>

          {/* Footer con botones */}
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
              className="btn btn-warning d-flex align-items-center gap-2"
              type="button"
            >
              <Edit size={20} />
              Guardar y Reenviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendientesAlmacen;