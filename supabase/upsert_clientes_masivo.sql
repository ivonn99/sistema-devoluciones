-- Función para hacer UPSERT masivo de clientes
-- Retorna estadísticas de la operación (insertados, actualizados, errores)

CREATE OR REPLACE FUNCTION upsert_clientes_masivo(clientes_data JSONB)
RETURNS JSONB AS $$
DECLARE
  cliente JSONB;
  insertados INTEGER := 0;
  actualizados INTEGER := 0;
  errores INTEGER := 0;
  resultado JSONB;
BEGIN
  -- Iterar sobre cada cliente en el array
  FOR cliente IN SELECT * FROM jsonb_array_elements(clientes_data)
  LOOP
    BEGIN
      -- UPSERT: Insertar o actualizar si ya existe (basado en nombre)
      INSERT INTO public.clientes (nombre, ruta_reparto)
      VALUES (
        cliente->>'nombre',
        cliente->>'ruta_reparto'
      )
      ON CONFLICT (nombre) DO UPDATE
      SET ruta_reparto = EXCLUDED.ruta_reparto
      WHERE clientes.nombre = EXCLUDED.nombre;

      -- Determinar si fue insert o update
      IF FOUND THEN
        -- Verificar si existía previamente
        IF (SELECT COUNT(*) FROM public.clientes WHERE nombre = cliente->>'nombre') > 0 THEN
          actualizados := actualizados + 1;
        ELSE
          insertados := insertados + 1;
        END IF;
      ELSE
        insertados := insertados + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      errores := errores + 1;
    END;
  END LOOP;

  -- Construir respuesta
  resultado := jsonb_build_object(
    'insertados', insertados,
    'actualizados', actualizados,
    'errores', errores,
    'total', insertados + actualizados
  );

  RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar constraint UNIQUE en nombre si no existe
-- Esto permite que el ON CONFLICT funcione
ALTER TABLE public.clientes
ADD CONSTRAINT clientes_nombre_unique UNIQUE (nombre);
