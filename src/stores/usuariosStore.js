import { create } from 'zustand';
import { supabase } from '../config/supabase';

const useUsuariosStore = create((set, get) => ({
  usuarios: [],
  roles: [],
  loading: false,
  error: null,

  // Obtener todos los usuarios con su rol
  fetchUsuarios: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ usuarios: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      set({ error: error.message, loading: false });
    }
  },

  // Obtener todos los roles
  fetchRoles: async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ roles: data || [] });
    } catch (error) {
      console.error('Error fetching roles:', error);
      set({ error: error.message });
    }
  },

  // Crear usuario
  createUsuario: async (usuario) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([usuario])
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      const currentUsuarios = get().usuarios;
      set({
        usuarios: [data, ...currentUsuarios],
        loading: false
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error creating usuario:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar usuario
  updateUsuario: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      const currentUsuarios = get().usuarios;
      set({
        usuarios: currentUsuarios.map(u => u.id === id ? data : u),
        loading: false
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error updating usuario:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar usuario (soft delete - cambiar a inactivo)
  deleteUsuario: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;

      const currentUsuarios = get().usuarios;
      set({
        usuarios: currentUsuarios.map(u => u.id === id ? { ...u, activo: false } : u),
        loading: false
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting usuario:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Activar usuario
  activarUsuario: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: true })
        .eq('id', id);

      if (error) throw error;

      const currentUsuarios = get().usuarios;
      set({
        usuarios: currentUsuarios.map(u => u.id === id ? { ...u, activo: true } : u),
        loading: false
      });

      return { success: true };
    } catch (error) {
      console.error('Error activating usuario:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Cambiar contraseña
  cambiarPassword: async (id, newPassword) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ password: newPassword })
        .eq('id', id);

      if (error) throw error;

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar error
  clearError: () => set({ error: null })
}));

export default useUsuariosStore;
