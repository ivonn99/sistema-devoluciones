# 🚀 Pasos Finales - Desplegar y Probar

## ✅ Ya Completado
- [x] Variables SMTP agregadas en Supabase Secrets
- [x] Credenciales configuradas

## 📋 Lo que Falta

### Paso 1: Desplegar la Edge Function

Necesitas desplegar la función `enviar-email-notificacion` en Supabase.

#### Opción A: Desde la Terminal (Recomendado)

1. **Abrir terminal** en la carpeta del proyecto:
   ```bash
   cd sistema-devoluciones
   ```

2. **Instalar Supabase CLI** (si no lo tienes):
   ```bash
   npm install -g supabase
   ```

3. **Iniciar sesión en Supabase**:
   ```bash
   supabase login
   ```
   - Te abrirá el navegador para autenticarte

4. **Vincular tu proyecto**:
   ```bash
   supabase link --project-ref tu-project-ref
   ```
   - El `project-ref` lo encuentras en: Supabase Dashboard → Settings → General → Reference ID

5. **Desplegar la función**:
   ```bash
   supabase functions deploy enviar-email-notificacion
   ```

#### Opción B: Desde Supabase Dashboard

1. Ir a: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Edge Functions** en el menú lateral
4. Clic en **"Create a new function"**
5. Nombre: `enviar-email-notificacion`
6. Copiar el contenido de `supabase/functions/enviar-email-notificacion/index.ts`
7. Pegar en el editor
8. Clic en **"Deploy"**

---

### Paso 2: Verificar que la Función Esté Desplegada

1. Ir a Supabase Dashboard → **Edge Functions**
2. Deberías ver: `enviar-email-notificacion` en la lista
3. Estado: **Active** ✅

---

### Paso 3: Verificar Variables de Entorno

1. Ir a: Settings → **Edge Functions** → **Secrets**
2. Verificar que tengas estas 6 variables:
   - ✅ SMTP_HOST
   - ✅ SMTP_PORT
   - ✅ SMTP_USER
   - ✅ SMTP_PASSWORD
   - ✅ SMTP_FROM
   - ✅ SMTP_FROM_NAME

---

### Paso 4: Agregar Columna Email a Usuarios (Si no lo has hecho)

Ejecutar en Supabase SQL Editor:

```sql
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS email character varying;

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email) WHERE email IS NOT NULL;
```

---

### Paso 5: Agregar Emails a Usuarios

1. Ir a la sección de **Usuarios** en tu aplicación
2. Editar cada usuario
3. Agregar su email en el campo "Correo Electrónico"
4. Guardar

**O desde SQL:**
```sql
UPDATE public.usuarios 
SET email = 'usuario@ejemplo.com' 
WHERE username = 'nombre_usuario';
```

---

### Paso 6: Probar el Sistema

#### Prueba 1: Crear Nueva Devolución

1. Ir a **Nueva Devolución**
2. Llenar el formulario
3. Guardar
4. **Verificar:**
   - En la consola del navegador (F12) deberías ver:
     - `📧 Emails encontrados para credito: [...]`
     - `✅ Notificación de correo enviada exitosamente`
   - En Supabase Dashboard → Edge Functions → Logs:
     - Deberías ver logs del envío

#### Prueba 2: Actualizar Estado de Devolución

1. Ir a **Pendientes Crédito** (o cualquier sección)
2. Cambiar el estado de una devolución
3. **Verificar:**
   - Los logs en la consola
   - Los logs en Supabase
   - Que llegue el correo al destinatario

---

## 🔍 Verificación de Logs

### En el Navegador (F12 → Console):
```
📧 Emails encontrados para credito: ['usuario@ejemplo.com']
✅ Notificación de correo enviada exitosamente
```

### En Supabase Dashboard:
1. Ir a: **Edge Functions** → **Logs**
2. Buscar: `enviar-email-notificacion`
3. Deberías ver:
   - `✅ Correo enviado a: usuario@ejemplo.com`
   - O errores si hay problemas

---

## ⚠️ Solución de Problemas

### Error: "Function not found"
- ✅ Verificar que la función esté desplegada
- ✅ Verificar el nombre: `enviar-email-notificacion`

### Error: "SMTP authentication failed"
- ✅ Verificar que `SMTP_PASSWORD` sea la contraseña de aplicación (sin espacios)
- ✅ Verificar que `SMTP_USER` sea el email completo

### Error: "No hay destinatarios"
- ✅ Verificar que los usuarios tengan email en la tabla `usuarios`
- ✅ Verificar que los usuarios estén activos (`activo = true`)
- ✅ Verificar que tengan rol asignado

### Los correos no llegan
- ✅ Revisar carpeta de spam
- ✅ Verificar logs en Supabase
- ✅ Verificar que el email del destinatario sea correcto

---

## ✅ Checklist Final

- [ ] Edge Function desplegada
- [ ] Variables de entorno verificadas (6 variables)
- [ ] Columna `email` agregada a tabla `usuarios`
- [ ] Al menos un usuario tiene email configurado
- [ ] Usuario tiene rol asignado (`jefe_almacen`, `credito_cobranza`, o `administrador`)
- [ ] Probar creando/actualizando una devolución
- [ ] Verificar logs en navegador y Supabase
- [ ] Verificar que llegue el correo

---

## 🎉 ¡Listo!

Una vez completados estos pasos, el sistema de notificaciones por correo estará funcionando completamente.

Los correos se enviarán automáticamente cuando:
- Se registre una nueva devolución
- Se cambie el estado de una devolución
- Se solicite una corrección



