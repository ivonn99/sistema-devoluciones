import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl) {
  throw new Error(
    'Falta la variable de entorno VITE_SUPABASE_URL. ' +
    'Por favor configúrala en tu archivo .env'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Falta la variable de entorno VITE_SUPABASE_ANON_KEY. ' +
    'Por favor configúrala en tu archivo .env'
  )
}

// Validar formato de URL
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(
    `VITE_SUPABASE_URL tiene un formato inválido: "${supabaseUrl}". ` +
    'Debe ser una URL válida (ej: https://xxx.supabase.co)'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)