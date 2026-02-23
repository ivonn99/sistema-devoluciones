// stores/devolucionesStore.jsx
import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { enviarNotificacionEmail } from '../utils/emailServiceSimple';

// 🔧 Helper para parsear errores de Supabase de forma robusta
const parseSupabaseError = (error) => {
  // Si es un string, retornarlo directamente
  if (typeof error === 'string') {
    return error;
  }

  // Si no es un objeto, convertir a string
  if (typeof error !== 'object' || error === null) {
    return 'Error desconocido al cargar devoluciones';
  }

  // Intentar extraer mensaje en orden de prioridad
  // 1. message (puede ser JSON o string)
  if (error.message) {
    if (typeof error.message === 'string') {
      // Solo intentar parsear si parece JSON válido
      if (error.message.trim().startsWith('{') && error.message.trim().endsWith('}')) {
        try {
          const parsed = JSON.parse(error.message);
          return parsed.msg || parsed.message || JSON.stringify(parsed);
        } catch {
          // JSON inválido, retornar como string
          return error.message;
        }
      }
      // No es JSON, retornar como string directamente
      return error.message;
    }
    return String(error.message);
  }

  // 2. error_description
  if (error.error_description) {
    return String(error.error_description);
  }

  // 3. details
  if (error.details) {
    return String(error.details);
  }

  // 4. hint
  if (error.hint) {
    return String(error.hint);
  }

  // 5. Fallback
  return 'Error desconocido al procesar la solicitud';
};

// 🕐 Helper para convertir timestamp a hora CDMX para GUARDAR en BD
const obtenerFechaCDMXParaBD = () => {
  const fecha = new Date();
  const fechaCDMX = new Date(fecha.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  
  const year = fechaCDMX.getFullYear();
  const month = String(fechaCDMX.getMonth() + 1).padStart(2, '0');
  const day = String(fechaCDMX.getDate()).padStart(2, '0');
  const hours = String(fechaCDMX.getHours()).padStart(2, '0');
  const minutes = String(fechaCDMX.getMinutes()).padStart(2, '0');
  const seconds = String(fechaCDMX.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 🕐 Helper para convertir timestamp UTC a hora CDMX para MOSTRAR
const convertirAHoraCDMX = (fechaBD) => {
  if (!fechaBD) return null;
  
  const fecha = new Date(fechaBD.replace(' ', 'T'));
  
  return fecha.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// 🕐 Función para enriquecer devolución con fechas en CDMX
const enriquecerConFechasCDMX = (devolucion) => {
  return {
    ...devolucion,
    created_at_utc: devolucion.created_at,
    updated_at_utc: devolucion.updated_at,
    fecha_registro_almacen_utc: devolucion.fecha_registro_almacen,
    fecha_registrada_pnv_utc: devolucion.fecha_registrada_pnv,
    
    created_at_cdmx: convertirAHoraCDMX(devolucion.created_at),
    updated_at_cdmx: convertirAHoraCDMX(devolucion.updated_at),
    fecha_registro_almacen_cdmx: convertirAHoraCDMX(devolucion.fecha_registro_almacen),
    fecha_registrada_pnv_cdmx: convertirAHoraCDMX(devolucion.fecha_registrada_pnv),
  };
};

const useDevolucionesStore = create((set, get) => ({
  devoluciones: [],
  loading: false,
  error: null,
  
  // 🆕 Estados para infinite scroll
  hasMore: true,
  currentPage: 0,
  pageSize: 50,
  totalCount: 0,
  
  // 🆕 Estados para búsqueda en servidor
  searchResults: [],
  searchLoading: false,
  searchHasMore: true,
  searchPage: 0,

  calcularDiasTranscurridos: (fechaDevolucion) => {
    if (!fechaDevolucion) return 0;
    const fechaActual = new Date();
    const fechaDev = new Date(fechaDevolucion);
    if (isNaN(fechaDev.getTime())) return 0;
    return Math.floor((fechaActual - fechaDev) / (1000 * 60 * 60 * 24));
  },

  // 🆕 Fetch inicial con paginación
  fetchDevoluciones: async (filtros = {}, reset = false) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const page = reset ? 0 : state.currentPage;
      const pageSize = state.pageSize;

      // 🔥 Si no hay más datos, no hacer la petición
      if (!reset && !state.hasMore) {
        set({ loading: false });
        return { success: true, data: [], count: state.totalCount };
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('devoluciones')
        .select(`
          *,
          devoluciones_detalle (*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Aplicar filtros si existen
      if (filtros.empresa) {
        query = query.eq('empresa', filtros.empresa);
      }
      if (filtros.estado_actual) {
        query = query.eq('estado_actual', filtros.estado_actual);
      }
      if (filtros.proceso_en) {
        query = query.eq('proceso_en', filtros.proceso_en);
      }
      if (filtros.tipo_cliente) {
        query = query.eq('tipo_cliente', filtros.tipo_cliente);
      }
      if (filtros.dentro_plazo !== undefined && filtros.dentro_plazo !== '') {
        query = query.eq('dentro_plazo', filtros.dentro_plazo === 'si');
      }
      if (filtros.fecha_desde) {
        query = query.gte('fecha_devolucion', filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        query = query.lte('fecha_devolucion', filtros.fecha_hasta);
      }

      const { data, error, count } = await query;

      if (error) {
        // 🔥 Si es error 416 (rango fuera de límites), no hay más datos
        // Verificación más robusta de error de rango
        const isRangeError =
          error.code === 'PGRST103' ||
          error.code === 'PGRST116' ||
          (error.message && typeof error.message === 'string' && error.message.includes('416')) ||
          (error.details && typeof error.details === 'string' && error.details.includes('out of range'));

        if (isRangeError) {
          set({
            hasMore: false,
            loading: false
          });
          return { success: true, data: [], count: state.totalCount };
        }
        throw error;
      }

      const fechaActual = new Date();
      const devolucionesEnriquecidas = (data || []).map(dev => {
        const fechaDev = new Date(dev.fecha_devolucion);
        const dias_transcurridos = Math.floor((fechaActual - fechaDev) / (1000 * 60 * 60 * 24));
        
        return {
          ...enriquecerConFechasCDMX(dev),
          dias_transcurridos
        };
      });

      // 🔥 Determinar si hay más datos
      const newHasMore = count > (page + 1) * pageSize;

      set({ 
        devoluciones: reset ? devolucionesEnriquecidas : [...state.devoluciones, ...devolucionesEnriquecidas],
        currentPage: page + 1,
        hasMore: newHasMore,
        totalCount: count || 0,
        loading: false 
      });
      
      return { success: true, data: devolucionesEnriquecidas, count };
    } catch (error) {
      console.error('❌ Error en fetchDevoluciones:', error);

      const errorMessage = parseSupabaseError(error);

      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // 🆕 Reset para cuando cambien filtros
  resetDevoluciones: () => {
    set({ 
      devoluciones: [], 
      currentPage: 0, 
      hasMore: true,
      totalCount: 0,
      error: null // Limpia error al resetear
    });
  },

  // 🆕 Fetch TODAS las devoluciones para reportes (sin paginación)
  // Carga todas las devoluciones del último año (o más si se especifica)
  fetchAllDevolucionesForReports: async (filtros = {}) => {
    set({ loading: true, error: null });
    try {
      // Calcular fecha de inicio (último año, o desde que se especifique)
      const hoy = new Date();
      const fechaInicio = filtros.fechaDesde 
        ? new Date(filtros.fechaDesde)
        : (() => {
            const fecha = new Date(hoy);
            fecha.setFullYear(hoy.getFullYear() - 1);
            return fecha;
          })();
      
      // Formatear fecha para query (ISO format)
      const fechaDesdeISO = fechaInicio.toISOString().split('T')[0];

      console.log('📊 [Reportes] Cargando devoluciones desde:', fechaDesdeISO);

      let query = supabase
        .from('devoluciones')
        .select(`
          *,
          devoluciones_detalle (*)
        `, { count: 'exact' })
        .gte('fecha_devolucion', fechaDesdeISO)
        .order('fecha_devolucion', { ascending: false });

      // Aplicar filtros adicionales si existen
      if (filtros.empresa && filtros.empresa !== 'todas') {
        query = query.eq('empresa', filtros.empresa);
      }
      if (filtros.estado_actual) {
        query = query.eq('estado_actual', filtros.estado_actual);
      }
      if (filtros.proceso_en) {
        query = query.eq('proceso_en', filtros.proceso_en);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error en fetchAllDevolucionesForReports:', error);
        throw error;
      }

      console.log(`✅ [Reportes] Cargadas ${data?.length || 0} devoluciones del último año`);

      const fechaActual = new Date();
      const devolucionesEnriquecidas = (data || []).map(dev => {
        const fechaDev = new Date(dev.fecha_devolucion);
        const dias_transcurridos = Math.floor((fechaActual - fechaDev) / (1000 * 60 * 60 * 24));
        
        return {
          ...enriquecerConFechasCDMX(dev),
          dias_transcurridos
        };
      });

      // Contar vendedores únicos para debug
      const vendedoresUnicos = [...new Set(devolucionesEnriquecidas.map(d => d.vendedor_nombre).filter(Boolean))];
      console.log(`📊 [Reportes] Vendedores encontrados: ${vendedoresUnicos.length}`, vendedoresUnicos);

      set({ 
        loading: false 
      });
      
      return { 
        success: true, 
        data: devolucionesEnriquecidas, 
        count: count || devolucionesEnriquecidas.length 
      };
    } catch (error) {
      console.error('❌ Error en fetchAllDevolucionesForReports:', error);
      const errorMessage = parseSupabaseError(error);
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // 🆕 Búsqueda en servidor
  searchDevoluciones: async (searchTerm, filtros = {}, reset = false) => {
    if (!searchTerm || searchTerm.trim() === '') {
      set({ searchResults: [], searchHasMore: true, searchPage: 0, error: null });
      return { success: true, data: [] };
    }

    set({ searchLoading: true, error: null });
    try {
      const state = get();
      const page = reset ? 0 : state.searchPage;
      const pageSize = 50;
      
      // 🔥 Si no hay más datos, no hacer la petición
      if (!reset && !state.searchHasMore) {
        set({ searchLoading: false });
        return { success: true, data: [], count: 0 };
      }
      
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const term = searchTerm.toLowerCase();

      let query = supabase
        .from('devoluciones')
        .select(`
          *,
          devoluciones_detalle (*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Búsqueda por múltiples campos
      query = query.or(
        `numero_nota.ilike.%${term}%,` +
        `cliente.ilike.%${term}%,` +
        `empresa.ilike.%${term}%,` +
        `vendedor_nombre.ilike.%${term}%,` +
        `motivo_devolucion_general.ilike.%${term}%,` +
        `estado_actual.ilike.%${term}%,` +
        `proceso_en.ilike.%${term}%`
      );

      // Aplicar filtros adicionales
      if (filtros.empresa) {
        query = query.eq('empresa', filtros.empresa);
      }
      if (filtros.estado_actual) {
        query = query.eq('estado_actual', filtros.estado_actual);
      }
      if (filtros.proceso_en) {
        query = query.eq('proceso_en', filtros.proceso_en);
      }
      if (filtros.tipo_cliente) {
        query = query.eq('tipo_cliente', filtros.tipo_cliente);
      }

      const { data, error, count } = await query;

      if (error) {
        // 🔥 Si es error 416 (rango fuera de límites), no hay más datos
        if (error.code === 'PGRST103' || error.message?.includes('416')) {
          set({ 
            searchHasMore: false,
            searchLoading: false 
          });
          return { success: true, data: [], count: 0 };
        }
        throw error;
      }

      const fechaActual = new Date();
      const resultadosEnriquecidos = (data || []).map(dev => {
        const fechaDev = new Date(dev.fecha_devolucion);
        const dias_transcurridos = Math.floor((fechaActual - fechaDev) / (1000 * 60 * 60 * 24));
        
        return {
          ...enriquecerConFechasCDMX(dev),
          dias_transcurridos
        };
      });

      // 🔥 Determinar si hay más datos
      const newSearchHasMore = count > (page + 1) * pageSize;

      set({ 
        searchResults: reset ? resultadosEnriquecidos : [...state.searchResults, ...resultadosEnriquecidos],
        searchPage: page + 1,
        searchHasMore: newSearchHasMore,
        searchLoading: false 
      });

      return { success: true, data: resultadosEnriquecidos, count };
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);

      const errorMessage = parseSupabaseError(error);

      set({ error: errorMessage, searchLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // 🆕 Reset búsqueda
  resetSearch: () => {
    set({ 
      searchResults: [], 
      searchPage: 0, 
      searchHasMore: true,
      error: null // Limpia error al resetear búsqueda
    });
  },

  calcularDiasDiferencia: (fechaRemision, fechaDevolucion) => {
    const remision = new Date(fechaRemision);
    const devolucion = new Date(fechaDevolucion);
    const diffTime = devolucion - remision;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  determinarExcepcion: (dentroPlazo, contieneProductoNoDevolvible) => {
    if (contieneProductoNoDevolvible && !dentroPlazo) {
      return 'producto_no_devoluble';
    }
    if (contieneProductoNoDevolvible) {
      return 'producto_no_devoluble';
    }
    if (!dentroPlazo) {
      return 'fuera_plazo';
    }
    return null;
  },

  createDevolucion: async (devolucionData) => {
    set({ loading: true, error: null });
    try {
      const { productos, ...devolucionInfo } = devolucionData;

      const plazoMaximo = {
        'local': 7,
        'foraneo': 21,
        'consignacion': 30
      }[devolucionInfo.tipo_cliente];

      const diasDiferencia = get().calcularDiasDiferencia(
        devolucionInfo.fecha_remision,
        devolucionInfo.fecha_devolucion
      );

      const dentroPlazo = diasDiferencia <= plazoMaximo;
      const tipoExcepcion = get().determinarExcepcion(
        dentroPlazo,
        devolucionInfo.contiene_producto_no_devolvible || false
      );

      let estadoInicial = 'registrada';
      let procesoInicial = 'credito';
      
      if (tipoExcepcion) {
        estadoInicial = 'requiere_autorizacion';
        procesoInicial = 'representante';
      }

      const devolucionParaInsertar = {
        ...devolucionInfo,
        plazo_maximo: plazoMaximo,
        tipo_excepcion: tipoExcepcion,
        fecha_registro_almacen: new Date().toISOString(),
        estado_actual: estadoInicial,
        proceso_en: procesoInicial
      };

      const { data: devolucion, error: errorDevolucion } = await supabase
        .from('devoluciones')
        .insert([devolucionParaInsertar])
        .select()
        .single();

      if (errorDevolucion) throw errorDevolucion;

      if (productos && productos.length > 0) {
        const productosConId = productos.map((producto, index) => ({
          devolucion_id: devolucion.id,
          concepto_sustancia: producto.concepto_sustancia,
          cantidad: producto.cantidad,
          estado_producto: producto.estado_producto,
          motivo_devolucion_producto: devolucionInfo.motivo_devolucion_general,
          comentarios: producto.comentarios || null,
          linea_numero: index + 1,
          aceptado: true
        }));

        const { error: errorProductos } = await supabase
          .from('devoluciones_detalle')
          .insert(productosConId);

        if (errorProductos) throw errorProductos;
      }

      let observacionesIniciales = `Devolución registrada en el sistema. Motivo: ${devolucionInfo.motivo_devolucion_general}.`;
      
      if (tipoExcepcion) {
        const mensajeExcepcion = tipoExcepcion === 'fuera_plazo' 
          ? `Fuera de plazo (${diasDiferencia} días, máximo ${plazoMaximo})`
          : 'Contiene productos NO devolvibles';
        observacionesIniciales += ` ⚠️ REQUIERE AUTORIZACIÓN: ${mensajeExcepcion}. Enviada al representante para revisión.`;
      } else {
        observacionesIniciales += ` ✓ Dentro de plazo (${diasDiferencia}/${plazoMaximo} días). Enviada a Crédito y Cobranza para validación.`;
      }

      const { error: errorSeguimiento } = await supabase
        .from('devoluciones_seguimiento')
        .insert([{
          devolucion_id: devolucion.id,
          estado_anterior: null,
          estado_nuevo: estadoInicial,
          proceso_anterior: null,
          proceso_nuevo: procesoInicial,
          cambiado_por: devolucionInfo.creado_por || 'sistema',
          area: procesoInicial,
          accion: 'registro_inicial',
          observaciones: observacionesIniciales
        }]);

      if (errorSeguimiento) throw errorSeguimiento;

      const { data: devolucionCompleta, error: errorCompleta } = await supabase
        .from('devoluciones')
        .select(`
          *,
          devoluciones_detalle (*)
        `)
        .eq('id', devolucion.id)
        .single();

      if (errorCompleta) throw errorCompleta;

      const devolucionConDiasTranscurridos = {
        ...enriquecerConFechasCDMX(devolucionCompleta),
        dias_transcurridos: get().calcularDiasTranscurridos(devolucionCompleta.fecha_devolucion)
      };

      set((state) => ({
        devoluciones: [devolucionConDiasTranscurridos, ...state.devoluciones],
        totalCount: state.totalCount + 1,
        loading: false,
      }));

      // 🚀 ENVIAR CORREO DE FORMA ASÍNCRONA (registro inicial)
      // Notificar cuando se registra una nueva devolución
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 [NUEVA DEVOLUCIÓN] Iniciando envío de notificación por correo');
      console.log('📦 Devolución creada exitosamente');
      console.log('🔄 Proceso inicial:', procesoInicial);
      console.log('📝 Nota:', devolucionConDiasTranscurridos.numero_nota);
      console.log('👤 Cliente:', devolucionConDiasTranscurridos.cliente);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      enviarNotificacionEmail(
        devolucionConDiasTranscurridos,
        procesoInicial,
        null // No hay proceso anterior en registro inicial
      ).then(resultado => {
        console.log('✅ [NUEVA DEVOLUCIÓN] Resultado del envío de correo:', resultado);
        if (resultado.success) {
          console.log(`📧 [NUEVA DEVOLUCIÓN] Correos enviados: ${resultado.enviados || 0}/${resultado.total || 0}`);
        } else {
          console.warn('⚠️ [NUEVA DEVOLUCIÓN] El correo no se pudo enviar:', resultado.error);
        }
      }).catch(error => {
        // Solo loguear el error, no lanzarlo
        console.error('❌ [NUEVA DEVOLUCIÓN] Error al enviar correo (no crítico):', error);
        console.error('📋 Detalles del error:', JSON.stringify(error, null, 2));
      });

      return { 
        success: true, 
        data: devolucionConDiasTranscurridos,
        requiereAutorizacion: tipoExcepcion !== null,
        tipoExcepcion,
        procesoInicial
      };
    } catch (error) {
      console.error('❌ Error en createDevolucion:', error);
      console.error('❌ Error completo:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Error desconocido al crear devolución';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        try {
          const parsed = JSON.parse(error.message);
          errorMessage = parsed.msg || parsed.message || JSON.stringify(parsed);
        } catch {
          errorMessage = error.message;
        }
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      }
      
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateDevolucion: async (id, devolucionData) => {
    set({ loading: true, error: null });
    try {
      const { productos, ...devolucionInfo } = devolucionData;

      const dataToUpdate = {
        ...devolucionInfo,
        updated_at: new Date().toISOString()
      };

      const { data: devolucion, error: errorDevolucion } = await supabase
        .from('devoluciones')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (errorDevolucion) throw errorDevolucion;

      if (productos && productos.length > 0) {
        await supabase
          .from('devoluciones_detalle')
          .delete()
          .eq('devolucion_id', id);

        const productosConId = productos.map((producto, index) => ({
          devolucion_id: id,
          concepto_sustancia: producto.concepto_sustancia,
          cantidad: producto.cantidad,
          estado_producto: producto.estado_producto,
          motivo_devolucion_producto: devolucionInfo.motivo_devolucion_general || producto.motivo_devolucion_producto,
          comentarios: producto.comentarios || null,
          linea_numero: index + 1,
          aceptado: producto.aceptado !== undefined ? producto.aceptado : true
        }));

        const { error: errorProductos } = await supabase
          .from('devoluciones_detalle')
          .insert(productosConId);

        if (errorProductos) throw errorProductos;
      }

      const { data: devolucionCompleta } = await supabase
        .from('devoluciones')
        .select(`
          *,
          devoluciones_detalle (*)
        `)
        .eq('id', id)
        .single();

      const devolucionConDiasTranscurridos = {
        ...enriquecerConFechasCDMX(devolucionCompleta),
        dias_transcurridos: get().calcularDiasTranscurridos(devolucionCompleta.fecha_devolucion)
      };

      set((state) => ({
        devoluciones: state.devoluciones.map((dev) =>
          dev.id === id ? devolucionConDiasTranscurridos : dev
        ),
        loading: false,
      }));

      return { success: true, data: devolucionConDiasTranscurridos };
    } catch (error) {
      console.error('❌ Error en updateDevolucion:', error);
      const errorMessage = error?.message || 'Error desconocido al actualizar devolución';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateEstado: async (id, nuevoEstado, nuevoProceso, motivo = null, usuarioActual = 'sistema') => {
    set({ loading: true, error: null });
    try {
      const { data: devolucionActual } = await supabase
        .from('devoluciones')
        .select('estado_actual, proceso_en')
        .eq('id', id)
        .single();

      const updateData = {
        estado_actual: nuevoEstado,
        proceso_en: nuevoProceso,
        updated_at: new Date().toISOString()
      };

      if (nuevoEstado === 'requiere_correccion' && motivo) {
        updateData.motivo_correccion = motivo;
      } else if (nuevoEstado === 'rechazada' && motivo) {
        updateData.motivo_rechazo = motivo;
      } else if (nuevoEstado === 'requiere_autorizacion' && motivo) {
        updateData.motivo_autorizacion = motivo;
      }

      const { data, error } = await supabase
        .from('devoluciones')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          devoluciones_detalle (*)
        `)
        .single();

      if (error) throw error;

      await supabase
        .from('devoluciones_seguimiento')
        .insert([{
          devolucion_id: id,
          estado_anterior: devolucionActual?.estado_actual,
          estado_nuevo: nuevoEstado,
          proceso_anterior: devolucionActual?.proceso_en,
          proceso_nuevo: nuevoProceso,
          cambiado_por: usuarioActual,
          area: nuevoProceso,
          accion: `cambio_estado_${nuevoEstado}`,
          motivo: motivo,
          observaciones: `Estado cambiado de ${devolucionActual?.estado_actual} a ${nuevoEstado}`
        }]);

      const devolucionConDiasTranscurridos = {
        ...enriquecerConFechasCDMX(data),
        dias_transcurridos: get().calcularDiasTranscurridos(data.fecha_devolucion)
      };

      set((state) => ({
        devoluciones: state.devoluciones.map((dev) =>
          dev.id === id ? devolucionConDiasTranscurridos : dev
        ),
        loading: false,
      }));

      // 🚀 ENVIAR CORREO DE FORMA ASÍNCRONA (no bloquea la actualización)
      // Si el correo falla, no afecta el éxito de la actualización
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 [ACTUALIZACIÓN ESTADO] Iniciando envío de notificación por correo');
      console.log('📦 Devolución ID:', id);
      console.log('🔄 Proceso anterior:', devolucionActual?.proceso_en);
      console.log('🔄 Proceso nuevo:', nuevoProceso);
      console.log('📊 Estado nuevo:', nuevoEstado);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      enviarNotificacionEmail(
        devolucionConDiasTranscurridos,
        nuevoProceso,
        devolucionActual?.proceso_en
      ).then(resultado => {
        console.log('✅ [ACTUALIZACIÓN ESTADO] Resultado del envío de correo:', resultado);
        if (resultado.success) {
          console.log(`📧 [ACTUALIZACIÓN ESTADO] Correos enviados: ${resultado.enviados || 0}/${resultado.total || 0}`);
        } else {
          console.warn('⚠️ [ACTUALIZACIÓN ESTADO] El correo no se pudo enviar:', resultado.error);
        }
      }).catch(error => {
        // Solo loguear el error, no lanzarlo
        console.error('❌ [ACTUALIZACIÓN ESTADO] Error al enviar correo (no crítico):', error);
        console.error('📋 Detalles del error:', JSON.stringify(error, null, 2));
      });

      return { success: true, data: devolucionConDiasTranscurridos };
    } catch (error) {
      console.error('❌ Error en updateEstado:', error);
      const errorMessage = error?.message || 'Error desconocido al actualizar estado';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  aprobarYRegistrarPNV: async (id, observaciones_credito = '', usuarioActual = 'sistema') => {
    set({ loading: true, error: null });
    try {
      const { data: devolucionActual } = await supabase
        .from('devoluciones')
        .select('estado_actual, proceso_en, numero_nota')
        .eq('id', id)
        .single();

      const ahora = new Date().toISOString();

      const { data, error } = await supabase
        .from('devoluciones')
        .update({
          estado_actual: 'registrada_pnv',
          proceso_en: 'finalizado',
          observaciones_credito: observaciones_credito || null,
          fecha_registrada_pnv: ahora,
          registrada_pnv_por: usuarioActual,
          updated_at: ahora
        })
        .eq('id', id)
        .select(`
          *,
          devoluciones_detalle (*)
        `)
        .single();

      if (error) throw error;

      await supabase
        .from('devoluciones_seguimiento')
        .insert([{
          devolucion_id: id,
          estado_anterior: devolucionActual?.estado_actual,
          estado_nuevo: 'registrada_pnv',
          proceso_anterior: devolucionActual?.proceso_en,
          proceso_nuevo: 'finalizado',
          cambiado_por: usuarioActual,
          area: 'credito',
          accion: 'aprobar_y_registrar_pnv',
          observaciones: `Aprobada por Crédito y registrada en PNV. ${observaciones_credito ? 'Obs: ' + observaciones_credito : ''}`
        }]);

      const devolucionConDiasTranscurridos = {
        ...enriquecerConFechasCDMX(data),
        dias_transcurridos: get().calcularDiasTranscurridos(data.fecha_devolucion)
      };

      set((state) => ({
        devoluciones: state.devoluciones.map((dev) =>
          dev.id === id ? devolucionConDiasTranscurridos : dev
        ),
        loading: false,
      }));

      return { success: true, data: devolucionConDiasTranscurridos };
    } catch (error) {
      console.error('❌ Error en aprobarYRegistrarPNV:', error);
      const errorMessage = error?.message || 'Error desconocido al aprobar y registrar en PNV';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteDevolucion: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('devoluciones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Eliminar de ambas listas (principal y resultados de búsqueda)
      set((state) => ({
        devoluciones: state.devoluciones.filter((dev) => dev.id !== id),
        searchResults: state.searchResults.filter((dev) => dev.id !== id),
        totalCount: state.totalCount > 0 ? state.totalCount - 1 : 0,
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ Error en deleteDevolucion:', error);
      const errorMessage = error?.message || 'Error desconocido al eliminar devolución';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ Función mejorada para limpiar errores
  clearError: () => set({ error: null }),
}));

export default useDevolucionesStore;