import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useDevolucionesStore from '../../stores/devolucionesStore';
import useVendedoresStore from '../../stores/vendedoresStore';
import useClientesStore from '../../stores/clientesStore';
import Swal from 'sweetalert2';
import { 
  Package, 
  Calendar,
  User,
  FileText,
  AlertCircle,
  ChevronDown,
  Save,
  Plus,
  Trash2,
  Search
} from 'lucide-react';

// 🎯 Importar solo los estilos específicos de este componente
import './NuevoRegistro.css';

const NuevoRegistro = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createDevolucion, loading, error } = useDevolucionesStore();
  const { vendedores, fetchVendedores, loading: loadingVendedores } = useVendedoresStore();
  const { clientes, searchClientes, loading: loadingClientes } = useClientesStore();
  const [isSearching, setIsSearching] = useState(false);
  
  const [searchVendedor, setSearchVendedor] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  const [formData, setFormData] = useState({
    empresa: '',
    numero_nota: '',
    fecha_remision: '',
    fecha_devolucion: '',
    cliente: '',
    vendedor_nombre: '',
    tipo_cliente: 'local',
    tiene_registro_libreta: false,
    tipo_devolucion: 'parcial',
    ticket_fisico_presentado: true,
    contiene_producto_no_devolvible: false,
    motivo_devolucion_general: '',
    observaciones_almacen: '',
    creado_por: user?.username || 'sistema',
    productos: [
      {
        concepto_sustancia: '',
        cantidad: 1,
        estado_producto: 'bueno',
        comentarios: ''
      }
    ]
  });

  // Cargar vendedores y clientes iniciales al montar
  useEffect(() => {
    fetchVendedores();
    searchClientes('');
  }, []);

  // Debounce para búsqueda de clientes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchCliente !== null) {
        setIsSearching(true);
        await searchClientes(searchCliente);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchCliente]);

  // Filtrar vendedores en el navegador
  const vendedoresFiltrados = vendedores.filter(vendedor =>
    vendedor.nombre.toLowerCase().includes(searchVendedor.toLowerCase())
  );

  // Verificar autenticación
  if (!user) {
    return (
      <div className="nuevo-registro-container">
        <div className="nuevo-registro-wrapper">
          <div className="nuevo-registro-alert error">
            <AlertCircle />
            <p>Debes iniciar sesión para acceder a esta página</p>
          </div>
        </div>
      </div>
    );
  }

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.map((producto, i) => 
        i === index ? { ...producto, [field]: value } : producto
      )
    }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      productos: [
        ...prev.productos,
        {
          concepto_sustancia: '',
          cantidad: 1,
          estado_producto: 'bueno',
          comentarios: ''
        }
      ]
    }));
  };

  const removeProduct = (index) => {
    if (formData.productos.length > 1) {
      setFormData(prev => ({
        ...prev,
        productos: prev.productos.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🎯 Mostrar confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px;"><strong>¿Deseas registrar esta devolución?</strong></p>
          <ul style="list-style: none; padding-left: 0;">
            <li>📦 <strong>Empresa:</strong> ${formData.empresa}</li>
            <li>📝 <strong>Nota:</strong> ${formData.numero_nota}</li>
            <li>👤 <strong>Cliente:</strong> ${formData.cliente}</li>
            <li>📊 <strong>Productos:</strong> ${formData.productos.length}</li>
            <li>🔄 <strong>Tipo:</strong> ${formData.tipo_devolucion}</li>
          </ul>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, registrar devolución',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'swal-wide'
      }
    });

    // Si el usuario cancela, no hacer nada
    if (!result.isConfirmed) {
      return;
    }

    // 🎯 Mostrar loading mientras se guarda
    Swal.fire({
      title: 'Guardando...',
      html: 'Por favor espera mientras se registra la devolución',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // 🎯 Intentar guardar la devolución
    try {
      const resultCreation = await createDevolucion(formData);
      
      if (resultCreation.success) {
        // ✅ Éxito - Determinar mensaje según si requiere autorización
        const requiereAutorizacion = resultCreation.requiereAutorizacion;
        const tipoExcepcion = resultCreation.tipoExcepcion;
        
        // Mensaje de excepción
        let mensajeExcepcion = '';
        if (tipoExcepcion === 'fuera_plazo') {
          mensajeExcepcion = '⚠️ La devolución está fuera del plazo establecido';
        } else if (tipoExcepcion === 'producto_no_devoluble') {
          mensajeExcepcion = '⚠️ Contiene productos marcados como NO devolvibles';
        }
        
        await Swal.fire({
          icon: requiereAutorizacion ? 'warning' : 'success',
          title: requiereAutorizacion ? '⚠️ Devolución Registrada - Requiere Autorización' : '✅ Devolución Registrada',
          html: `
            <div style="text-align: center;">
              <p style="font-size: 1.1em; margin-bottom: 10px;">
                La devolución ha sido registrada exitosamente en la base de datos
              </p>
              <p style="color: #6b7280; font-size: 0.9em; margin-bottom: 15px;">
                Nota: ${formData.numero_nota}
              </p>
              ${requiereAutorizacion ? `
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 15px; border-radius: 4px;">
                  <p style="color: #92400e; font-weight: 600; margin-bottom: 8px;">
                    ${mensajeExcepcion}
                  </p>
                  <p style="color: #92400e; font-size: 0.9em;">
                    Esta devolución necesita <strong>autorización del representante</strong> antes de continuar con el proceso.
                  </p>
                </div>
              ` : ''}
            </div>
          `,
          confirmButtonColor: requiereAutorizacion ? '#f59e0b' : '#10b981',
          confirmButtonText: 'Ir al Dashboard',
          timer: requiereAutorizacion ? undefined : 3000,
          timerProgressBar: !requiereAutorizacion
        });
        
        // Redirigir al dashboard
        navigate('/dashboard');
      } else {
        // ❌ Error en la respuesta
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: resultCreation.error || 'No se pudo registrar la devolución. Por favor intenta de nuevo.',
          confirmButtonColor: '#ef4444'
        });
      }
    } catch (err) {
      // ❌ Error en la petición
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al intentar guardar la devolución. Por favor verifica tu conexión e intenta de nuevo.',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="container-xl py-4">
      <div className="card border-primary mb-4">
        <div className="card-header bg-primary text-white">
          <h1 className="h3 mb-0 d-flex align-items-center gap-3 fw-bold">
            <Package size={32} />
            Nueva Devolución
          </h1>
        </div>
        <div className="card-body">
          <p className="mb-0 text-muted">Registra una nueva devolución en el sistema</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Información General */}
        <section className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h2 className="h5 mb-0 fw-bold">Información General</h2>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Empresa</label>
                <select
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona una empresa</option>
                  <option value="Distribuidora">Distribuidora</option>
                  <option value="Rodrigo">Rodrigo</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Número de Nota</label>
                <input
                  type="text"
                  name="numero_nota"
                  value={formData.numero_nota}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="Ej: 12345"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Fecha de Remisión (fecha de salida)</label>
                <input
                  type="date"
                  name="fecha_remision"
                  value={formData.fecha_remision}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Fecha de Devolución</label>
                <input
                  type="date"
                  name="fecha_devolucion"
                  value={formData.fecha_devolucion}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>

              <div className={`col-md-6 ${formData.cliente ? 'border border-success rounded p-3 bg-light' : searchCliente && clientes.length > 0 ? 'border border-primary rounded p-3 bg-light' : searchCliente && clientes.length === 0 ? 'border border-warning rounded p-3 bg-light' : ''}`}>
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <Search size={16} className="text-primary" />
                  Cliente (búsqueda en servidor)
                </label>
                <input
                  type="text"
                  placeholder="Escribe para buscar cliente..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  className="form-control mb-2"
                />
                <select
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  required
                  disabled={loadingClientes || (!searchCliente && !formData.cliente)}
                  size={searchCliente && !formData.cliente ? Math.min(clientes.length + 1, 8) : 1}
                  className="form-select"
                  style={{ 
                    height: searchCliente && !formData.cliente ? 'auto' : '40px',
                    minHeight: searchCliente && !formData.cliente ? '80px' : '40px'
                  }}
                >
                  <option value="">
                    {loadingClientes 
                      ? '🔍 Buscando...' 
                      : isSearching
                      ? '🔍 Buscando...'
                      : searchCliente 
                        ? clientes.length > 0 ? `${clientes.length} resultados` : 'Sin resultados'
                        : formData.cliente
                        ? 'Seleccionado ✓'
                        : '💡 Escribe arriba para buscar'}
                  </option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.nombre}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
                {isSearching && (
                  <small className="text-primary d-block mt-1">🔍 Buscando en el servidor...</small>
                )}
                {searchCliente && clientes.length === 0 && !isSearching && (
                  <small className="text-warning d-block mt-1">
                    ⚠️ No se encontraron resultados para "{searchCliente}"
                  </small>
                )}
                {formData.cliente && (
                  <small className="text-success d-block mt-1">
                    ✓ Cliente seleccionado
                  </small>
                )}
              </div>

              <div className={`col-md-6 ${formData.vendedor_nombre ? 'border border-success rounded p-3 bg-light' : searchVendedor && vendedoresFiltrados.length > 0 ? 'border border-primary rounded p-3 bg-light' : searchVendedor && vendedoresFiltrados.length === 0 ? 'border border-warning rounded p-3 bg-light' : ''}`}>
                <label className="form-label fw-semibold d-flex align-items-center gap-2">
                  <Search size={16} className="text-primary" />
                  Vendedor
                </label>
                <input
                  type="text"
                  placeholder="Buscar vendedor..."
                  value={searchVendedor}
                  onChange={(e) => setSearchVendedor(e.target.value)}
                  disabled={loadingVendedores}
                  className={`form-control mb-2 ${loadingVendedores ? 'opacity-50' : ''}`}
                />
                <select
                  name="vendedor_nombre"
                  value={formData.vendedor_nombre}
                  onChange={handleChange}
                  required
                  disabled={loadingVendedores || (!searchVendedor && !formData.vendedor_nombre)}
                  size={searchVendedor && !formData.vendedor_nombre ? Math.min(vendedoresFiltrados.length + 1, 8) : 1}
                  className="form-select"
                  style={{ 
                    height: searchVendedor && !formData.vendedor_nombre ? 'auto' : '40px',
                    minHeight: searchVendedor && !formData.vendedor_nombre ? '80px' : '40px'
                  }}
                >
                  <option value="">
                    {loadingVendedores 
                      ? '⏳ Cargando vendedores...' 
                      : searchVendedor
                        ? vendedoresFiltrados.length > 0 ? `${vendedoresFiltrados.length} resultados` : 'Sin resultados'
                        : formData.vendedor_nombre
                        ? 'Seleccionado ✓'
                        : '💡 Escribe arriba para buscar'}
                  </option>
                  {vendedoresFiltrados.map((vendedor) => (
                    <option key={vendedor.id} value={vendedor.nombre}>
                      {vendedor.nombre}
                    </option>
                  ))}
                </select>
                {loadingVendedores && (
                  <small className="text-primary d-block mt-1">⏳ Cargando vendedores...</small>
                )}
                {searchVendedor && vendedoresFiltrados.length === 0 && !loadingVendedores && (
                  <small className="text-warning d-block mt-1">
                    ⚠️ No se encontraron resultados para "{searchVendedor}"
                  </small>
                )}
                {formData.vendedor_nombre && (
                  <small className="text-success d-block mt-1">
                    ✓ Vendedor seleccionado
                  </small>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Tipo de Cliente</label>
                <select
                  name="tipo_cliente"
                  value={formData.tipo_cliente}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="local">Local (7 días)</option>
                  <option value="foraneo">Foráneo (21 días)</option>
                  <option value="consignacion">Consignación (30 días)</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Tipo de Devolución</label>
                <select
                  name="tipo_devolucion"
                  value={formData.tipo_devolucion}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="parcial">Parcial</option>
                  <option value="total">Total</option>
                </select>
              </div>
            </div>

            <div className="row g-3 mt-2">
              <div className="col-md-4">
                <div className={`form-check p-3 border rounded ${formData.tiene_registro_libreta ? 'border-success bg-light' : ''}`}>
                  <input
                    type="checkbox"
                    name="tiene_registro_libreta"
                    checked={formData.tiene_registro_libreta}
                    onChange={handleChange}
                    id="registro-libreta"
                    className="form-check-input"
                  />
                  <label htmlFor="registro-libreta" className="form-check-label fw-medium">
                    Tiene registro en libreta
                  </label>
                </div>
              </div>

              <div className="col-md-4">
                <div className={`form-check p-3 border rounded ${formData.ticket_fisico_presentado ? 'border-success bg-light' : ''}`}>
                  <input
                    type="checkbox"
                    name="ticket_fisico_presentado"
                    checked={formData.ticket_fisico_presentado}
                    onChange={handleChange}
                    id="ticket-fisico"
                    className="form-check-input"
                  />
                  <label htmlFor="ticket-fisico" className="form-check-label fw-medium">
                    Ticket físico presentado
                  </label>
                </div>
              </div>

              <div className="col-md-4">
                <div className={`form-check p-3 border rounded ${formData.contiene_producto_no_devolvible ? 'border-warning bg-light' : ''}`}>
                  <input
                    type="checkbox"
                    name="contiene_producto_no_devolvible"
                    checked={formData.contiene_producto_no_devolvible}
                    onChange={handleChange}
                    id="producto-no-devolvible"
                    className="form-check-input"
                  />
                  <label htmlFor="producto-no-devolvible" className="form-check-label fw-medium">
                    ⚠️ Contiene producto NO devolvible
                  </label>
                </div>
              </div>
            </div>

            {/* ✅ MOTIVO GENERAL DE DEVOLUCIÓN */}
            <div className="col-12 mt-3">
              <label className="form-label fw-semibold text-primary d-flex align-items-center gap-2">
                <FileText size={20} />
                Motivo General de Devolución
              </label>
              <select
                name="motivo_devolucion_general"
                value={formData.motivo_devolucion_general}
                onChange={handleChange}
                required
                className={`form-select ${formData.motivo_devolucion_general ? 'border-success border-2' : ''}`}
              >
                <option value="">Selecciona el motivo de la devolución</option>
                <option value="Error en pedido">Error en pedido</option>
                <option value="Producto dañado">Producto dañado</option>
                <option value="Fecha de caducidad próxima">Fecha de caducidad próxima</option>
                <option value="Producto expirado">Producto expirado</option>
                <option value="Cliente no satisfecho">Cliente no satisfecho</option>
                <option value="Empaque dañado">Empaque dañado</option>
                <option value="Producto equivocado">Producto equivocado</option>
                <option value="Cambio de pedido">Cambio de pedido</option>
                <option value="Exceso de inventario">Exceso de inventario</option>
                <option value="Producto defectuoso">Producto defectuoso</option>
                <option value="Otro">Otro (especificar en observaciones)</option>
              </select>
              {formData.motivo_devolucion_general && (
                <small className="text-success d-block mt-1">
                  ✓ Este motivo aplica para toda la devolución
                </small>
              )}
            </div>
          </div>
        </section>

        {/* Productos */}
        <section className="card mb-4 border-success">
          <div className="card-header bg-success text-white">
            <h2 className="h5 mb-0 fw-bold d-flex align-items-center gap-2">
              <Package size={24} />
              Productos
            </h2>
          </div>
          <div className="card-body">

            {formData.productos.map((producto, index) => (
              <div key={index} className="card mb-3">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <span className="fw-bold text-primary d-flex align-items-center gap-2">
                    <Package size={20} />
                    Producto {index + 1}
                  </span>
                  {formData.productos.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                      onClick={() => removeProduct(index)}
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Concepto/Sustancia</label>
                      <input
                        type="text"
                        value={producto.concepto_sustancia}
                        onChange={(e) => handleProductChange(index, 'concepto_sustancia', e.target.value)}
                        required
                        className="form-control"
                        placeholder="Nombre del producto"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => handleProductChange(index, 'cantidad', e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        required
                        className="form-control"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Estado del Producto</label>
                      <select
                        value={producto.estado_producto}
                        onChange={(e) => handleProductChange(index, 'estado_producto', e.target.value)}
                        required
                        className="form-select"
                      >
                        <option value="bueno">Bueno</option>
                        <option value="dañado">Dañado</option>
                        <option value="expirado">Expirado</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Comentarios adicionales (opcional)</label>
                      <input
                        type="text"
                        value={producto.comentarios}
                        onChange={(e) => handleProductChange(index, 'comentarios', e.target.value)}
                        className="form-control"
                        placeholder="Detalles específicos de este producto..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-success d-flex align-items-center gap-2"
              onClick={addProduct}
            >
              <Plus size={20} />
              Agregar Producto
            </button>
          </div>
        </section>

        {/* Observaciones */}
        <section className="card mb-4">
          <div className="card-header bg-info text-white">
            <h2 className="h5 mb-0 fw-bold d-flex align-items-center gap-2">
              <FileText size={24} />
              Observaciones
            </h2>
          </div>
          <div className="card-body">
            <label className="form-label fw-semibold">Observaciones generales</label>
            <textarea
              name="observaciones_almacen"
              value={formData.observaciones_almacen}
              onChange={handleChange}
              rows={4}
              placeholder="Observaciones generales... (Si seleccionaste 'Otro' en el motivo, especifica aquí)"
              className="form-control"
            />
          </div>
        </section>

        {/* Botones */}
        <div className="d-flex justify-content-end gap-2 mb-4">
          <button
            type="submit"
            className="btn btn-primary btn-lg d-flex align-items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Devolución
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoRegistro;