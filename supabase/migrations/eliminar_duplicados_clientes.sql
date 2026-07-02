-- Elimina clientes duplicados según criterio elegido por el administrador.
-- criterio = 'nombre_ruta' → mismo nombre Y misma ruta (ignorando mayúsculas/espacios)
-- criterio = 'nombre'      → solo mismo nombre (conserva el id más bajo y una ruta del grupo)
--
-- Ejecutar en Supabase SQL Editor (Run completo).

DROP FUNCTION IF EXISTS public.eliminar_duplicados_clientes(TEXT);

CREATE OR REPLACE FUNCTION public.eliminar_duplicados_clientes(criterio TEXT DEFAULT 'nombre_ruta')
RETURNS JSONB AS $$
DECLARE
  dup RECORD;
  criterio_norm TEXT;
  grupos_procesados INTEGER := 0;
  duplicados_eliminados INTEGER := 0;
  eliminados_en_grupo INTEGER;
BEGIN
  criterio_norm := LOWER(TRIM(COALESCE(criterio, 'nombre_ruta')));

  IF criterio_norm NOT IN ('nombre', 'nombre_ruta') THEN
    RAISE EXCEPTION 'Criterio inválido: %. Use ''nombre'' o ''nombre_ruta''.', criterio;
  END IF;

  IF criterio_norm = 'nombre_ruta' THEN
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
      grupos_procesados := grupos_procesados + 1;
    END LOOP;
  ELSE
    FOR dup IN
      SELECT
        MIN(id) AS id_keep,
        UPPER(TRIM(nombre)) AS nombre_norm
      FROM public.clientes
      GROUP BY UPPER(TRIM(nombre))
      HAVING COUNT(*) > 1
    LOOP
      UPDATE public.clientes c
      SET ruta_reparto = COALESCE(
        NULLIF(UPPER(TRIM(c.ruta_reparto)), ''),
        (
          SELECT COALESCE(NULLIF(UPPER(TRIM(r.ruta_reparto)), ''), '')
          FROM public.clientes r
          WHERE UPPER(TRIM(r.nombre)) = dup.nombre_norm
            AND r.ruta_reparto IS NOT NULL
            AND TRIM(r.ruta_reparto) <> ''
          ORDER BY r.id
          LIMIT 1
        ),
        ''
      )
      WHERE c.id = dup.id_keep;

      SELECT COUNT(*) - 1 INTO eliminados_en_grupo
      FROM public.clientes
      WHERE UPPER(TRIM(nombre)) = dup.nombre_norm
        AND id <> dup.id_keep;

      DELETE FROM public.clientes
      WHERE UPPER(TRIM(nombre)) = dup.nombre_norm
        AND id <> dup.id_keep;

      duplicados_eliminados := duplicados_eliminados + eliminados_en_grupo;
      grupos_procesados := grupos_procesados + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'criterio', criterio_norm,
    'grupos_procesados', grupos_procesados,
    'duplicados_eliminados', duplicados_eliminados
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.eliminar_duplicados_clientes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_duplicados_clientes(TEXT) TO service_role;

-- Recargar caché de PostgREST / Supabase API (evita "Could not find function in schema cache")
NOTIFY pgrst, 'reload schema';

-- Verificación (debe devolver 1 fila)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'eliminar_duplicados_clientes';
