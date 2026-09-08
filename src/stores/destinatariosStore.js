import { create } from 'zustand';
import { supabase } from '../config/supabase';

// Procesos que disparan notificación por correo.
// rolFallback es el rol al que se le envía cuando el proceso no tiene
// destinatarios configurados en el panel.
export const PROCESOS_NOTIFICABLES = [
  { value: 'almacen', label: 'Almacén', rolFallback: 'jefe_almacen', badge: 'bg-primary' },
  { value: 'credito', label: 'Crédito y Cobranza', rolFallback: 'credito_cobranza', badge: 'bg-success' },
  { value: 'representante', label: 'Representante/Administración', rolFallback: 'administrador', badge: 'bg-warning text-dark' }
];

export const getProcesoInfo = (proceso) =>
  PROCESOS_NOTIFICABLES.find(p => p.value === proceso) || { value: proceso, label: proceso, badge: 'bg-secondary' };

const normalizarEmail = (email) => (email || '').trim().toLowerCase();

// Postgres devuelve 23505 cuando se repite el par (proceso, email)
const traducirError = (error) => {
  if (error?.code === '23505') {
    return 'Ese correo ya está registrado para este proceso';
  }
  return error?.message || 'Ocurrió un error inesperado';
};

const useDestinatariosStore = create((set, get) => ({
  destinatarios: [],
  loading: false,
  error: null,

  fetchDestinatarios: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notificaciones_destinatarios')
        .select('*')
        .order('proceso', { ascending: true })
        .order('email', { ascending: true });

      if (error) throw error;
      set({ destinatarios: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching destinatarios:', error);
      set({ error: traducirError(error), loading: false });
    }
  },

  createDestinatario: async (destinatario) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notificaciones_destinatarios')
        .insert([{
          proceso: destinatario.proceso,
          email: normalizarEmail(destinatario.email),
          nombre: destinatario.nombre?.trim() || null,
          activo: destinatario.activo
        }])
        .select()
        .single();

      if (error) throw error;

      set({ destinatarios: [...get().destinatarios, data], loading: false });
      return { success: true, data };
    } catch (error) {
      console.error('Error creating destinatario:', error);
      const mensaje = traducirError(error);
      set({ error: mensaje, loading: false });
      return { success: false, error: mensaje };
    }
  },

  updateDestinatario: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notificaciones_destinatarios')
        .update({
          proceso: updates.proceso,
          email: normalizarEmail(updates.email),
          nombre: updates.nombre?.trim() || null,
          activo: updates.activo,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set({
        destinatarios: get().destinatarios.map(d => d.id === id ? data : d),
        loading: false
      });
      return { success: true, data };
    } catch (error) {
      console.error('Error updating destinatario:', error);
      const mensaje = traducirError(error);
      set({ error: mensaje, loading: false });
      return { success: false, error: mensaje };
    }
  },

  // Silencia o reactiva un destinatario sin borrarlo
  toggleActivo: async (id, activo) => {
    set({ error: null });
    try {
      const { error } = await supabase
        .from('notificaciones_destinatarios')
        .update({ activo, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set({
        destinatarios: get().destinatarios.map(d => d.id === id ? { ...d, activo } : d)
      });
      return { success: true };
    } catch (error) {
      console.error('Error toggling destinatario:', error);
      const mensaje = traducirError(error);
      set({ error: mensaje });
      return { success: false, error: mensaje };
    }
  },

  deleteDestinatario: async (id) => {
    set({ error: null });
    try {
      const { error } = await supabase
        .from('notificaciones_destinatarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({ destinatarios: get().destinatarios.filter(d => d.id !== id) });
      return { success: true };
    } catch (error) {
      console.error('Error deleting destinatario:', error);
      const mensaje = traducirError(error);
      set({ error: mensaje });
      return { success: false, error: mensaje };
    }
  },

  clearError: () => set({ error: null })
}));

export default useDestinatariosStore;
