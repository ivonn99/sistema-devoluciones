import { create } from 'zustand';
import { supabase } from '../config/supabase';

// 🕐 Helper para convertir timestamp a hora CDMX para GUARDAR en BD
const obtenerFechaCDMXParaBD = () => {
  // Obtener fecha actual en CDMX
  const fecha = new Date();
  const fechaCDMX = new Date(fecha.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  
  // Formatear como timestamp sin zona horaria (como lo espera Supabase)
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
  
  // Supabase devuelve timestamps sin zona horaria
  // Los interpretamos como si ya fueran hora local CDMX
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
    // Mantener fechas originales con sufijo _utc
    created_at_utc: devolucion.created_at,
    updated_at_utc: devolucion.updated_at,
    fecha_registro_almacen_utc: devolucion.fecha_registro_almacen,
    fecha_registrada_pnv_utc: devolucion.fecha_registrada_pnv,
    
    // Agregar versiones en CDMX
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

  // Calcular días transcurridos desde la devolución hasta hoy
  calcularDiasTranscurridos: (fechaDevolucion) => {
    const fechaActual = new Date();
    const fechaDev = new Date(fechaDevolucion);
    return Math.floor((fechaActual - fechaDev) / (1000 * 60 * 60 * 24));
  },

  // Obtener todas las devoluciones
  fetchDevoluciones: async (filtros = {}) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('devoluciones')
        .select(`
          *,
          devoluciones_detalle (*)
        `)
        .order('created_at', { ascending: false });

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

      const { data, error } = await query;

      if (error) throw error;

      // 🔹 Enriquecer datos con días transcurridos Y fechas CDMX
      const fechaActual = new Date();
      const devolucionesEnriquecidas = (data || []).map(dev => {
        const fechaDev = new Date(dev.fecha_devolucion);
        const dias_transcurridos = Math.floor((fechaActual - fechaDev) / (1000 * 60 * 60 * 24));
        
        return {
          ...enriquecerConFechasCDMX(dev), // 🕐 Agregar fechas CDMX
          dias_transcurridos
        };
      });

      set({ devoluciones: devolucionesEnriquecidas, loading: false });
      return { success: true, data: devolucionesEnriquecidas };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Calcular días de diferencia entre fechas
  calcularDiasDiferencia: (fechaRemision, fechaDevolucion) => {
    const remision = new Date(fechaRemision);
    const devolucion = new Date(fechaDevolucion);
    const diffTime = devolucion - remision;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  // Determinar tipo de excepción AUTOMÁTICAMENTE
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

  // Crear una nueva devolución
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

      // 🔹 Agregar días transcurridos Y fechas CDMX
      const devolucionConDiasTranscurridos = {
        ...enriquecerConFechasCDMX(devolucionCompleta), // 🕐 Agregar fechas CDMX
        dias_transcurridos: get().calcularDiasTranscurridos(devolucionCompleta.fecha_devolucion)
      };

      set((state) => ({
        devoluciones: [devolucionConDiasTranscurridos, ...state.devoluciones],
        loading: false,
      }));

      return { 
        success: true, 
        data: devolucionConDiasTranscurridos,
        requiereAutorizacion: tipoExcepcion !== null,
        tipoExcepcion,
        procesoInicial
      };
    } catch (error) {
      console.error('❌ Error en createDevolucion:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar una devolución
  updateDevolucion: async (id, devolucionData) => {
    set({ loading: true, error: null });
    try {
      const { productos, ...devolucionInfo } = devolucionData;

      const { data: devolucion, error: errorDevolucion } = await supabase
        .from('devoluciones')
        .update({
          ...devolucionInfo,
          updated_at: new Date().toISOString()
        })
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

      // 🔹 Agregar días transcurridos Y fechas CDMX
      const devolucionConDiasTranscurridos = {
        ...enriquecerConFechasCDMX(devolucionCompleta), // 🕐 Agregar fechas CDMX
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
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar estado de una devolución
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

      // 🔹 Agregar días transcurridos Y fechas CDMX
      const devolucionConDiasTranscurridos = {
        ...enriquecerConFechasCDMX(data), // 🕐 Agregar fechas CDMX
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
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // 🆕 APROBAR Y REGISTRAR EN PNV (Función específica para Crédito)
  aprobarYRegistrarPNV: async (id, observaciones_credito = '', usuarioActual = 'sistema') => {
    set({ loading: true, error: null });
    try {
      const { data: devolucionActual } = await supabase
        .from('devoluciones')
        .select('estado_actual, proceso_en, numero_nota')
        .eq('id', id)
        .single();

      const ahora = new Date().toISOString();

      // Actualizar devolución con campos específicos de PNV
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

      // Registrar en seguimiento
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

      // 🔹 Agregar días transcurridos Y fechas CDMX
      const devolucionConDiasTranscurridos = {
        ...enriquecerConFechasCDMX(data), // 🕐 Agregar fechas CDMX
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
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar una devolución
  deleteDevolucion: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('devoluciones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        devoluciones: state.devoluciones.filter((dev) => dev.id !== id),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null }),
}));

export default useDevolucionesStore;