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
    <div className="pendientes-almacen-container">
      <div className="pendientes-almacen-wrapper">
        <div className="header-card">
          <div className="header-top">
            <div>
              <h1 className="header-title">
                <Edit style={{ color: '#f59e0b' }} size={32} />
                Correcciones Solicitadas - Almacén
              </h1>
              <p className="header-subtitle">
                Corrige la información de las devoluciones según lo solicitado
              </p>
            </div>
            <div className="header-counter">
              <div className="counter-number">{devolucionesPendientes.length}</div>
              <div className="counter-label">Pendientes</div>
            </div>
          </div>

          <div className="filters-container">
            <div className="filter-group">
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
            </div>

            <button
              onClick={cargarDevoluciones}
              disabled={loading}
              className="btn-refresh"
            >
              <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
              Recargar
            </button>
          </div>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle style={{ color: '#dc2626', flexShrink: 0 }} size={24} />
            <p className="error-text">{error}</p>
          </div>
        )}

        {loading && devolucionesPendientes.length === 0 ? (
          <div className="loading-container">
            <RefreshCw size={48} style={{ color: '#f59e0b' }} className="spin-animation" />
            <p className="loading-text">Cargando devoluciones...</p>
          </div>
        ) : devolucionesPendientes.length === 0 ? (
          <div className="empty-state">
            <Edit style={{ color: '#10b981', margin: '0 auto 1rem' }} size={48} />
            <h3 className="empty-title">¡Todo al día!</h3>
            <p className="empty-text">No hay correcciones pendientes</p>
          </div>
        ) : (
          <div className="devoluciones-list">
            {devolucionesPendientes.map((dev) => (
              <DevolucionCard 
                key={dev.id} 
                devolucion={dev} 
                onCorregir={() => abrirModal(dev)}
              />
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
    </div>
  );
};

const DevolucionCard = ({ devolucion, onCorregir }) => {
  return (
    <div className="devolucion-card">
      <div className="devolucion-header">
        <div className="devolucion-header-title">
          <AlertCircle style={{ color: '#d97706' }} size={20} />
          <span>🔄 SOLICITUD DE CORRECCIÓN</span>
        </div>
        <div className="motivo-correccion">
          <strong>Qué corregir:</strong> {devolucion.motivo_correccion || 'No especificado'}
        </div>
      </div>

      <div className="devolucion-body">
        <div className="info-grid">
          <div>
            <div className="info-label">
              <FileText size={16} />
              Nota de Venta
            </div>
            <div className="info-value">{devolucion.numero_nota}</div>
            <div>
              <span className="empresa-badge">{devolucion.empresa}</span>
            </div>
          </div>

          <div>
            <div className="info-label">
              <Building2 size={16} />
              Cliente
            </div>
            <div className="cliente-name">{devolucion.cliente}</div>
            <div className="vendedor-info">
              <User size={14} />
              {devolucion.vendedor_nombre}
            </div>
          </div>

          <div>
            <div className="info-label">
              <Calendar size={16} />
              Fechas
            </div>
            <div className="fecha-info">
              <div>Remisión: {new Date(devolucion.fecha_remision).toLocaleDateString('es-MX')}</div>
              <div>Devolución: {new Date(devolucion.fecha_devolucion).toLocaleDateString('es-MX')}</div>
              <div className="dias-diferencia">
                {devolucion.dias_diferencia} días ({devolucion.tipo_cliente})
              </div>
            </div>
          </div>
        </div>

        <div className="productos-container">
          <div className="productos-title">
            <Package size={18} />
            Productos Actuales
          </div>
          {devolucion.devoluciones_detalle?.map((prod, idx) => (
            <div key={idx} className="producto-item">
              <div>
                <div className="producto-name">{prod.concepto_sustancia}</div>
                <div className="producto-estado">Estado: {prod.estado_producto}</div>
              </div>
              <div className="producto-cantidad">x{prod.cantidad}</div>
            </div>
          ))}
        </div>

        {devolucion.observaciones_almacen && (
          <div className="observaciones-box">
            <div className="observaciones-title">
              📝 Observaciones previas de Almacén:
            </div>
            <div className="observaciones-text">{devolucion.observaciones_almacen}</div>
          </div>
        )}

        <div className="devolucion-footer">
          <button onClick={onCorregir} className="btn-corregir">
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
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={handleModalClick}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Edit style={{ color: '#f59e0b' }} />
            Corregir Devolución - Nota {devolucion.numero_nota}
          </h2>
        </div>

        <div className="modal-body">
          <div className="correccion-alert">
            <div className="correccion-alert-title">
              🔍 Qué se debe corregir:
            </div>
            <div className="correccion-alert-text">
              {devolucion.motivo_correccion || 'No especificado'}
            </div>
          </div>

          {/* Campos editables: Cliente y Número de Nota */}
          <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                <User size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Cliente *
              </label>
              <input
                type="text"
                value={clienteEditable}
                onChange={(e) => setClienteEditable(e.target.value)}
                placeholder="Nombre del cliente"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Número de Nota *
              </label>
              <input
                type="text"
                value={numeroNotaEditable}
                onChange={(e) => setNumeroNotaEditable(e.target.value)}
                placeholder="Ej: 12345"
                className="form-input"
              />
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
                  type="button"
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

                <div className="form-group">
                  <label className="form-label">Comentarios</label>
                  <textarea
                    value={producto.comentarios || ''}
                    onChange={(e) => onEditarProducto(index, 'comentarios', e.target.value)}
                    placeholder="Observaciones adicionales del producto..."
                    className="form-textarea"
                  />
                </div>
              </div>
            ))}

            <button 
              onClick={onAgregarProducto} 
              className="btn-agregar-producto"
              type="button"
            >
              <PlusCircle size={20} />
              Agregar Producto
            </button>
          </div>

          <div className="observaciones-correccion-container">
            <label className="observaciones-correccion-label">
              Observaciones de la corrección realizada *
            </label>
            <textarea
              value={observacionesCorreccion}
              onChange={(e) => setObservacionesCorreccion(e.target.value)}
              placeholder="Describe qué correcciones realizaste... Ej: Se corrigió la cantidad del producto 1 de 3 a 5 unidades. Se agregó Paracetamol que faltaba en el registro inicial."
              className="observaciones-correccion-textarea"
            />
            <p className="observaciones-help-text">
              * Es importante documentar los cambios realizados para trazabilidad
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            onClick={onCerrar} 
            className="btn-cancelar"
            type="button"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirmar} 
            className="btn-confirmar"
            type="button"
          >
            <Edit size={20} />
            Guardar y Reenviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendientesAlmacen;