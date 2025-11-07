import { create } from 'zustand';
import { supabase } from '../config/supabase';

const useClientesStore = create((set) => ({
  clientes: [],
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: true,
  currentPage: 0,
  pageSize: 50,
  
  // Obtener todos los clientes (usar solo cuando sea necesario)
  fetchClientes: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        console.error('❌ [clientesStore] Error de Supabase:', error);
        throw error;
      }

      set({ clientes: data || [], loading: false });
      return { success: true, data };
    } catch (error) {
      console.error('❌ [clientesStore] Error catch:', error.message);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // 🆕 BÚSQUEDA EN SERVIDOR con paginación
  searchClientes: async (query, resetPage = true) => {
    const state = useClientesStore.getState();

    if (resetPage) {
      set({ loading: true, error: null, currentPage: 0, hasMore: true });
    } else {
      set({ loadingMore: true, error: null });
    }

    try {
      const page = resetPage ? 0 : state.currentPage;
      const pageSize = state.pageSize;
      const offset = page * pageSize;

      let queryBuilder = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .order('nombre', { ascending: true })
        .range(offset, offset + pageSize - 1);

      // Aplicar filtro si hay búsqueda
      if (query && query.trim() !== '') {
        queryBuilder = queryBuilder.ilike('nombre', `%${query}%`);
      }

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      const newClientes = resetPage ? data || [] : [...state.clientes, ...(data || [])];
      const hasMore = newClientes.length < count;

      set({
        clientes: newClientes,
        loading: false,
        loadingMore: false,
        currentPage: page + 1,
        hasMore
      });

      return { success: true, data, count };
    } catch (error) {
      console.error('❌ [clientesStore] Error en búsqueda:', error.message);
      set({ error: error.message, loading: false, loadingMore: false });
      return { success: false, error: error.message };
    }
  },

  // Cargar más clientes (para infinite scroll)
  loadMoreClientes: async (query) => {
    const state = useClientesStore.getState();
    if (state.loadingMore || !state.hasMore) return;

    return await state.searchClientes(query, false);
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
  },

  // Eliminar todos los clientes (solo admin)
  deleteAllClientes: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .neq('id', 0); // Eliminar todos los registros

      if (error) throw error;

      set({ clientes: [], loading: false });
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar todos los clientes:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  }
}));

export default useClientesStore;