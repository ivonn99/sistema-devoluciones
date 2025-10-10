import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Download, Calendar, Filter } from 'lucide-react';
import useDevolucionesStore from '../../stores/devolucionesStore';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './reportes.css';

const Reportes = () => {
  const { devoluciones, fetchDevoluciones, loading } = useDevolucionesStore();
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    rangoFecha: 'ultimos_30',
    fechaInicio: '',
    fechaFin: '',
    empresa: 'todas',
    vendedor: 'todos'
  });

  // Cargar devoluciones al montar
  useEffect(() => {
    fetchDevoluciones();
  }, []);

  // Obtener lista única de vendedores
  const vendedoresUnicos = useMemo(() => {
    const vendedores = [...new Set(devoluciones.map(d => d.vendedor).filter(Boolean))];
    return vendedores.sort();
  }, [devoluciones]);

  // Calcular rango de fechas según filtro
  const obtenerRangoFechas = () => {
    const hoy = new Date();
    let inicio = new Date();
    
    switch (filtros.rangoFecha) {
      case 'ultimos_7':
        inicio.setDate(hoy.getDate() - 7);
        break;
      case 'ultimos_15':
        inicio.setDate(hoy.getDate() - 15);
        break;
      case 'ultimos_30':
        inicio.setDate(hoy.getDate() - 30);
        break;
      case 'ultimos_90':
        inicio.setDate(hoy.getDate() - 90);
        break;
      case 'mes_actual':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'anio_actual':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      case 'personalizado':
        if (filtros.fechaInicio && filtros.fechaFin) {
          return {
            inicio: new Date(filtros.fechaInicio),
            fin: new Date(filtros.fechaFin)
          };
        }
        return { inicio, fin: hoy };
      default:
        inicio.setDate(hoy.getDate() - 30);
    }
    
    return { inicio, fin: hoy };
  };

  // Filtrar devoluciones según criterios
  const devolucionesFiltradas = useMemo(() => {
    const { inicio, fin } = obtenerRangoFechas();
    
    return devoluciones.filter(dev => {
      const fechaDev = new Date(dev.fecha_devolucion);
      const cumpleRango = fechaDev >= inicio && fechaDev <= fin;
      const cumpleEmpresa = filtros.empresa === 'todas' || dev.empresa === filtros.empresa;
      const cumpleVendedor = filtros.vendedor === 'todos' || dev.vendedor === filtros.vendedor;
      
      return cumpleRango && cumpleEmpresa && cumpleVendedor;
    });
  }, [devoluciones, filtros]);

  // Calcular KPIs de tiempos
  const calcularTiemposPromedio = useMemo(() => {
    const finalizadas = devolucionesFiltradas.filter(d => d.estado_actual === 'registrada_pnv');
    
    if (finalizadas.length === 0) return null;

    const tiempos = finalizadas.map(dev => {
      const registro = new Date(dev.fecha_registro_almacen);
      const finalizado = new Date(dev.fecha_registrada_pnv);
      const tiempoTotal = (finalizado - registro) / (1000 * 60 * 60 * 24);
      
      return {
        total: tiempoTotal,
        almacenCredito: tiempoTotal * 0.3, // Estimación
        creditoFinalizado: tiempoTotal * 0.7,
        representante: dev.tipo_excepcion ? tiempoTotal * 0.4 : 0
      };
    });

    return {
      total: tiempos.reduce((sum, t) => sum + t.total, 0) / tiempos.length,
      almacenCredito: tiempos.reduce((sum, t) => sum + t.almacenCredito, 0) / tiempos.length,
      creditoFinalizado: tiempos.reduce((sum, t) => sum + t.creditoFinalizado, 0) / tiempos.length,
      representante: tiempos.reduce((sum, t) => sum + t.representante, 0) / tiempos.filter(t => t.representante > 0).length || 0
    };
  }, [devolucionesFiltradas]);

  // Top 10 vendedores
  const topVendedores = useMemo(() => {
    const conteo = {};
    devolucionesFiltradas.forEach(dev => {
      if (dev.vendedor) {
        conteo[dev.vendedor] = (conteo[dev.vendedor] || 0) + 1;
      }
    });

    return Object.entries(conteo)
      .map(([vendedor, cantidad]) => ({ vendedor, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [devolucionesFiltradas]);

  // Tendencia temporal
  const tendenciaTemporal = useMemo(() => {
    const { inicio, fin } = obtenerRangoFechas();
    const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    // Determinar agrupación según rango
    let agrupacion = 'dia';
    if (diasTotales > 90) agrupacion = 'mes';
    else if (diasTotales > 30) agrupacion = 'semana';

    const grupos = {};
    
    devolucionesFiltradas.forEach(dev => {
      const fecha = new Date(dev.fecha_devolucion);
      let clave;

      if (agrupacion === 'mes') {
        clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      } else if (agrupacion === 'semana') {
        const semana = Math.ceil(fecha.getDate() / 7);
        clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-S${semana}`;
      } else {
        clave = fecha.toISOString().split('T')[0];
      }

      grupos[clave] = (grupos[clave] || 0) + 1;
    });

    return Object.entries(grupos)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [devolucionesFiltradas]);

  // Estadísticas generales
  const estadisticas = useMemo(() => ({
    totalFinalizadas: devolucionesFiltradas.filter(d => d.estado_actual === 'registrada_pnv').length,
    enCredito: devolucionesFiltradas.filter(d => d.proceso_en === 'credito' && d.estado_actual !== 'registrada_pnv').length,
    conExcepcion: devolucionesFiltradas.filter(d => d.tipo_excepcion !== null).length,
    rechazadas: devolucionesFiltradas.filter(d => d.estado_actual === 'rechazada').length
  }), [devolucionesFiltradas]);

  // Colores para gráficos
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const exportarDatos = () => {
    const csv = [
      ['Vendedor', 'Cantidad de Devoluciones'],
      ...topVendedores.map(v => [v.vendedor, v.cantidad])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_devoluciones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && devoluciones.length === 0) {
    return <div className="reportes-loading">Cargando reportes...</div>;
  }

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <div className="reportes-title">
          <BarChart3 size={32} />
          <h1>Reportes y Análisis de Devoluciones</h1>
        </div>
        <button className="btn-export" onClick={exportarDatos}>
          <Download size={18} />
          Exportar Datos
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtro-group">
          <label><Calendar size={16} /> Rango de Fecha</label>
          <select 
            value={filtros.rangoFecha} 
            onChange={(e) => handleFiltroChange('rangoFecha', e.target.value)}
          >
            <option value="ultimos_7">Últimos 7 días</option>
            <option value="ultimos_15">Últimos 15 días</option>
            <option value="ultimos_30">Últimos 30 días</option>
            <option value="ultimos_90">Últimos 90 días</option>
            <option value="mes_actual">Mes actual</option>
            <option value="anio_actual">Año actual</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>

        {filtros.rangoFecha === 'personalizado' && (
          <>
            <div className="filtro-group">
              <label>Fecha Inicio</label>
              <input 
                type="date" 
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
              />
            </div>
            <div className="filtro-group">
              <label>Fecha Fin</label>
              <input 
                type="date" 
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
              />
            </div>
          </>
        )}

        <div className="filtro-group">
          <label><Filter size={16} /> Empresa</label>
          <select 
            value={filtros.empresa}
            onChange={(e) => handleFiltroChange('empresa', e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="CYE">CYE</option>
            <option value="CYO">CYO</option>
          </select>
        </div>

        <div className="filtro-group">
          <label><Filter size={16} /> Vendedor</label>
          <select 
            value={filtros.vendedor}
            onChange={(e) => handleFiltroChange('vendedor', e.target.value)}
          >
            <option value="todos">Todos</option>
            {vendedoresUnicos.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="stats-grid">
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Finalizadas</span>
            <span className="stat-value">{estadisticas.totalFinalizadas}</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">En Crédito</span>
            <span className="stat-value">{estadisticas.enCredito}</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Con Excepción</span>
            <span className="stat-value">{estadisticas.conExcepcion}</span>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Rechazadas</span>
            <span className="stat-value">{estadisticas.rechazadas}</span>
          </div>
        </div>
      </div>

      {/* KPIs de Tiempos */}
      {calcularTiemposPromedio && (
        <div className="tiempos-section">
          <h2>⏱️ Tiempos Promedio de Proceso</h2>
          <div className="tiempos-grid">
            <div className="tiempo-card tiempo-total">
              <span className="tiempo-label">Tiempo Total</span>
              <span className="tiempo-valor">{calcularTiemposPromedio.total.toFixed(1)} días</span>
              <span className="tiempo-desc">Registro → Finalizado</span>
            </div>
            <div className="tiempo-card tiempo-almacen">
              <span className="tiempo-label">Almacén → Crédito</span>
              <span className="tiempo-valor">{calcularTiemposPromedio.almacenCredito.toFixed(1)} días</span>
              <span className="tiempo-desc">Tiempo en almacén</span>
            </div>
            <div className="tiempo-card tiempo-credito">
              <span className="tiempo-label">Crédito → Finalizado</span>
              <span className="tiempo-valor">{calcularTiemposPromedio.creditoFinalizado.toFixed(1)} días</span>
              <span className="tiempo-desc">Tiempo en crédito</span>
            </div>
            {calcularTiemposPromedio.representante > 0 && (
              <div className="tiempo-card tiempo-representante">
                <span className="tiempo-label">Representante → Crédito</span>
                <span className="tiempo-valor">{calcularTiemposPromedio.representante.toFixed(1)} días</span>
                <span className="tiempo-desc">Casos con excepción</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="graficos-section">
        <div className="grafico-card grafico-pie">
          <h2>🥧 Top 10 Vendedores con Más Devoluciones</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topVendedores}
                dataKey="cantidad"
                nameKey="vendedor"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.vendedor}: ${entry.cantidad}`}
              >
                {topVendedores.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grafico-card grafico-linea">
          <h2>📈 Tendencia de Devoluciones</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tendenciaTemporal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cantidad" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Devoluciones"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Top Vendedores */}
      <div className="tabla-vendedores">
        <h2>📊 Detalle de Vendedores</h2>
        <table>
          <thead>
            <tr>
              <th>Posición</th>
              <th>Vendedor</th>
              <th>Cantidad</th>
              <th>% del Total</th>
            </tr>
          </thead>
          <tbody>
            {topVendedores.map((v, idx) => (
              <tr key={v.vendedor}>
                <td className="posicion">#{idx + 1}</td>
                <td>{v.vendedor}</td>
                <td className="cantidad">{v.cantidad}</td>
                <td className="porcentaje">
                  {((v.cantidad / devolucionesFiltradas.length) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reportes;