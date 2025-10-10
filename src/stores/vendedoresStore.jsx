import { create } from 'zustand';
import { supabase } from '../config/supabase';

const useVendedoresStore = create((set) => ({
  vendedores: [],
  loading: false,
  error: null,

  // Obtener todos los vendedores
  fetchVendedores: async () => {
    console.log('🔄 [vendedoresStore] Iniciando fetchVendedores...');
    set({ loading: true, error: null });
    try {
      console.log('📡 [vendedoresStore] Consultando Supabase...');
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('❌ [vendedoresStore] Error de Supabase:', error);
        throw error;
      }

      console.log('✅ [vendedoresStore] Vendedores obtenidos:', data);
      set({ vendedores: data || [], loading: false });
      return { success: true, data };
    } catch (error) {
      console.error('❌ [vendedoresStore] Error catch:', error.message);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Agregar un nuevo vendedor
  createVendedor: async (nombre) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .insert([{ nombre }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        vendedores: [...state.vendedores, data],
        loading: false
      }));
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar un vendedor
  deleteVendedor: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('vendedores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        vendedores: state.vendedores.filter(v => v.id !== id),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  }
}));

export default useVendedoresStore;