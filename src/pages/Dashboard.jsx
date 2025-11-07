// pages/Dashboard.jsx
import { Package, FileText, CreditCard, Warehouse, Users, LogOut, Search, X, Filter, RefreshCw, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../stores/authStore';
import useDevolucionesStore from '../stores/devolucionesStore';
import TablaDevoluciones from './devoluciones/TablaDevoluciones';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { 
    devoluciones,
    searchResults,
    fetchDevoluciones, 
    searchDevoluciones,
    resetDevoluciones,
    resetSearch,
    loading,
    searchLoading 
  } = useDevolucionesStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  
  // Estados para filtros avanzados
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

  // Verificar si hay filtros activos
  const hayFiltrosActivos = Object.values(filters).some(value => value !== '');

  // 🆕 Carga inicial con filtros
  useEffect(() => {
    resetDevoluciones();
    fetchDevoluciones(filters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🆕 Recargar cuando cambien los filtros
  useEffect(() => {
    resetDevoluciones();
    resetSearch();
    setSearchTerm("");
    fetchDevoluciones(filters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // 🆕 Búsqueda en servidor con debounce
  useEffect(() => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    if (searchTerm.trim() === "") {
      resetSearch();
      return;
    }

    const timer = setTimeout(() => {
      resetSearch();
      searchDevoluciones(searchTerm, filters, true);
    }, 500); // Espera 500ms después de que el usuario deje de escribir

    setSearchDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters]);

  // 🆕 Función para cargar más (infinite scroll)
  const handleLoadMore = useCallback(() => {
    if (searchTerm.trim() !== "") {
      searchDevoluciones(searchTerm, filters, false);
    } else {
      fetchDevoluciones(filters, false);
    }
  }, [searchTerm, filters, fetchDevoluciones, searchDevoluciones]);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const limpiarBusqueda = () => {
    setSearchTerm("");
    resetSearch();
  };

  // Manejar cambios en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpiar todos los filtros
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
  };

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
      },
      {
        path: '/clientes',
        icon: UsersRound,
        title: 'Clientes',
        description: 'Buscar y administrar clientes'
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
      },
      {
        path: '/clientes',
        icon: UsersRound,
        title: 'Clientes',
        description: 'Buscar y administrar clientes'
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
      },
      {
        path: '/clientes',
        icon: UsersRound,
        title: 'Clientes',
        description: 'Buscar y administrar clientes'
      }
    ]
  };

  // Métricas calculadas (sobre datos cargados actualmente)
  const dataParaMetricas = searchTerm.trim() !== "" ? searchResults : devoluciones;

  const metricas = {
    total: dataParaMetricas.length,
    concluidos: dataParaMetricas.filter(d => d.estado_actual === 'registrada_pnv').length,
    // Pendientes Almacén: solo correcciones solicitadas por Crédito/Representante
    pendientesAlmacen: dataParaMetricas.filter(d =>
      d.estado_actual === 'requiere_correccion' && d.proceso_en === 'almacen'
    ).length,
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
              {hayFiltrosActivos ? 'Resumen de Filtros Aplicados' : 'Resumen de Datos Cargados'}
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
                <div className="metrica-valor">{metricas.total}{searchTerm.trim() === "" && "+"}</div>
                <div className="metrica-label">
                  {searchTerm.trim() !== "" ? "Resultados" : "Registros Cargados"}
                </div>
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
          {searchTerm.trim() === "" && (
            <p style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280', 
              marginTop: '0.5rem',
              textAlign: 'center'
            }}>
              💡 Los datos se cargan progresivamente a medida que haces scroll
            </p>
          )}
        </section>

        {/* Sección de filtros avanzados */}
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
          <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
            {searchLoading 
              ? '🔍 Buscando en el servidor...' 
              : hayFiltrosActivos
              ? '💡 La búsqueda se aplica sobre los filtros activos'
              : '💡 La búsqueda se realiza en el servidor (espera 0.5s después de escribir)'}
          </small>
        </section>

        {/* Tabla de devoluciones */}
        <section className="dashboard-section">
          <TablaDevoluciones 
            searchTerm={searchTerm}
            isSearching={searchLoading || loading}
            filters={filters}
            onLoadMore={handleLoadMore}
          />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;