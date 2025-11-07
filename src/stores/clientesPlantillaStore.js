import { create } from 'zustand';
import { supabase } from '../config/supabase';

const useClientesPlantillaStore = create((set, get) => ({
  clientes: [],
  loading: false,
  error: null,
  uploadProgress: null,

  // Obtener todos los clientes
  fetchClientes: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      set({ clientes: data || [], loading: false });
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // UPSERT masivo de clientes desde CSV
  upsertClientesMasivo: async (clientesArray) => {
    set({ loading: true, error: null, uploadProgress: 0 });
    try {
      // Llamar a la función RPC de Supabase
      const { data, error } = await supabase
        .rpc('upsert_clientes_masivo', {
          clientes_data: clientesArray
        });

      if (error) throw error;

      set({
        loading: false,
        uploadProgress: 100
      });

      return {
        success: true,
        stats: data // { insertados, actualizados, errores, total }
      };
    } catch (error) {
      console.error('Error al cargar clientes masivamente:', error);
      set({ error: error.message, loading: false, uploadProgress: null });
      return { success: false, error: error.message };
    }
  },

  // Limpiar error
  clearError: () => set({ error: null }),

  // Limpiar progreso
  clearProgress: () => set({ uploadProgress: null }),
}));

export default useClientesPlantillaStore;
