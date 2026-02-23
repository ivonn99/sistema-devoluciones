-- Agregar columna email a la tabla usuarios
-- Esta columna es necesaria para enviar notificaciones por correo

-- Agregar la columna email (opcional, puede ser NULL para usuarios existentes)
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS email character varying;

-- Crear índice para búsquedas rápidas por email (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email) WHERE email IS NOT NULL;

-- Agregar comentario a la columna para documentación
COMMENT ON COLUMN public.usuarios.email IS 'Correo electrónico del usuario para notificaciones del sistema';

