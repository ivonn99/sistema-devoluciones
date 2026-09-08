-- Bitácora de las notificaciones por correo
-- Deja rastro de qué se envió, a quién y con qué resultado, para poder
-- responder "¿por qué no me llegó el correo?" sin depender de la consola.
--
-- payload guarda los datos que se mandaron a la plantilla, lo que permite
-- reenviar un correo fallido tal cual desde el historial.

CREATE TABLE IF NOT EXISTS public.notificaciones_log (
  id bigserial PRIMARY KEY,
  devolucion_id uuid,
  numero_nota character varying,
  proceso character varying,
  destinatarios text,
  total_destinatarios integer NOT NULL DEFAULT 0,
  origen character varying,
  exito boolean NOT NULL DEFAULT false,
  error text,
  usuario character varying,
  reenvio boolean NOT NULL DEFAULT false,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_log_created_at
  ON public.notificaciones_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notificaciones_log_devolucion
  ON public.notificaciones_log(devolucion_id);

COMMENT ON TABLE public.notificaciones_log IS 'Historial de correos de notificación enviados por el sistema';
COMMENT ON COLUMN public.notificaciones_log.origen IS 'panel = destinatarios configurados, rol = respaldo por rol de usuario';
COMMENT ON COLUMN public.notificaciones_log.payload IS 'Datos enviados a la plantilla, se usan para reenviar';
