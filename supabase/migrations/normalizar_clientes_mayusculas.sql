-- Normaliza registros históricos de clientes y devoluciones a MAYÚSCULAS.
-- Fusiona duplicados que difieren solo en mayúsculas/minúsculas (mismo nombre Y misma ruta).
--
-- Esquema esperado:
--   clientes (id integer, nombre text, ruta_reparto text, UNIQUE(nombre, ruta_reparto))
--   devoluciones (cliente character varying NOT NULL)

-- =============================================================================
-- INSTALACIÓN: ejecutar TODO este archivo en Supabase SQL Editor (Run completo)
-- NO ejecutar solo el SELECT de prueba hasta que la función exista.
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

-- Verificación (debe devolver 1 fila con el nombre de la función)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'normalizar_clientes_mayusculas';
