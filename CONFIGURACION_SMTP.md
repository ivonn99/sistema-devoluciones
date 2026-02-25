# 📧 Guía Completa: Configuración de Credenciales SMTP

Esta guía te ayudará a obtener y configurar las credenciales SMTP para el sistema de notificaciones por correo.

## 🎯 Opciones de Proveedores SMTP

### Opción 1: Gmail (Recomendado para empezar)

#### Ventajas:
- ✅ Gratis
- ✅ Fácil de configurar
- ✅ Confiable

#### Pasos para obtener credenciales:

1. **Activar Verificación en 2 Pasos**
   - Ir a: https://myaccount.google.com/security
   - Activar "Verificación en 2 pasos" si no está activada

2. **Generar Contraseña de Aplicación**
   - Ir a: https://myaccount.google.com/apppasswords
   - O seguir: Google Account → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones
   - Seleccionar "Correo" como aplicación
   - Seleccionar "Otro (nombre personalizado)" como dispositivo
   - Escribir: "Sistema Devoluciones"
   - Hacer clic en "Generar"
   - **Copiar la contraseña generada** (16 caracteres sin espacios)

3. **Credenciales para Supabase:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  (la contraseña de aplicación generada, sin espacios)
   SMTP_FROM=tu-email@gmail.com
   SMTP_FROM_NAME=Sistema de Devoluciones
   ```

---

### Opción 2: Outlook/Office 365

#### Ventajas:
- ✅ Gratis con cuenta Microsoft
- ✅ Buena deliverability

#### Pasos:

1. **Activar Autenticación Moderna**
   - Asegúrate de tener autenticación de 2 factores activada

2. **Credenciales para Supabase:**
   ```
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_USER=tu-email@outlook.com (o @hotmail.com, @live.com)
   SMTP_PASSWORD=tu-contraseña-normal
   SMTP_FROM=tu-email@outlook.com
   SMTP_FROM_NAME=Sistema de Devoluciones
   ```

---

### Opción 3: Servidor SMTP Propio

Si tienes un servidor de correo propio (ej: cPanel, Plesk, Exchange):

```
SMTP_HOST=mail.tudominio.com (o la IP del servidor)
SMTP_PORT=587 (o 465 para SSL, o 25)
SMTP_USER=tu-usuario@tudominio.com
SMTP_PASSWORD=tu-contraseña
SMTP_FROM=notificaciones@tudominio.com
SMTP_FROM_NAME=Sistema de Devoluciones
```

---

## 🔧 Configurar en Supabase

### Paso 1: Ir al Dashboard de Supabase

1. Abre tu proyecto en: https://supabase.com/dashboard
2. Selecciona tu proyecto

### Paso 2: Ir a Edge Functions → Secrets

1. En el menú lateral, ve a **Settings** (⚙️)
2. Busca **Edge Functions** en el menú
3. Haz clic en **Secrets**

### Paso 3: Agregar las Variables de Entorno

Haz clic en **"Add new secret"** y agrega cada una de estas variables:

#### Variable 1: SMTP_HOST
- **Name:** `SMTP_HOST`
- **Value:** `smtp.gmail.com` (o el host de tu proveedor)
- **Description:** Host del servidor SMTP

#### Variable 2: SMTP_PORT
- **Name:** `SMTP_PORT`
- **Value:** `587`
- **Description:** Puerto del servidor SMTP

#### Variable 3: SMTP_USER
- **Name:** `SMTP_USER`
- **Value:** `tu-email@gmail.com` (tu email completo)
- **Description:** Usuario/email para autenticación SMTP

#### Variable 4: SMTP_PASSWORD
- **Name:** `SMTP_PASSWORD`
- **Value:** `xxxx xxxx xxxx xxxx` (tu contraseña de aplicación)
- **Description:** Contraseña para autenticación SMTP

#### Variable 5: SMTP_FROM
- **Name:** `SMTP_FROM`
- **Value:** `tu-email@gmail.com` (mismo que SMTP_USER generalmente)
- **Description:** Email que aparecerá como remitente

#### Variable 6: SMTP_FROM_NAME
- **Name:** `SMTP_FROM_NAME`
- **Value:** `Sistema de Devoluciones`
- **Description:** Nombre que aparecerá como remitente

### Paso 4: Verificar

Después de agregar todas las variables, deberías ver algo como:

```
✅ SMTP_HOST
✅ SMTP_PORT
✅ SMTP_USER
✅ SMTP_PASSWORD
✅ SMTP_FROM
✅ SMTP_FROM_NAME
```

---

## 🧪 Probar la Configuración

### Opción A: Probar desde el código

1. Crear o actualizar una devolución para que cambie de proceso
2. Verificar los logs en Supabase Dashboard → Edge Functions → Logs
3. Buscar mensajes como:
   - `✅ Correo enviado a: usuario@ejemplo.com`
   - O errores si hay problemas

### Opción B: Probar directamente con la Edge Function

Puedes invocar la función manualmente desde el SQL Editor de Supabase:

```sql
-- Esto es solo para referencia, la función se llama automáticamente
-- Pero puedes verificar que esté desplegada en:
-- Supabase Dashboard → Edge Functions
```

---

## ⚠️ Solución de Problemas

### Error: "Authentication failed"

**Gmail:**
- ✅ Asegúrate de usar una **Contraseña de Aplicación**, no tu contraseña normal
- ✅ Verifica que la verificación en 2 pasos esté activada
- ✅ La contraseña debe tener 16 caracteres (sin espacios al copiarla)

**Outlook:**
- ✅ Verifica que la autenticación de 2 factores esté activada
- ✅ Intenta usar tu contraseña normal primero

### Error: "Connection timeout"

- ✅ Verifica que el `SMTP_HOST` sea correcto
- ✅ Verifica que el `SMTP_PORT` sea correcto (587 para TLS, 465 para SSL)
- ✅ Verifica que no haya firewall bloqueando la conexión

### Los correos van a spam

**Soluciones:**
1. Configurar SPF y DKIM en tu dominio (si usas servidor propio)
2. Usar un servicio de email transaccional (SendGrid, Mailgun, Resend)
3. Pedir a los usuarios que agreguen el remitente a contactos

### No se envían correos

1. ✅ Verificar que la Edge Function esté desplegada
2. ✅ Verificar que todas las variables de entorno estén configuradas
3. ✅ Revisar los logs de Edge Functions en Supabase
4. ✅ Verificar que los usuarios tengan email en la tabla `usuarios`

---

## 📋 Checklist de Configuración

- [ ] Credenciales SMTP obtenidas (host, puerto, usuario, contraseña)
- [ ] Variables de entorno agregadas en Supabase (6 variables)
- [ ] Edge Function desplegada (`enviar-email-notificacion`)
- [ ] Columna `email` agregada a la tabla `usuarios`
- [ ] Al menos un usuario tiene email configurado
- [ ] Usuario tiene rol asignado (`jefe_almacen`, `credito_cobranza`, o `administrador`)
- [ ] Probar creando/actualizando una devolución

---

## 🔐 Seguridad

- ⚠️ **NUNCA** expongas las credenciales SMTP en el código del frontend
- ✅ Las credenciales están seguras en Supabase Secrets (encriptadas)
- ✅ Solo el backend (Edge Functions) puede acceder a ellas
- ✅ Usa "App Passwords" cuando sea posible (Gmail, Outlook)

---

## 💡 Recomendaciones

1. **Para producción:** Considera usar un servicio de email transaccional:
   - **Resend** (recomendado): https://resend.com (gratis hasta 3,000 emails/mes)
   - **SendGrid**: https://sendgrid.com (gratis hasta 100 emails/día)
   - **Mailgun**: https://mailgun.com (gratis hasta 5,000 emails/mes)

2. **Para desarrollo:** Gmail funciona bien, pero limita a 500 emails/día

3. **Monitoreo:** Revisa regularmente los logs de Edge Functions para detectar problemas

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa los logs en Supabase Dashboard → Edge Functions → Logs
2. Verifica que todas las variables estén correctamente escritas (sin espacios extra)
3. Prueba las credenciales con un cliente de correo externo (Thunderbird, Outlook) para verificar que funcionen



