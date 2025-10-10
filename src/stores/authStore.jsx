import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../config/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      session: null,
      loading: false,
      user: null,
      error: null,

      // Iniciar sesión con username
      signIn: async (username, password) => {
        try {
          set({ loading: true, error: null });
         
          // Consultar el usuario en nuestra tabla personalizada con su rol
          const { data: usuario, error: errorConsulta } = await supabase
            .from('usuarios')
            .select(`
              *,
              roles (
                id,
                name
              )
            `)
            .eq('username', username)
            .eq('activo', true)
            .single();

          if (errorConsulta) {
            throw new Error('Usuario no encontrado');
          }

          // Verificar la contraseña
          // NOTA: En producción deberías usar bcrypt o similar
          if (usuario.password !== password) {
            throw new Error('Contraseña incorrecta');
          }

          // Crear objeto de usuario con rol
          const userWithRole = {
            ...usuario,
            rol: usuario.roles?.name || null
          };

          set({
            session: { user: userWithRole },
            user: userWithRole,
            loading: false,
            error: null
          });

          return { success: true, user: userWithRole };
        } catch (error) {
          set({
            error: error.message,
            loading: false,
            session: null,
            user: null
          });
          return { success: false, error: error.message };
        }
      },

      // Cerrar sesión
      signOut: async () => {
        set({
          session: null,
          user: null,
          loading: false,
          error: null
        });
      },

      // Verificar sesión (desde localStorage)
      checkSession: () => {
        const state = get();
        return state.user !== null;
      },

      // Limpiar error
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      // Solo persistir session y user
      partialize: (state) => ({
        session: state.session,
        user: state.user
      })
    }
  )
);

export default useAuthStore;