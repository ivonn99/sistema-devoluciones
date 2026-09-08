import { create } from 'zustand';
import { supabase } from '../config/supabase';

const LIMITE_POR_DEFECTO = 200;

const useNotificacionesLogStore = create((set) => ({
  logs: [],
  loading: false,
  error: null,
  tablaDisponible: true,

  fetchLogs: async (limite = LIMITE_POR_DEFECTO) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notificaciones_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limite);

      if (error) throw error;
      set({ logs: data || [], loading: false, tablaDisponible: true });
    } catch (error) {
      console.error('Error fetching notificaciones_log:', error);
      // 42P01 (Postgres) y PGRST205 (PostgREST) significan que la tabla
      // todavía no existe, es decir, falta correr la migración
      const tablaFaltante = ['42P01', 'PGRST205'].includes(error.code);

      set({
        error: error.message,
        loading: false,
        tablaDisponible: !tablaFaltante
      });
    }
  },

  clearError: () => set({ error: null })
}));

export default useNotificacionesLogStore;
