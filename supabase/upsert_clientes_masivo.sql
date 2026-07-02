-- Función para hacer UPSERT masivo de clientes (clave: nombre + ruta_reparto)
-- Retorna estadísticas de la operación (insertados, actualizados, errores)
-- Ver también: migrations/soporte_homonimos_clientes.sql

CREATE OR REPLACE FUNCTION upsert_clientes_masivo(clientes_data JSONB)
RETURNS JSONB AS $$
DECLARE
  cliente JSONB;
  nombre_val TEXT;
  ruta_val TEXT;
  insertados INTEGER := 0;
  actualizados INTEGER := 0;
  errores INTEGER := 0;
  existia BOOLEAN;
  resultado JSONB;
BEGIN
  FOR cliente IN SELECT * FROM jsonb_array_elements(clientes_data)
  LOOP
    BEGIN
      nombre_val := UPPER(TRIM(cliente->>'nombre'));
      ruta_val := COALESCE(NULLIF(UPPER(TRIM(cliente->>'ruta_reparto')), ''), '');

      IF nombre_val IS NULL OR nombre_val = '' THEN
        errores := errores + 1;
        CONTINUE;
      END IF;

      SELECT EXISTS (
        SELECT 1
        FROM public.clientes
        WHERE nombre = nombre_val
          AND ruta_reparto = ruta_val
      ) INTO existia;

      INSERT INTO public.clientes (nombre, ruta_reparto)
      VALUES (nombre_val, ruta_val)
      ON CONFLICT (nombre, ruta_reparto) DO UPDATE
      SET ruta_reparto = EXCLUDED.ruta_reparto;

      IF existia THEN
        actualizados := actualizados + 1;
      ELSE
        insertados := insertados + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      errores := errores + 1;
    END;
  END LOOP;

  resultado := jsonb_build_object(
    'insertados', insertados,
    'actualizados', actualizados,
    'errores', errores,
    'total', insertados + actualizados
  );

  RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clave única compuesta: permite homónimos con distinta ruta
ALTER TABLE public.clientes
DROP CONSTRAINT IF EXISTS clientes_nombre_unique;

ALTER TABLE public.clientes
DROP CONSTRAINT IF EXISTS clientes_nombre_ruta_unique;

ALTER TABLE public.clientes
ADD CONSTRAINT clientes_nombre_ruta_unique UNIQUE (nombre, ruta_reparto);
