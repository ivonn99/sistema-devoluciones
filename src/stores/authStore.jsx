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

      // Iniciar sesión con username (sistema híbrido)
      signIn: async (username, password) => {
        try {
          set({ loading: true, error: null });

          // Consultar el usuario en nuestra tabla personalizada
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

          let authData = null;
          let userWithRole = null;

          // SISTEMA HÍBRIDO: Intentar primero con Supabase Auth
          if (usuario.email) {
            const { data: authResponse, error: authError } = await supabase.auth.signInWithPassword({
              email: usuario.email,
              password: password
            });

            // Si Auth funciona, usar ese método (más seguro)
            if (!authError && authResponse) {
              authData = authResponse;
              userWithRole = {
                ...usuario,
                rol: usuario.roles?.name || null,
                auth_id: authData.user.id,
                usando_auth: true
              };
            }
          }

          // Si Auth falló o no tiene email, usar comparación directa (legacy)
          if (!authData) {
            if (usuario.password !== password) {
              throw new Error('Contraseña incorrecta');
            }

            // Usuario autenticado con método legacy
            userWithRole = {
              ...usuario,
              rol: usuario.roles?.name || null,
              usando_auth: false
            };

            // Crear sesión mock para compatibilidad
            authData = {
              session: { user: userWithRole }
            };
          }

          set({
            session: authData.session,
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
        const state = get();
        // Solo llamar a auth.signOut si el usuario usó Auth
        if (state.user?.usando_auth) {
          await supabase.auth.signOut();
        }
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