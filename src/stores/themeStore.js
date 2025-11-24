import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark', // 'light' o 'dark' - Por defecto: oscuro
      
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          
          // Aplicar tema al body inmediatamente
          if (newTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.body.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-mode');
          } else {
            // Modo claro: remover atributos y clases de modo oscuro
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.removeAttribute('data-theme');
            document.body.setAttribute('data-theme', 'light');
            document.body.classList.remove('dark-mode');
            // Forzar actualización de estilos limpiando estilos inline
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
          }
          
          return { theme: newTheme };
        });
      },
      
      setTheme: (theme) => {
        set({ theme });
        
        // Aplicar tema al body inmediatamente
        if (theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.body.setAttribute('data-theme', 'dark');
          document.body.classList.add('dark-mode');
        } else {
          // Modo claro: remover atributos y clases de modo oscuro
          document.documentElement.removeAttribute('data-theme');
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.removeAttribute('data-theme');
          document.body.setAttribute('data-theme', 'light');
          document.body.classList.remove('dark-mode');
          // Forzar actualización de estilos limpiando estilos inline
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        }
      },
      
      // Inicializar tema al cargar
      initTheme: () => {
        const state = useThemeStore.getState();
        // Si no hay tema guardado, usar 'dark' por defecto
        const theme = state.theme || 'dark';
        
        if (theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.body.setAttribute('data-theme', 'dark');
          document.body.classList.add('dark-mode');
          // Asegurar que el tema se guarde si no está guardado
          if (state.theme !== 'dark') {
            useThemeStore.setState({ theme: 'dark' });
          }
        } else {
          // Modo claro: establecer explícitamente light y remover dark-mode
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.setAttribute('data-theme', 'light');
          document.body.classList.remove('dark-mode');
          // Forzar actualización de estilos
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        }
      }
    }),
    {
      name: 'theme-storage', // nombre en localStorage
    }
  )
);

// Inicializar tema al cargar el store
// Aplicar tema oscuro por defecto antes de que React cargue
if (typeof window !== 'undefined') {
  // Verificar si hay un tema guardado en localStorage
  const storedTheme = localStorage.getItem('theme-storage');
  if (!storedTheme) {
    // Si no hay tema guardado, aplicar modo oscuro por defecto inmediatamente
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
  }
  // Inicializar tema (aplicará el guardado o el por defecto)
  useThemeStore.getState().initTheme();
}

export default useThemeStore;

