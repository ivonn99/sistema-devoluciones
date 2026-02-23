# 🧪 Cómo Enviar un Correo de Prueba

## Opción 1: Desde Supabase Dashboard (Más Fácil)

### Paso 1: Desplegar la Función de Prueba

1. Ir a: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Edge Functions**
4. Clic en **"Create a new function"**
5. Nombre: `test-email`
6. Copiar el contenido de `supabase/functions/test-email/index.ts`
7. Pegar en el editor
8. Clic en **"Deploy"**

### Paso 2: Invocar la Función

1. En Edge Functions, buscar `test-email`
2. Clic en **"Invoke"** o **"Test"**
3. En el body, puedes poner (opcional):
   ```json
   {
     "email": "rodrigozoramarroyo@gmail.com"
   }
   ```
4. Clic en **"Invoke function"**
5. Verificar el resultado

### Paso 3: Verificar Logs

1. Ir a **Logs** en Edge Functions
2. Buscar los logs de `test-email`
3. Deberías ver:
   - `✅ Conectado exitosamente a SMTP`
   - `✅ Correo de prueba enviado exitosamente a: rodrigozoramarroyo@gmail.com`

### Paso 4: Verificar el Correo

- Revisar la bandeja de entrada de: rodrigozoramarroyo@gmail.com
- Revisar carpeta de spam si no aparece
- El asunto será: "✅ Correo de Prueba - Sistema de Devoluciones"

---

## Opción 2: Desde la Terminal

### Paso 1: Desplegar la Función

```bash
cd sistema-devoluciones
supabase functions deploy test-email
```

### Paso 2: Invocar la Función

```bash
supabase functions invoke test-email --body '{"email": "rodrigozoramarroyo@gmail.com"}'
```

---

## Opción 3: Desde el Frontend (Temporal para Prueba)

Puedes crear un botón temporal en tu aplicación para probar:

```javascript
// En cualquier componente, temporalmente:
const probarCorreo = async () => {
  const { data, error } = await supabase.functions.invoke('test-email', {
    body: { email: 'rodrigozoramarroyo@gmail.com' }
  });
  
  if (error) {
    console.error('Error:', error);
    alert('Error al enviar correo de prueba');
  } else {
    console.log('Éxito:', data);
    alert('Correo de prueba enviado exitosamente');
  }
};
```

---

## ✅ Resultado Esperado

Si todo está bien configurado, deberías:

1. **En Supabase Logs:**
   ```
   ✅ Conectado exitosamente a SMTP
   ✅ Correo de prueba enviado exitosamente a: rodrigozoramarroyo@gmail.com
   ```

2. **En la Respuesta:**
   ```json
   {
     "success": true,
     "mensaje": "Correo de prueba enviado exitosamente a rodrigozoramarroyo@gmail.com",
     "detalles": {
       "desde": "Sistema de Devoluciones <pedidosdmhn@gmail.com>",
       "hacia": "rodrigozoramarroyo@gmail.com",
       "servidor": "smtp.gmail.com",
       "puerto": 587
     }
   }
   ```

3. **En el Correo:**
   - Deberías recibir un correo con el asunto: "✅ Correo de Prueba - Sistema de Devoluciones"
   - Remitente: "Sistema de Devoluciones <pedidosdmhn@gmail.com>"
   - Contenido HTML con confirmación de que funciona

---

## ⚠️ Solución de Problemas

### Error: "SMTP authentication failed"
- ✅ Verificar que `SMTP_PASSWORD` sea la contraseña de aplicación (sin espacios)
- ✅ Verificar que `SMTP_USER` sea el email completo: `pedidosdmhn@gmail.com`

### Error: "Connection timeout"
- ✅ Verificar que `SMTP_HOST` sea: `smtp.gmail.com`
- ✅ Verificar que `SMTP_PORT` sea: `587`

### Error: "Function not found"
- ✅ Verificar que la función `test-email` esté desplegada
- ✅ Verificar el nombre exacto: `test-email`

### El correo no llega
- ✅ Revisar carpeta de spam
- ✅ Verificar que el email de destino sea correcto
- ✅ Revisar logs en Supabase para ver si hubo errores

---

## 🎯 Después de la Prueba

Una vez que el correo de prueba funcione:

1. ✅ Eliminar la función `test-email` (opcional, solo era para prueba)
2. ✅ Verificar que `enviar-email-notificacion` esté desplegada
3. ✅ Probar el sistema completo creando/actualizando una devolución

---

## 📝 Nota

La función `test-email` es solo para pruebas. Una vez que verifiques que funciona, puedes eliminarla o dejarla para futuras pruebas.

