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
    if (formData.cliente) return;
    
    const timer = setTimeout(async () => {
      if (searchCliente !== null) {
        setIsSearching(true);
        await searchClientes(searchCliente);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchCliente, formData.cliente]);

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
    <div className="nuevo-registro-container">
      <div className="nuevo-registro-wrapper">
        <header className="nuevo-registro-header">
          <h1 className="nuevo-registro-title">
            <Package size={32} className="title-icon" />
            Nueva Devolución
          </h1>
          <p className="nuevo-registro-subtitle">Registra una nueva devolución en el sistema</p>
        </header>

        {error && (
          <div className="nuevo-registro-alert error">
            <AlertCircle />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="nuevo-registro-form">
        {/* Información General */}
        <section className="form-section">
          <h2 className="form-section-title">Información General</h2>
          <div className="form-grid cols-2">
            <div className="form-group">
              <label className="form-label">Empresa</label>
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

            <div className="form-group">
              <label className="form-label">Número de Nota</label>
              <input
                type="text"
                name="numero_nota"
                value={formData.numero_nota}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Remisión</label>
              <input
                type="date"
                name="fecha_remision"
                value={formData.fecha_remision}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Devolución</label>
              <input
                type="date"
                name="fecha_devolucion"
                value={formData.fecha_devolucion}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className={`search-group ${formData.cliente ? 'selected' : searchCliente && clientes.length > 0 ? 'has-results' : searchCliente && clientes.length === 0 ? 'no-results' : ''}`}>
              <label className="search-label">
                <Search size={16} className="search-icon" />
                Cliente (búsqueda en servidor)
              </label>
              <input
                type="text"
                placeholder="Escribe para buscar cliente..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className={`search-input ${isSearching ? 'loading' : ''}`}
              />
              <select
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                required
                disabled={loadingClientes || (!searchCliente && !formData.cliente)}
                size={searchCliente && !formData.cliente ? Math.min(clientes.length + 1, 8) : 1}
                className="search-select"
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
                <small className="search-hint searching">🔍 Buscando en el servidor...</small>
              )}
              {searchCliente && clientes.length === 0 && !isSearching && (
                <small className="search-hint warning">
                  ⚠️ No se encontraron resultados para "{searchCliente}"
                </small>
              )}
              {formData.cliente && (
                <small className="search-hint" style={{ color: '#10b981' }}>
                  ✓ Cliente seleccionado
                </small>
              )}
            </div>

            <div className={`search-group ${formData.vendedor_nombre ? 'selected' : searchVendedor && vendedoresFiltrados.length > 0 ? 'has-results' : searchVendedor && vendedoresFiltrados.length === 0 ? 'no-results' : ''}`}>
              <label className="search-label">
                <Search size={16} className="search-icon" />
                Vendedor
              </label>
              <input
                type="text"
                placeholder="Buscar vendedor..."
                value={searchVendedor}
                onChange={(e) => setSearchVendedor(e.target.value)}
                disabled={loadingVendedores}
                className={`search-input ${loadingVendedores ? 'loading' : ''}`}
              />
              <select
                name="vendedor_nombre"
                value={formData.vendedor_nombre}
                onChange={handleChange}
                required
                disabled={loadingVendedores || (!searchVendedor && !formData.vendedor_nombre)}
                size={searchVendedor && !formData.vendedor_nombre ? Math.min(vendedoresFiltrados.length + 1, 8) : 1}
                className="search-select"
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
                <small className="search-hint searching">⏳ Cargando vendedores...</small>
              )}
              {searchVendedor && vendedoresFiltrados.length === 0 && !loadingVendedores && (
                <small className="search-hint warning">
                  ⚠️ No se encontraron resultados para "{searchVendedor}"
                </small>
              )}
              {formData.vendedor_nombre && (
                <small className="search-hint" style={{ color: '#10b981' }}>
                  ✓ Vendedor seleccionado
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Cliente</label>
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

            <div className="form-group">
              <label className="form-label">Tipo de Devolución</label>
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

          <div className="form-grid cols-3 mt-md">
            <div className="checkbox-group">
              <input
                type="checkbox"
                name="tiene_registro_libreta"
                checked={formData.tiene_registro_libreta}
                onChange={handleChange}
                id="registro-libreta"
              />
              <label htmlFor="registro-libreta">
                Tiene registro en libreta
              </label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                name="ticket_fisico_presentado"
                checked={formData.ticket_fisico_presentado}
                onChange={handleChange}
                id="ticket-fisico"
              />
              <label htmlFor="ticket-fisico">
                Ticket físico presentado
              </label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                name="contiene_producto_no_devolvible"
                checked={formData.contiene_producto_no_devolvible}
                onChange={handleChange}
                id="producto-no-devolvible"
              />
              <label htmlFor="producto-no-devolvible">
                ⚠️ Contiene producto NO devolvible
              </label>
            </div>
          </div>

          {/* ✅ MOTIVO GENERAL DE DEVOLUCIÓN */}
          <div className="form-group mt-md">
            <label className="form-label" style={{ 
              fontSize: '1rem', 
              fontWeight: '600',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FileText size={20} />
              Motivo General de Devolución
            </label>
            <select
              name="motivo_devolucion_general"
              value={formData.motivo_devolucion_general}
              onChange={handleChange}
              required
              className="form-select"
              style={{ 
                borderColor: formData.motivo_devolucion_general ? '#10b981' : '#d1d5db',
                borderWidth: '2px'
              }}
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
              <small style={{ 
                color: '#10b981', 
                fontSize: '0.875rem',
                display: 'block',
                marginTop: '4px'
              }}>
                ✓ Este motivo aplica para toda la devolución
              </small>
            )}
          </div>
        </section>

        {/* Productos */}
        <section className="form-section">
          <h2 className="form-section-title">Productos</h2>
          
          {formData.productos.map((producto, index) => (
            <div key={index} className="producto-card">
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label">Concepto/Sustancia</label>
                  <input
                    type="text"
                    value={producto.concepto_sustancia}
                    onChange={(e) => handleProductChange(index, 'concepto_sustancia', e.target.value)}
                    required
                    className="form-input"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={producto.cantidad}
                    onChange={(e) => handleProductChange(index, 'cantidad', e.target.value)}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado del Producto</label>
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

                <div className="form-group">
                  <label className="form-label">Comentarios adicionales (opcional)</label>
                  <input
                    type="text"
                    value={producto.comentarios}
                    onChange={(e) => handleProductChange(index, 'comentarios', e.target.value)}
                    className="form-input"
                    placeholder="Detalles específicos de este producto..."
                  />
                </div>
              </div>

              {formData.productos.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger mt-md"
                  onClick={() => removeProduct(index)}
                >
                  <Trash2 size={20} />
                  <span>Eliminar Producto</span>
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-primary"
            onClick={addProduct}
          >
            <Plus size={20} />
            <span>Agregar Producto</span>
          </button>
        </section>

        {/* Observaciones */}
        <section className="form-section">
          <h2 className="form-section-title">Observaciones</h2>
          <div className="form-group">
            <textarea
              name="observaciones_almacen"
              value={formData.observaciones_almacen}
              onChange={handleChange}
              rows={4}
              placeholder="Observaciones generales... (Si seleccionaste 'Otro' en el motivo, especifica aquí)"
              className="form-textarea"
            />
          </div>
        </section>

        {/* Botones */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={20} />
            <span>{loading ? 'Guardando...' : 'Guardar Devolución'}</span>
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoRegistro;