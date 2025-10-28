// pages/Dashboard.jsx
import { Package, FileText, CreditCard, Warehouse, Users, LogOut, Eye, Search, X, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import useDevolucionesStore from '../stores/devolucionesStore';
import TablaDevoluciones from './devoluciones/TablaDevoluciones';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { devoluciones, fetchDevoluciones, loading } = useDevolucionesStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // 🆕 Estados para filtros avanzados
  const [filters, setFilters] = useState({
    empresa: '',
    tipo_cliente: '',
    estado_actual: '',
    proceso_en: '',
    fecha_desde: '',
    fecha_hasta: '',
    dentro_plazo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [devolucionesFiltradas, setDevolucionesFiltradas] = useState([]);

  useEffect(() => {
    console.log("🟢 Cargando lista de devoluciones desde Dashboard...");
    fetchDevoluciones();
  }, [fetchDevoluciones]);

  // 🆕 Aplicar filtros avanzados
  useEffect(() => {
    let resultado = [...devoluciones];

    // Filtro por empresa
    if (filters.empresa) {
      resultado = resultado.filter(dev => dev.empresa === filters.empresa);
    }

    // Filtro por tipo de cliente
    if (filters.tipo_cliente) {
      resultado = resultado.filter(dev => dev.tipo_cliente === filters.tipo_cliente);
    }

    // Filtro por estado actual
    if (filters.estado_actual) {
      resultado = resultado.filter(dev => dev.estado_actual === filters.estado_actual);
    }

    // Filtro por proceso
    if (filters.proceso_en) {
      resultado = resultado.filter(dev => dev.proceso_en === filters.proceso_en);
    }

    // Filtro por rango de fechas
    if (filters.fecha_desde) {
      resultado = resultado.filter(dev => 
        new Date(dev.fecha_devolucion) >= new Date(filters.fecha_desde)
      );
    }

    if (filters.fecha_hasta) {
      resultado = resultado.filter(dev => 
        new Date(dev.fecha_devolucion) <= new Date(filters.fecha_hasta)
      );
    }

    // Filtro por dentro de plazo
    if (filters.dentro_plazo !== '') {
      const dentroPlazo = filters.dentro_plazo === 'si';
      resultado = resultado.filter(dev => dev.dentro_plazo === dentroPlazo);
    }

    setDevolucionesFiltradas(resultado);
  }, [devoluciones, filters]);

  // Búsqueda en tiempo real (sobre datos filtrados)
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    const dataParaBuscar = devolucionesFiltradas.length > 0 || Object.values(filters).some(f => f !== '') 
      ? devolucionesFiltradas 
      : devoluciones;

    const results = dataParaBuscar.filter((dev) => {
      return (
        dev.numero_nota?.toLowerCase().includes(term) ||
        dev.cliente?.toLowerCase().includes(term) ||
        dev.empresa?.toLowerCase().includes(term) ||
        dev.tipo_cliente?.toLowerCase().includes(term) ||
        dev.vendedor_nombre?.toLowerCase().includes(term) ||
        dev.motivo_devolucion_general?.toLowerCase().includes(term) ||
        dev.estado_actual?.toLowerCase().includes(term) ||
        dev.proceso_en?.toLowerCase().includes(term) ||
        dev.id?.toString().includes(term)
      );
    });

    setSearchResults(results);
    setShowSearchResults(true);
  }, [searchTerm, devoluciones, devolucionesFiltradas, filters]);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const limpiarBusqueda = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // 🆕 Manejar cambios en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🆕 Limpiar todos los filtros
  const limpiarFiltros = () => {
    setFilters({
      empresa: '',
      tipo_cliente: '',
      estado_actual: '',
      proceso_en: '',
      fecha_desde: '',
      fecha_hasta: '',
      dentro_plazo: ''
    });
    setDevolucionesFiltradas([]);
  };

  // 🆕 Verificar si hay filtros activos
  const hayFiltrosActivos = Object.values(filters).some(value => value !== '');

  // Configuración de accesos por rol
  const accessConfig = {
    jefe_almacen: [
      {
        path: '/devoluciones/nueva',
        icon: Package,
        title: 'Nueva Devolución',
        description: 'Registrar nueva devolución'
      },
      {
        path: '/devoluciones/pendientes-almacen',
        icon: Warehouse,
        title: 'Pendientes Almacén',
        description: 'Revisar devoluciones en almacén'
      }
    ],
    credito_cobranza: [
      {
        path: '/devoluciones/nueva',
        icon: Package,
        title: 'Nueva Devolución',
        description: 'Registrar nueva devolución'
      },
      {
        path: '/devoluciones/pendientes-credito',
        icon: CreditCard,
        title: 'Pendientes Crédito',
        description: 'Revisar devoluciones en crédito'
      }
    ],
    administrador: [
      {
        path: '/devoluciones/nueva',
        icon: Package,
        title: 'Nueva Devolución',
        description: 'Registrar nueva devolución'
      },
      {
        path: '/devoluciones/pendientes-almacen',
        icon: Warehouse,
        title: 'Pendientes Almacén',
        description: 'Revisar devoluciones en almacén'
      },
      {
        path: '/devoluciones/pendientes-credito',
        icon: CreditCard,
        title: 'Pendientes Crédito',
        description: 'Revisar devoluciones en crédito'
      },
      {
        path: '/devoluciones/pendientes-representante',
        icon: Users,
        title: 'Pendientes Representante',
        description: 'Revisar devoluciones del representante'
      },
      {
        path: '/reportes',
        icon: FileText,
        title: 'Reportes',
        description: 'Ver estadísticas y reportes'
      }
    ]
  };

  // Métricas calculadas (sobre datos filtrados o todos)
  const dataParaMetricas = hayFiltrosActivos ? devolucionesFiltradas : devoluciones;
  
  const metricas = {
    total: dataParaMetricas.length,
    concluidos: dataParaMetricas.filter(d => d.estado_actual === 'registrada_pnv').length,
    pendientesAlmacen: dataParaMetricas.filter(d => d.proceso_en === 'almacen' && d.estado_actual !== 'registrada_pnv').length,
    pendientesCredito: dataParaMetricas.filter(d => d.proceso_en === 'credito' && d.estado_actual !== 'registrada_pnv').length,
    pendientesRepresentante: dataParaMetricas.filter(d => d.proceso_en === 'representante' && d.estado_actual !== 'registrada_pnv').length,
  };

  const accessItems = user ? accessConfig[user.rol] || [] : [];

  return (
    <div className="dashboard-public-container">
      <div className="dashboard-public-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div>
              <h1 className="dashboard-title">Dashboard de Devoluciones</h1>
              {user ? (
                <p className="dashboard-welcome">
                  Bienvenido, <strong>{user.nombre || user.email}</strong>
                </p>
              ) : (
                <p className="dashboard-welcome">
                  Bienvenido al sistema de devoluciones
                </p>
              )}
            </div>
            
            {/* Botones de Login/Logout */}
            <div className="dashboard-actions">
              {!user ? (
                <button 
                  onClick={() => navigate('/login')} 
                  className="btn-login"
                >
                  Iniciar Sesión
                </button>
              ) : (
                <button 
                  onClick={handleLogout} 
                  className="btn-logout"
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Accesos rápidos - Solo si hay usuario */}
        {user && accessItems.length > 0 && (
          <section className="dashboard-section">
            <h2 className="section-title">Accesos Rápidos</h2>
            <div className="access-grid">
              {accessItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="access-card"
                  >
                    <Icon size={24} className="access-card-icon" />
                    <h3 className="access-card-title">{item.title}</h3>
                    <p className="access-card-description">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Sección de métricas */}
        <section className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title">
              {hayFiltrosActivos ? 'Resumen de Filtros Aplicados' : 'Resumen General'}
            </h2>
            {hayFiltrosActivos && (
              <span style={{ 
                color: '#3b82f6', 
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Filter size={16} />
                Filtros activos
              </span>
            )}
          </div>
          <div className="metricas-container">
            <div className="metrica-card metrica-total">
              <div className="metrica-icono"><FileText size={24} color="#3b82f6" /></div>
              <div className="metrica-info">
                <div className="metrica-valor">{metricas.total}</div>
                <div className="metrica-label">Total de Registros</div>
              </div>
            </div>

            <div className="metrica-card metrica-concluidos">
              <div className="metrica-icono"><Package size={24} color="#10b981" /></div>
              <div className="metrica-info">
                <div className="metrica-valor">{metricas.concluidos}</div>
                <div className="metrica-label">Concluidos (PNV)</div>
              </div>
            </div>

            <div className="metrica-card metrica-almacen">
              <div className="metrica-icono"><Warehouse size={24} color="#f59e0b" /></div>
              <div className="metrica-info">
                <div className="metrica-valor">{metricas.pendientesAlmacen}</div>
                <div className="metrica-label">Pendientes Almacén</div>
              </div>
            </div>

            <div className="metrica-card metrica-credito">
              <div className="metrica-icono"><CreditCard size={24} color="#8b5cf6" /></div>
              <div className="metrica-info">
                <div className="metrica-valor">{metricas.pendientesCredito}</div>
                <div className="metrica-label">Pendientes Crédito</div>
              </div>
            </div>

            <div className="metrica-card metrica-representante">
              <div className="metrica-icono"><Users size={24} color="#ef4444" /></div>
              <div className="metrica-info">
                <div className="metrica-valor">{metricas.pendientesRepresentante}</div>
                <div className="metrica-label">Pendientes Representante</div>
              </div>
            </div>
          </div>
        </section>

        {/* 🆕 Sección de filtros avanzados */}
        <section className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title">Filtros Avanzados</h2>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: showFilters ? '#3b82f6' : '#e5e7eb',
                color: showFilters ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <Filter size={16} />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>

          {showFilters && (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {/* Filtro por Empresa */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Empresa
                  </label>
                  <select
                    name="empresa"
                    value={filters.empresa}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Todas</option>
                    <option value="Distribuidora">Distribuidora</option>
                    <option value="Rodrigo">Rodrigo</option>
                  </select>
                </div>

                {/* Filtro por Tipo de Cliente */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Tipo de Cliente
                  </label>
                  <select
                    name="tipo_cliente"
                    value={filters.tipo_cliente}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="local">Local</option>
                    <option value="foraneo">Foráneo</option>
                    <option value="consignacion">Consignación</option>
                  </select>
                </div>

                {/* Filtro por Estado */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Estado Actual
                  </label>
                  <select
                    name="estado_actual"
                    value={filters.estado_actual}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="registrada">Registrada</option>
                    <option value="aprobada_almacen">Aprobada Almacén</option>
                    <option value="requiere_correccion">Requiere Corrección</option>
                    <option value="requiere_autorizacion">Requiere Autorización</option>
                    <option value="autorizada">Autorizada</option>
                    <option value="rechazada">Rechazada</option>
                    <option value="registrada_pnv">Registrada PNV</option>
                  </select>
                </div>

                {/* Filtro por Proceso */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Proceso en
                  </label>
                  <select
                    name="proceso_en"
                    value={filters.proceso_en}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="almacen">Almacén</option>
                    <option value="credito">Crédito</option>
                    <option value="representante">Representante</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>

                {/* Filtro por Dentro de Plazo */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Dentro de Plazo
                  </label>
                  <select
                    name="dentro_plazo"
                    value={filters.dentro_plazo}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>

                {/* Filtro por Fecha Desde */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    name="fecha_desde"
                    value={filters.fecha_desde}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Filtro por Fecha Hasta */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    name="fecha_hasta"
                    value={filters.fecha_hasta}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Botón para limpiar filtros */}
              {hayFiltrosActivos && (
                <button
                  onClick={limpiarFiltros}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <RefreshCw size={16} />
                  Limpiar Filtros
                </button>
              )}
            </div>
          )}
        </section>

        {/* Sección de búsqueda */}
        <section className="dashboard-section">
          <h2 className="section-title">Buscar Devoluciones</h2>
          <div className="busqueda-container">
            <Search className="busqueda-icon" size={20} color="#3b82f6" />
            <input
              type="text"
              className="busqueda-input"
              placeholder="Buscar por nota, cliente, empresa, vendedor, motivo, estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="busqueda-clear" onClick={limpiarBusqueda}>
                <X size={18} />
              </button>
            )}
          </div>
          {hayFiltrosActivos && (
            <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
              💡 La búsqueda se aplica sobre los resultados filtrados
            </small>
          )}
        </section>

        {/* Tabla de devoluciones */}
        <section className="dashboard-section">
          <TablaDevoluciones 
            searchTerm={searchTerm}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            loading={loading}
            devolucionesFiltradas={devolucionesFiltradas}
            hayFiltrosActivos={hayFiltrosActivos}
          />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;