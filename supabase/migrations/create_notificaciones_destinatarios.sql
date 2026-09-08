-- Destinatarios de las notificaciones por correo, administrables desde el sistema
-- Permite enviar avisos a personas que no son usuarios del sistema (contador,
-- correos de grupo, gerencia) sin tener que tocar código.
--
-- Si un proceso no tiene destinatarios activos en esta tabla, el sistema sigue
-- usando el comportamiento anterior: los usuarios con el rol correspondiente.

CREATE TABLE IF NOT EXISTS public.notificaciones_destinatarios (
  id bigserial PRIMARY KEY,
  proceso character varying NOT NULL CHECK (proceso IN ('almacen', 'credito', 'representante')),
  email character varying NOT NULL,
  nombre character varying,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notificaciones_destinatarios_proceso_email_key UNIQUE (proceso, email)
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatarios_proceso
  ON public.notificaciones_destinatarios(proceso)
  WHERE activo = true;

COMMENT ON TABLE public.notificaciones_destinatarios IS 'Destinatarios de correo por proceso de devolución';
COMMENT ON COLUMN public.notificaciones_destinatarios.proceso IS 'Proceso que dispara la notificación: almacen, credito o representante';
COMMENT ON COLUMN public.notificaciones_destinatarios.activo IS 'Permite silenciar un destinatario sin borrarlo';
