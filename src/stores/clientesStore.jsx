import { create } from 'zustand';
import { supabase } from '../config/supabase';

const useClientesStore = create((set) => ({
  clientes: [],
  loading: false,
  error: null,
  
  // Obtener todos los clientes (usar solo cuando sea necesario)
  fetchClientes: async () => {
    console.log('🔄 [clientesStore] Iniciando fetchClientes...');
    set({ loading: true, error: null });
    try {
      console.log('📡 [clientesStore] Consultando Supabase...');
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) {
        console.error('❌ [clientesStore] Error de Supabase:', error);
        throw error;
      }
      
      console.log('✅ [clientesStore] Clientes obtenidos:', data);
      set({ clientes: data || [], loading: false });
      return { success: true, data };
    } catch (error) {
      console.error('❌ [clientesStore] Error catch:', error.message);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // 🆕 BÚSQUEDA EN SERVIDOR - Más eficiente para 4,000 clientes
  searchClientes: async (query) => {
    console.log('🔍 [clientesStore] Buscando:', query);
    set({ loading: true, error: null });
    
    try {
      // Si el query está vacío, retornar los primeros 50
      if (!query || query.trim() === '') {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('nombre', { ascending: true })
          .limit(50);
        
        if (error) throw error;
        
        console.log('✅ [clientesStore] Clientes iniciales:', data?.length);
        set({ clientes: data || [], loading: false });
        return { success: true, data };
      }
      
      // Búsqueda con ILIKE (insensible a mayúsculas)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .ilike('nombre', `%${query}%`)
        .order('nombre', { ascending: true })
        .limit(100); // Máximo 100 resultados
      
      if (error) throw error;
      
      console.log('✅ [clientesStore] Resultados encontrados:', data?.length);
      set({ clientes: data || [], loading: false });
      return { success: true, data };
    } catch (error) {
      console.error('❌ [clientesStore] Error en búsqueda:', error.message);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },
  
  // Agregar un nuevo cliente
  createCliente: async (clienteData) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([clienteData])
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => ({
        clientes: [...state.clientes, data],
        loading: false
      }));
      
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },
  
  // Eliminar un cliente
  deleteCliente: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set((state) => ({
        clientes: state.clientes.filter(c => c.id !== id),
        loading: false
      }));
      
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  }
}));

export default useClientesStore;