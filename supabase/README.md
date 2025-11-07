# Funciones SQL para Supabase

## Instrucciones de instalación

### 1. Función UPSERT Masivo de Clientes

Esta función permite hacer cargas masivas de clientes con UPSERT (insertar o actualizar).

**Pasos para instalar:**

1. Ve al dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Crea una nueva query
5. Copia y pega el contenido del archivo `upsert_clientes_masivo.sql`
6. Ejecuta la query (botón RUN o Ctrl+Enter)

**Verificación:**

Para verificar que la función se instaló correctamente, ejecuta:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'upsert_clientes_masivo';
```

Deberías ver el nombre de la función en los resultados.

**Uso desde el frontend:**

La función se llama automáticamente desde el componente `ClientesPlantilla` cuando subes un archivo CSV.

**Formato del CSV:**

```csv
nombre,ruta_reparto
Cliente 1,Ruta A
Cliente 2,Ruta B
Cliente 3,Ruta C
```

**Comportamiento:**

- Si el cliente **NO existe** (basado en el nombre) → Se **INSERTA**
- Si el cliente **YA existe** (basado en el nombre) → Se **ACTUALIZA** su ruta_reparto
- Retorna estadísticas: `{ insertados, actualizados, errores, total }`

**Importante:**

La función agrega automáticamente un constraint UNIQUE en la columna `nombre` de la tabla `clientes` para que el UPSERT funcione correctamente.

Si ya tienes clientes duplicados en la base de datos, primero deberás limpiarlos antes de ejecutar esta función.
