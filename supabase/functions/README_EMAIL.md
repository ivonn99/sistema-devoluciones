# 📧 Configuración de Notificaciones por Correo

Este documento explica cómo configurar el sistema de notificaciones por correo cuando una devolución cambia de proceso.

## 🎯 ¿Cómo Funciona?

1. Cuando se actualiza el estado de una devolución y cambia el `proceso_en` a:
   - `almacen` → Se notifica a usuarios con rol `jefe_almacen`
   - `credito` → Se notifica a usuarios con rol `credito_cobranza`
   - `representante` → Se notifica a usuarios con rol `administrador`

2. El correo se envía **de forma asíncrona** - no bloquea la actualización principal
3. Si el correo falla, la actualización en Supabase **sigue siendo exitosa**

## 📋 Requisitos Previos

1. **Credenciales SMTP** de uno de estos proveedores:
   - Gmail (con App Password)
   - Outlook/Office 365
   - Servidor SMTP propio
   - Cualquier proveedor SMTP estándar

2. **Supabase CLI** instalado (para desplegar la Edge Function)

## 🚀 Pasos de Configuración

### Paso 1: Obtener Credenciales SMTP

#### Opción A: Gmail
1. Ir a tu cuenta de Google
2. Activar "Verificación en 2 pasos"
3. Ir a "Contraseñas de aplicaciones"
4. Generar una nueva contraseña para "Correo"
5. Usar estas credenciales:
   - **SMTP_HOST**: `smtp.gmail.com`
   - **SMTP_PORT**: `587`
   - **SMTP_USER**: Tu email de Gmail
   - **SMTP_PASSWORD**: La contraseña de aplicación generada

#### Opción B: Outlook/Office 365
- **SMTP_HOST**: `smtp.office365.com`
- **SMTP_PORT**: `587`
- **SMTP_USER**: Tu email de Office 365
- **SMTP_PASSWORD**: Tu contraseña

#### Opción C: Servidor SMTP Propio
- Usar las credenciales proporcionadas por tu proveedor

### Paso 2: Desplegar la Edge Function

1. **Instalar Supabase CLI** (si no lo tienes):
```bash
npm install -g supabase
```

2. **Iniciar sesión en Supabase**:
```bash
supabase login
```

3. **Vincular tu proyecto**:
```bash
supabase link --project-ref tu-project-ref
```

4. **Desplegar la función**:
```bash
supabase functions deploy enviar-email-notificacion
```

### Paso 3: Configurar Variables de Entorno

En el dashboard de Supabase:

1. Ir a **Project Settings** → **Edge Functions** → **Secrets**
2. Agregar las siguientes variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
SMTP_FROM=tu-email@gmail.com
SMTP_FROM_NAME=Sistema de Devoluciones
```

### Paso 4: Verificar que los Usuarios Tengan Email

Asegúrate de que los usuarios en la tabla `usuarios` tengan:
- Campo `email` configurado
- Campo `activo = true`
- Rol asignado correctamente (`jefe_almacen`, `credito_cobranza`, o `administrador`)

## 🧪 Probar la Funcionalidad

1. Actualizar el estado de una devolución para que cambie a `almacen`, `credito` o `representante`
2. Verificar los logs en Supabase Dashboard → Edge Functions → Logs
3. Verificar que llegue el correo a los destinatarios

## 🔍 Solución de Problemas

### El correo no se envía
1. Verificar que las variables de entorno estén configuradas correctamente
2. Revisar los logs de la Edge Function en Supabase
3. Verificar que los usuarios tengan email y estén activos
4. Probar las credenciales SMTP con un cliente de correo externo

### Error de autenticación SMTP
- Gmail: Asegúrate de usar una "App Password", no tu contraseña normal
- Outlook: Verifica que la autenticación de 2 factores esté activada
- Otros: Verifica usuario y contraseña

### Los correos van a spam
- Configurar SPF y DKIM en tu dominio (si usas servidor propio)
- Usar un servicio de email transaccional (SendGrid, Mailgun) para mejor deliverability

## 📝 Notas Importantes

- ⚠️ El envío de correo es **asíncrono** - no bloquea la actualización
- ⚠️ Si el correo falla, la actualización en Supabase **sigue siendo exitosa**
- ✅ Los errores se registran en la consola pero no afectan el flujo principal
- ✅ Se pueden enviar correos a múltiples destinatarios simultáneamente

## 🔐 Seguridad

- Las credenciales SMTP están almacenadas como **secrets** en Supabase (encriptados)
- Nunca expongas las credenciales en el código del frontend
- Usa "App Passwords" cuando sea posible (Gmail, Outlook)

