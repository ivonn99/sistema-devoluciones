import { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Download, Calendar, Filter, User, Package } from 'lucide-react';
import useDevolucionesStore from '../../stores/devolucionesStore';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './reportes.css';

// Helper para convertir timestamp UTC a hora CDMX (maneja DST correctamente)
const convertirAHoraCDMX = (fechaUTC) => {
  if (!fechaUTC) return "-";
  const fecha = new Date(fechaUTC);
  const opciones = {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  const partes = new Intl.DateTimeFormat('es-MX', opciones).formatToParts(fecha);
  const valores = Object.fromEntries(partes.map(p => [p.type, p.value]));
  return `${valores.day}/${valores.month}/${valores.year}, ${valores.hour}:${valores.minute}:${valores.second}`;
};

// Helper para solo fecha (sin hora) con timezone CDMX
const convertirSoloFechaCDMX = (fechaUTC) => {
  if (!fechaUTC) return "-";
  const fecha = new Date(fechaUTC);
  const opciones = {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  const partes = new Intl.DateTimeFormat('es-MX', opciones).formatToParts(fecha);
  const valores = Object.fromEntries(partes.map(p => [p.type, p.value]));
  return `${valores.day}/${valores.month}/${valores.year}`;
};

// Helper para normalizar fecha al inicio del día en CDMX
const normalizarInicioDiaCDMX = (fecha) => {
  if (!fecha) return null;
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  
  // Obtener partes de la fecha en CDMX
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(fechaObj);
  
  const valores = Object.fromEntries(partes.map(p => [p.type, p.value]));
  // Crear fecha a medianoche en hora local (JavaScript manejará la conversión)
  return new Date(`${valores.year}-${valores.month}-${valores.day}T00:00:00`);
};

// Helper para normalizar fecha al final del día en CDMX
const normalizarFinDiaCDMX = (fecha) => {
  if (!fecha) return null;
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  
  // Obtener partes de la fecha en CDMX
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(fechaObj);
  
  const valores = Object.fromEntries(partes.map(p => [p.type, p.value]));
  // Crear fecha a las 23:59:59 en hora local
  return new Date(`${valores.year}-${valores.month}-${valores.day}T23:59:59.999`);
};

// Helper para obtener fecha actual en CDMX (fin del día)
const obtenerFechaActualCDMX = () => {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(ahora);
  
  const valores = Object.fromEntries(partes.map(p => [p.type, p.value]));
  return new Date(`${valores.year}-${valores.month}-${valores.day}T23:59:59.999`);
};

const Reportes = () => {
  const { fetchAllDevolucionesForReports, loading } = useDevolucionesStore();
  const [devolucionesParaReportes, setDevolucionesParaReportes] = useState([]);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    rangoFecha: 'ultimos_30',
    fechaInicio: '',
    fechaFin: '',
    empresa: 'todas',
    vendedor: 'todos'
  });

  // Cargar todas las devoluciones del último año para reportes
  useEffect(() => {
    const cargarDevoluciones = async () => {
      const filtrosReporte = {
        empresa: filtros.empresa === 'todas' ? undefined : filtros.empresa
      };
      const resultado = await fetchAllDevolucionesForReports(filtrosReporte);
      if (resultado.success) {
        setDevolucionesParaReportes(resultado.data || []);
      }
    };
    
    cargarDevoluciones();
  }, [filtros.empresa]); // Recargar cuando cambie el filtro de empresa

  // Obtener lista única de vendedores
  const vendedoresUnicos = useMemo(() => {
    const vendedores = [...new Set(devolucionesParaReportes.map(d => d.vendedor_nombre).filter(Boolean))];
    return vendedores.sort();
  }, [devolucionesParaReportes]);

  // Calcular rango de fechas según filtro (normalizado a CDMX)
  const obtenerRangoFechas = () => {
    const hoyCDMX = obtenerFechaActualCDMX();
    let inicio = new Date();
    let fin = hoyCDMX;
    
    switch (filtros.rangoFecha) {
      case 'ultimos_7': {
        const fechaInicio = new Date(hoyCDMX);
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        inicio = normalizarInicioDiaCDMX(fechaInicio);
        fin = hoyCDMX;
        break;
      }
      case 'ultimos_15': {
        const fechaInicio = new Date(hoyCDMX);
        fechaInicio.setDate(fechaInicio.getDate() - 15);
        inicio = normalizarInicioDiaCDMX(fechaInicio);
        fin = hoyCDMX;
        break;
      }
      case 'ultimos_30': {
        const fechaInicio = new Date(hoyCDMX);
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        inicio = normalizarInicioDiaCDMX(fechaInicio);
        fin = hoyCDMX;
        break;
      }
      case 'ultimos_90': {
        const fechaInicio = new Date(hoyCDMX);
        fechaInicio.setDate(fechaInicio.getDate() - 90);
        inicio = normalizarInicioDiaCDMX(fechaInicio);
        fin = hoyCDMX;
        break;
      }
      case 'mes_actual': {
        const ahora = new Date();
        const fechaCDMX = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        inicio = new Date(fechaCDMX.getFullYear(), fechaCDMX.getMonth(), 1);
        fin = hoyCDMX;
        break;
      }
      case 'anio_actual': {
        const ahora = new Date();
        const fechaCDMX = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        inicio = new Date(fechaCDMX.getFullYear(), 0, 1);
        fin = hoyCDMX;
        break;
      }
      case 'personalizado':
        if (filtros.fechaInicio && filtros.fechaFin) {
          return {
            inicio: normalizarInicioDiaCDMX(filtros.fechaInicio),
            fin: normalizarFinDiaCDMX(filtros.fechaFin)
          };
        }
        return { inicio: normalizarInicioDiaCDMX(new Date()), fin: hoyCDMX };
      default: {
        const fechaInicio = new Date(hoyCDMX);
        fechaInicio.setDate(fechaInicio.getDate() - 30);
        inicio = normalizarInicioDiaCDMX(fechaInicio);
        fin = hoyCDMX;
      }
    }
    
    return { inicio, fin };
  };

  // Filtrar devoluciones según criterios (con manejo correcto de fechas)
  const devolucionesFiltradas = useMemo(() => {
    const { inicio, fin } = obtenerRangoFechas();
    
    if (!inicio || !fin) return [];
    
    return devolucionesParaReportes.filter(dev => {
      if (!dev.fecha_devolucion) return false;
      
      // Convertir fecha de devolución a objeto Date y comparar
      const fechaDev = new Date(dev.fecha_devolucion);
      
      // Comparar considerando zona horaria CDMX
      const cumpleRango = fechaDev >= inicio && fechaDev <= fin;
      // Empresa ya está filtrada en la carga inicial
      const cumpleVendedor = filtros.vendedor === 'todos' || dev.vendedor_nombre === filtros.vendedor;

      return cumpleRango && cumpleVendedor;
    });
  }, [devolucionesParaReportes, filtros]);

  // Calcular KPIs de tiempos con fechas reales
  const calcularTiemposPromedio = useMemo(() => {
    const finalizadas = devolucionesFiltradas.filter(d => 
      d.estado_actual === 'registrada_pnv' && 
      d.fecha_registro_almacen && 
      d.fecha_registrada_pnv
    );
    
    if (finalizadas.length === 0) return null;

    const tiempos = finalizadas.map(dev => {
      const registro = new Date(dev.fecha_registro_almacen);
      const finalizado = new Date(dev.fecha_registrada_pnv);
      
      // Calcular tiempo total en días (con decimales)
      const tiempoTotalMs = finalizado - registro;
      const tiempoTotal = tiempoTotalMs / (1000 * 60 * 60 * 24);
      
      // Si hay fecha de paso a crédito, calcular tiempos reales
      // Por ahora usamos estimaciones si no hay datos de seguimiento
      let almacenCredito = tiempoTotal * 0.4; // Estimación: 40% del tiempo
      let creditoFinalizado = tiempoTotal * 0.6; // Estimación: 60% del tiempo
      
      // Si es excepción, ajustar tiempos (hay paso por representante)
      const esExcepcion = dev.tipo_excepcion !== null && dev.tipo_excepcion !== undefined;
      let representante = 0;
      
      if (esExcepcion) {
        representante = tiempoTotal * 0.3; // Estimación para excepciones
        almacenCredito = tiempoTotal * 0.3;
        creditoFinalizado = tiempoTotal * 0.4;
      }
      
      return {
        total: tiempoTotal,
        almacenCredito: almacenCredito > 0 ? almacenCredito : 0,
        creditoFinalizado: creditoFinalizado > 0 ? creditoFinalizado : 0,
        representante: representante > 0 ? representante : 0
      };
    });

    const totalPromedio = tiempos.reduce((sum, t) => sum + t.total, 0) / tiempos.length;
    const almacenPromedio = tiempos.reduce((sum, t) => sum + t.almacenCredito, 0) / tiempos.length;
    const creditoPromedio = tiempos.reduce((sum, t) => sum + t.creditoFinalizado, 0) / tiempos.length;
    const tiemposRepresentante = tiempos.filter(t => t.representante > 0);
    const representantePromedio = tiemposRepresentante.length > 0
      ? tiemposRepresentante.reduce((sum, t) => sum + t.representante, 0) / tiemposRepresentante.length
      : 0;

    return {
      total: totalPromedio,
      almacenCredito: almacenPromedio,
      creditoFinalizado: creditoPromedio,
      representante: representantePromedio
    };
  }, [devolucionesFiltradas]);

  // Obtener período amplio para análisis de top vendedores (último año o todos)
  // Ya tenemos todas las devoluciones del último año cargadas en devolucionesParaReportes
  const obtenerDevolucionesParaTopVendedores = useMemo(() => {
    // Ya están filtradas por empresa en la carga inicial
    // Devolver todas las devoluciones cargadas (ya son del último año)
    return devolucionesParaReportes.filter(dev => {
      if (!dev.fecha_devolucion) return false;
      // Ya están filtradas por empresa en fetchAllDevolucionesForReports
      return true;
    });
  }, [devolucionesParaReportes]);

  // Top 10 vendedores con análisis detallado (evaluación en el tiempo - último año)
  const topVendedores = useMemo(() => {
    const conteo = {};
    const totalParaPorcentaje = obtenerDevolucionesParaTopVendedores.length;
    
    obtenerDevolucionesParaTopVendedores.forEach(dev => {
      if (dev.vendedor_nombre) {
        if (!conteo[dev.vendedor_nombre]) {
          conteo[dev.vendedor_nombre] = {
            total: 0,
            finalizadas: 0,
            enProceso: 0,
            conExcepcion: 0,
            rechazadas: 0,
            productos: new Set(),
            empresas: new Set()
          };
        }
        conteo[dev.vendedor_nombre].total++;
        // Contar productos únicos de devoluciones_detalle
        if (dev.devoluciones_detalle && Array.isArray(dev.devoluciones_detalle)) {
          dev.devoluciones_detalle.forEach(detalle => {
            if (detalle.concepto_sustancia) {
              conteo[dev.vendedor_nombre].productos.add(detalle.concepto_sustancia);
            }
          });
        }
        conteo[dev.vendedor_nombre].empresas.add(dev.empresa);

        if (dev.estado_actual === 'registrada_pnv') conteo[dev.vendedor_nombre].finalizadas++;
        else if (dev.estado_actual === 'rechazada') conteo[dev.vendedor_nombre].rechazadas++;
        else conteo[dev.vendedor_nombre].enProceso++;

        if (dev.tipo_excepcion) conteo[dev.vendedor_nombre].conExcepcion++;
      }
    });

    return Object.entries(conteo)
      .map(([vendedor, datos]) => ({
        vendedor,
        cantidad: datos.total,
        finalizadas: datos.finalizadas,
        enProceso: datos.enProceso,
        conExcepcion: datos.conExcepcion,
        rechazadas: datos.rechazadas,
        numProductos: datos.productos.size,
        empresas: Array.from(datos.empresas).join(', '),
        porcentaje: totalParaPorcentaje > 0 ? (datos.total / totalParaPorcentaje) * 100 : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [obtenerDevolucionesParaTopVendedores]);

  // Tendencia temporal: usar período amplio pero mostrar el rango filtrado
  const tendenciaTemporal = useMemo(() => {
    const { inicio, fin } = obtenerRangoFechas();
    if (!inicio || !fin) return [];
    
    const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    
    // Determinar agrupación según rango
    let agrupacion = 'dia';
    if (diasTotales > 180) agrupacion = 'mes';
    else if (diasTotales > 30) agrupacion = 'semana';
    else agrupacion = 'dia';

    const grupos = {};
    
    // Usar devoluciones filtradas para la tendencia (respetar el rango seleccionado)
    devolucionesFiltradas.forEach(dev => {
      if (!dev.fecha_devolucion) return;
      
      const fecha = new Date(dev.fecha_devolucion);
      // Convertir a fecha en CDMX para agrupación correcta
      const fechaCDMX = new Date(fecha.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
      let clave;
      let etiqueta;

      if (agrupacion === 'mes') {
        const mes = fechaCDMX.getMonth() + 1;
        const anio = fechaCDMX.getFullYear();
        clave = `${anio}-${String(mes).padStart(2, '0')}`;
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        etiqueta = `${meses[mes - 1]} ${anio}`;
      } else if (agrupacion === 'semana') {
        // Calcular número de semana del año
        const inicioAnio = new Date(fechaCDMX.getFullYear(), 0, 1);
        const diasDesdeInicio = Math.floor((fechaCDMX - inicioAnio) / (1000 * 60 * 60 * 24));
        const semana = Math.ceil((diasDesdeInicio + inicioAnio.getDay() + 1) / 7);
        const anio = fechaCDMX.getFullYear();
        clave = `${anio}-W${String(semana).padStart(2, '0')}`;
        etiqueta = `Sem ${semana} ${anio}`;
      } else {
        // Día: formato DD/MM
        const dia = String(fechaCDMX.getDate()).padStart(2, '0');
        const mes = String(fechaCDMX.getMonth() + 1).padStart(2, '0');
        const anio = fechaCDMX.getFullYear();
        clave = `${anio}-${mes}-${dia}`;
        etiqueta = `${dia}/${mes}`;
      }

      if (!grupos[clave]) {
        grupos[clave] = { cantidad: 0, etiqueta };
      }
      grupos[clave].cantidad++;
    });

    return Object.entries(grupos)
      .map(([fechaKey, datos]) => ({ 
        fecha: datos.etiqueta, 
        fechaKey: fechaKey, // Para ordenamiento
        cantidad: datos.cantidad 
      }))
      .sort((a, b) => a.fechaKey.localeCompare(b.fechaKey));
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
      ['Vendedor', 'Total', 'Finalizadas', 'En Proceso', 'Rechazadas', 'Con Excepción', '# Productos', 'Empresas', '% del Total'],
      ...topVendedores.map(v => [
        v.vendedor,
        v.cantidad,
        v.finalizadas,
        v.enProceso,
        v.rechazadas,
        v.conExcepcion,
        v.numProductos,
        v.empresas,
        v.porcentaje.toFixed(1) + '%'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_devoluciones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && devolucionesParaReportes.length === 0) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <h5>Cargando reportes...</h5>
            <p className="text-muted">Obteniendo todas las devoluciones del último año</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="card border-primary mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <BarChart3 size={32} />
              <h1 className="h3 mb-0 fw-bold">Reportes y Análisis de Devoluciones</h1>
            </div>
            <button className="btn btn-light d-flex align-items-center gap-2" onClick={exportarDatos}>
              <Download size={18} />
              Exportar Datos
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0 d-flex align-items-center gap-2">
            <Filter size={20} />
            Filtros
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Calendar size={16} />
                Rango de Fecha
              </label>
              <select 
                className="form-select"
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
                <div className="col-md-6 col-lg-3">
                  <label className="form-label fw-semibold">Fecha Inicio</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={filtros.fechaInicio}
                    onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                  />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label fw-semibold">Fecha Fin</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={filtros.fechaFin}
                    onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Filter size={16} />
                Empresa
              </label>
              <select 
                className="form-select"
                value={filtros.empresa}
                onChange={(e) => handleFiltroChange('empresa', e.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="Distribuidora">Distribuidora</option>
                <option value="Rodrigo">Rodrigo</option>
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label fw-semibold d-flex align-items-center gap-2">
                <Filter size={16} />
                Vendedor
              </label>
              <select 
                className="form-select"
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
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-success shadow-sm hover-lift">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <TrendingUp size={32} className="text-success" />
                <span className="badge bg-success bg-opacity-10 text-success">Finalizadas</span>
              </div>
              <div className="h3 mb-0 fw-bold text-success">{estadisticas.totalFinalizadas}</div>
              <small className="text-muted">Total Finalizadas</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-info shadow-sm hover-lift">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <Clock size={32} className="text-info" />
                <span className="badge bg-info bg-opacity-10 text-info">En Proceso</span>
              </div>
              <div className="h3 mb-0 fw-bold text-info">{estadisticas.enCredito}</div>
              <small className="text-muted">En Crédito</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-warning shadow-sm hover-lift">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <AlertTriangle size={32} className="text-warning" />
                <span className="badge bg-warning bg-opacity-10 text-warning">Excepciones</span>
              </div>
              <div className="h3 mb-0 fw-bold text-warning">{estadisticas.conExcepcion}</div>
              <small className="text-muted">Con Excepción</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-danger shadow-sm hover-lift">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <AlertTriangle size={32} className="text-danger" />
                <span className="badge bg-danger bg-opacity-10 text-danger">Rechazadas</span>
              </div>
              <div className="h3 mb-0 fw-bold text-danger">{estadisticas.rechazadas}</div>
              <small className="text-muted">Rechazadas</small>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs de Tiempos */}
      {calcularTiemposPromedio && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-light">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <Clock size={20} />
                ⏱️ Tiempos Promedio de Proceso
              </h5>
              <small className="text-muted">
                Basado en {devolucionesFiltradas.filter(d => d.estado_actual === 'registrada_pnv' && d.fecha_registro_almacen && d.fecha_registrada_pnv).length} devoluciones finalizadas
              </small>
            </div>
          </div>
          <div className="card-body">
            <div className="alert alert-info d-flex align-items-start gap-2 mb-3">
              <AlertTriangle size={18} className="mt-1" />
              <small className="mb-0">
                <strong>Nota:</strong> Los tiempos de almacén→crédito y crédito→finalizado son estimaciones basadas en promedios. 
                Para tiempos exactos, consulta el historial de seguimiento de cada devolución.
              </small>
            </div>
            <div className="row g-3">
              <div className="col-md-6 col-lg-3">
                <div className="card bg-primary text-white shadow-sm">
                  <div className="card-body text-center">
                    <div className="h2 mb-1 fw-bold">{calcularTiemposPromedio.total.toFixed(1)}</div>
                    <div className="small mb-3">días</div>
                    <div className="small opacity-75 fw-semibold">Tiempo Total</div>
                    <div className="small opacity-50">Registro → Finalizado</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="card bg-warning text-dark shadow-sm">
                  <div className="card-body text-center">
                    <div className="h2 mb-1 fw-bold">{calcularTiemposPromedio.almacenCredito.toFixed(1)}</div>
                    <div className="small mb-3">días</div>
                    <div className="small opacity-75 fw-semibold">Almacén → Crédito</div>
                    <div className="small opacity-50">Tiempo estimado</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="card bg-info text-white shadow-sm">
                  <div className="card-body text-center">
                    <div className="h2 mb-1 fw-bold">{calcularTiemposPromedio.creditoFinalizado.toFixed(1)}</div>
                    <div className="small mb-3">días</div>
                    <div className="small opacity-75 fw-semibold">Crédito → Finalizado</div>
                    <div className="small opacity-50">Tiempo estimado</div>
                  </div>
                </div>
              </div>
              {calcularTiemposPromedio.representante > 0 && (
                <div className="col-md-6 col-lg-3">
                  <div className="card bg-secondary text-white shadow-sm">
                    <div className="card-body text-center">
                      <div className="h2 mb-1 fw-bold">{calcularTiemposPromedio.representante.toFixed(1)}</div>
                      <div className="small mb-3">días</div>
                      <div className="small opacity-75 fw-semibold">Representante → Crédito</div>
                      <div className="small opacity-50">Casos con excepción</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <User size={20} />
                Top 10 Vendedores con Más Devoluciones
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info d-flex align-items-start gap-2 mb-3">
                <AlertTriangle size={18} className="mt-1" />
                <small className="mb-0">
                  <strong>Período de análisis:</strong> Último año completo (evaluación histórica en el tiempo). 
                  Los filtros de empresa se aplican, pero el período es fijo para comparación justa.
                </small>
              </div>
              {topVendedores.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topVendedores} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="category" dataKey="vendedor" angle={-45} textAnchor="end" height={100} />
                    <YAxis type="number" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value, name) => {
                        const labels = {
                          cantidad: 'Total',
                          finalizadas: 'Finalizadas',
                          enProceso: 'En Proceso',
                          rechazadas: 'Rechazadas'
                        };
                        return [value, labels[name] || name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#3b82f6" name="Total" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="finalizadas" fill="#10b981" name="Finalizadas" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="enProceso" fill="#f59e0b" name="En Proceso" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="rechazadas" fill="#ef4444" name="Rechazadas" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <User size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay datos de vendedores para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <TrendingUp size={20} />
                Tendencia de Devoluciones
              </h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info d-flex align-items-start gap-2 mb-3">
                <Calendar size={18} className="mt-1" />
                <small className="mb-0">
                  <strong>Período de análisis:</strong> {filtros.rangoFecha === 'personalizado' 
                    ? `Del ${filtros.fechaInicio || 'inicio'} al ${filtros.fechaFin || 'fin'}`
                    : `Rango seleccionado: ${filtros.rangoFecha.replace('_', ' ')}`
                  }. La tendencia muestra la evolución en el período filtrado.
                </small>
              </div>
              {tendenciaTemporal.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={tendenciaTemporal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fecha" 
                      angle={tendenciaTemporal.length > 10 ? -45 : 0}
                      textAnchor={tendenciaTemporal.length > 10 ? "end" : "middle"}
                      height={tendenciaTemporal.length > 10 ? 80 : 30}
                      interval="preserveStartEnd"
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value) => [`${value} devoluciones`, 'Cantidad']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cantidad"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Devoluciones"
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <TrendingUp size={48} className="text-muted mb-3" />
                  <p className="text-muted">No hay datos de tendencia para mostrar en el período seleccionado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Top Vendedores */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0 d-flex align-items-center gap-2">
              <Package size={20} />
              Detalle Completo de Vendedores (Top 10)
            </h5>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-primary">
                {topVendedores.length} vendedores
              </span>
              <small className="opacity-75">Último año</small>
            </div>
          </div>
          <small className="opacity-75 mt-2 d-block">
            Evaluación histórica: análisis del último año completo para comparación justa en el tiempo
          </small>
        </div>
        <div className="card-body p-0">
          {topVendedores.length > 0 ? (
            <>
              {/* Vista de tabla (desktop) */}
              <div className="table-responsive tabla-top-vendedores-desktop">
                <table className="table table-hover table-striped align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center" style={{ width: '50px' }}>#</th>
                      <th>Vendedor</th>
                      <th className="text-center">Total</th>
                      <th className="text-center">Finalizadas</th>
                      <th className="text-center">En Proceso</th>
                      <th className="text-center">Rechazadas</th>
                      <th className="text-center">Con Excepción</th>
                      <th className="text-center"># Productos</th>
                      <th>Empresas</th>
                      <th className="text-center">% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVendedores.map((v, idx) => {
                      return (
                        <tr key={v.vendedor} className={idx < 3 ? 'table-primary' : ''}>
                          <td className="text-center fw-bold">
                            {idx === 0 && '🥇'}
                            {idx === 1 && '🥈'}
                            {idx === 2 && '🥉'}
                            {idx >= 3 && `#${idx + 1}`}
                          </td>
                          <td>
                            <strong className="d-block">{v.vendedor}</strong>
                            <small className="text-muted">{v.empresas}</small>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary fs-6">{v.cantidad}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success">{v.finalizadas}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-warning text-dark">{v.enProceso}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-danger">{v.rechazadas}</span>
                          </td>
                          <td className="text-center">
                            {v.conExcepcion > 0 ? (
                              <span className="badge bg-info">{v.conExcepcion}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="badge bg-secondary">{v.numProductos}</span>
                          </td>
                          <td>
                            <small className="text-muted">{v.empresas}</small>
                          </td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <div className="progress" style={{ width: '60px', height: '20px' }}>
                                <div 
                                  className="progress-bar bg-primary" 
                                  role="progressbar" 
                                  style={{ width: `${v.porcentaje}%` }}
                                  aria-valuenow={v.porcentaje} 
                                  aria-valuemin="0" 
                                  aria-valuemax="100"
                                ></div>
                              </div>
                              <span className="fw-semibold">{v.porcentaje.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista de cards (móvil/tablet) */}
              <div className="cards-view-vendedores p-3">
                {topVendedores.map((v, idx) => (
                  <div key={v.vendedor} className={`card-vendedor ${idx < 3 ? 'top-3' : ''}`}>
                    <div className="card-vendedor-header">
                      <div className="card-vendedor-rank">
                        {idx === 0 && '🥇'}
                        {idx === 1 && '🥈'}
                        {idx === 2 && '🥉'}
                        {idx >= 3 && `#${idx + 1}`}
                      </div>
                      <div className="card-vendedor-info flex-grow-1 ms-3">
                        <h4>{v.vendedor}</h4>
                        <small>{v.empresas}</small>
                      </div>
                    </div>
                    
                    <div className="card-vendedor-body">
                      <div className="card-vendedor-stat">
                        <div className="card-vendedor-stat-label">Total</div>
                        <div className="card-vendedor-stat-value text-primary">{v.cantidad}</div>
                      </div>
                      <div className="card-vendedor-stat">
                        <div className="card-vendedor-stat-label">Finalizadas</div>
                        <div className="card-vendedor-stat-value text-success">{v.finalizadas}</div>
                      </div>
                      <div className="card-vendedor-stat">
                        <div className="card-vendedor-stat-label">En Proceso</div>
                        <div className="card-vendedor-stat-value text-warning">{v.enProceso}</div>
                      </div>
                      <div className="card-vendedor-stat">
                        <div className="card-vendedor-stat-label">Rechazadas</div>
                        <div className="card-vendedor-stat-value text-danger">{v.rechazadas}</div>
                      </div>
                      {v.conExcepcion > 0 && (
                        <div className="card-vendedor-stat">
                          <div className="card-vendedor-stat-label">Excepciones</div>
                          <div className="card-vendedor-stat-value text-info">{v.conExcepcion}</div>
                        </div>
                      )}
                      <div className="card-vendedor-stat">
                        <div className="card-vendedor-stat-label">Productos</div>
                        <div className="card-vendedor-stat-value text-secondary">{v.numProductos}</div>
                      </div>
                    </div>
                    
                    <div className="card-vendedor-footer">
                      <div className="card-vendedor-progress">
                        <div className="progress flex-grow-1" style={{ height: '24px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{ width: `${v.porcentaje}%` }}
                            aria-valuenow={v.porcentaje} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <span className="fw-bold text-primary" style={{ minWidth: '50px', textAlign: 'right' }}>
                          {v.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card-body text-center py-5">
              <Package size={64} className="text-muted mb-3" />
              <h5 className="mb-2">No hay datos disponibles</h5>
              <p className="text-muted mb-0">Ajusta los filtros para ver información de vendedores</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;