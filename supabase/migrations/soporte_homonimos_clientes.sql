-- Soporte de homónimos: mismo nombre con distinta ruta de reparto.
-- Ejecutar en Supabase SQL Editor (Run completo).

-- =============================================================================
-- 1. Cambiar restricción UNIQUE de solo nombre a (nombre + ruta_reparto)
-- =============================================================================

UPDATE public.clientes
SET ruta_reparto = ''
WHERE ruta_reparto IS NULL;

ALTER TABLE public.clientes
  ALTER COLUMN ruta_reparto SET DEFAULT '';

ALTER TABLE public.clientes
  DROP CONSTRAINT IF EXISTS clientes_nombre_unique;

ALTER TABLE public.clientes
  DROP CONSTRAINT IF EXISTS clientes_nombre_ruta_unique;

ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_nombre_ruta_unique UNIQUE (nombre, ruta_reparto);

-- =============================================================================
-- 2. UPSERT masivo por nombre + ruta
-- =============================================================================

CREATE OR REPLACE FUNCTION public.upsert_clientes_masivo(clientes_data JSONB)
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

GRANT EXECUTE ON FUNCTION public.upsert_clientes_masivo(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_clientes_masivo(JSONB) TO service_role;

-- =============================================================================
-- 3. Normalizar mayúsculas sin fusionar homónimos de distinta ruta
-- =============================================================================

DROP FUNCTION IF EXISTS public.normalizar_clientes_mayusculas();

CREATE OR REPLACE FUNCTION public.normalizar_clientes_mayusculas()
RETURNS JSONB AS $$
DECLARE
  dup RECORD;
  actualizados_clientes INTEGER := 0;
  actualizados_devoluciones INTEGER := 0;
  duplicados_eliminados INTEGER := 0;
  eliminados_en_grupo INTEGER;
BEGIN
  -- 1. Fusionar duplicados exactos (mismo nombre Y misma ruta al normalizar)
  FOR dup IN
    SELECT
      MIN(id) AS id_keep,
      UPPER(TRIM(nombre)) AS nombre_norm,
      COALESCE(NULLIF(UPPER(TRIM(ruta_reparto)), ''), '') AS ruta_norm
    FROM public.clientes
    GROUP BY UPPER(TRIM(nombre)), COALESCE(NULLIF(UPPER(TRIM(ruta_reparto)), ''), '')
    HAVING COUNT(*) > 1
  LOOP
    SELECT COUNT(*) - 1 INTO eliminados_en_grupo
    FROM public.clientes
    WHERE UPPER(TRIM(nombre)) = dup.nombre_norm
      AND COALESCE(NULLIF(UPPER(TRIM(ruta_reparto)), ''), '') = dup.ruta_norm
      AND id <> dup.id_keep;

    DELETE FROM public.clientes
    WHERE UPPER(TRIM(nombre)) = dup.nombre_norm
      AND COALESCE(NULLIF(UPPER(TRIM(ruta_reparto)), ''), '') = dup.ruta_norm
      AND id <> dup.id_keep;

    duplicados_eliminados := duplicados_eliminados + eliminados_en_grupo;
  END LOOP;

  -- 2. Estandarizar nombres y rutas en clientes
  UPDATE public.clientes
  SET
    nombre = UPPER(TRIM(nombre)),
    ruta_reparto = COALESCE(NULLIF(UPPER(TRIM(ruta_reparto)), ''), '')
  WHERE
    nombre IS DISTINCT FROM UPPER(TRIM(nombre))
    OR ruta_reparto IS DISTINCT FROM COALESCE(NULLIF(UPPER(TRIM(ruta_reparto)), ''), '');

  GET DIAGNOSTICS actualizados_clientes = ROW_COUNT;

  -- 3. Estandarizar nombres de cliente en devoluciones (campo texto)
  UPDATE public.devoluciones
  SET cliente = UPPER(TRIM(cliente))
  WHERE cliente IS NOT NULL
    AND cliente IS DISTINCT FROM UPPER(TRIM(cliente));

  GET DIAGNOSTICS actualizados_devoluciones = ROW_COUNT;

  RETURN jsonb_build_object(
    'actualizados_clientes', actualizados_clientes,
    'actualizados_devoluciones', actualizados_devoluciones,
    'duplicados_eliminados', duplicados_eliminados
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.normalizar_clientes_mayusculas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalizar_clientes_mayusculas() TO service_role;
