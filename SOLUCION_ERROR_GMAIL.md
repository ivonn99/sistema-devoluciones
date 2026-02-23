# 🔧 Solución: Error "Insufficient authentication scopes" en Gmail

## ❌ El Problema

El error `412 Gmail_API: Request had insufficient authentication scopes` significa que cuando conectaste tu Gmail en EmailJS, no se dieron los permisos correctos para enviar correos.

## ✅ Solución: Re-autorizar Gmail con Permisos Correctos

### Paso 1: Desconectar y Reconectar Gmail en EmailJS

1. Ir a: https://www.emailjs.com
2. Iniciar sesión
3. Ir a **"Email Services"**
4. Buscar tu servicio de Gmail
5. Clic en **"Delete"** o **"Remove"** para eliminarlo

### Paso 2: Reconectar Gmail con Permisos Correctos

1. Clic en **"Add New Service"**
2. Seleccionar **"Gmail"**
3. **IMPORTANTE:** Cuando Google te pida permisos, asegúrate de:
   - ✅ Dar acceso a **"Send email on your behalf"**
   - ✅ Dar acceso a **"View your email address"**
   - ✅ **NO** solo dar acceso de lectura

4. Si Google te muestra una advertencia de "Esta app no está verificada":
   - Clic en **"Advanced"** (Avanzado)
   - Clic en **"Go to [tu app] (unsafe)"** o **"Continue"**

5. Autorizar completamente

### Paso 3: Verificar Permisos en Google

1. Ir a: https://myaccount.google.com/permissions
2. Buscar **"EmailJS"** o la app que autorizaste
3. Verificar que tenga permisos de **"Send email"**
4. Si no los tiene, eliminar y volver a autorizar

---

## 🔄 Alternativa: Usar Gmail SMTP en EmailJS

Si el problema persiste, puedes usar **Gmail SMTP** en lugar de Gmail API:

### Paso 1: Eliminar Servicio Gmail Actual

1. En EmailJS → Email Services
2. Eliminar el servicio de Gmail actual

### Paso 2: Agregar Gmail SMTP

1. Clic en **"Add New Service"**
2. Seleccionar **"Custom SMTP Server"** o **"Other"**
3. Configurar:
   - **Service Name:** `Gmail SMTP`
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** `pedidosdmhn@gmail.com`
   - **Password:** `nxgrwloaygxtoobo` (tu contraseña de aplicación)
   - **Secure:** `TLS` o `STARTTLS`

4. Guardar

---

## 🔑 Obtener Contraseña de Aplicación (Si no la tienes)

Si no tienes una contraseña de aplicación:

1. Ir a: https://myaccount.google.com/apppasswords
2. Activar "Verificación en 2 pasos" si no está activada
3. Seleccionar **"Correo"** como aplicación
4. Seleccionar **"Otro"** como dispositivo
5. Escribir: "EmailJS"
6. Clic en **"Generar"**
7. **Copiar la contraseña** (16 caracteres, sin espacios)

---

## ✅ Verificar que Funcione

Después de reconfigurar:

1. En EmailJS, ir a **"Email Templates"**
2. Seleccionar tu template
3. Clic en **"Test"** o **"Send Test Email"**
4. Enviar a tu email: rodrigozoramarroyo@gmail.com
5. Verificar que llegue

---

## 🎯 Si el Problema Persiste

### Opción A: Usar OAuth2 Manual

1. En EmailJS, en lugar de conectar Gmail directamente
2. Usar **"Custom SMTP"** con tus credenciales
3. Esto evita problemas de permisos de Google API

### Opción B: Volver a Supabase Edge Functions

Si EmailJS sigue dando problemas, puedes volver a usar Supabase Edge Functions que ya tienes configurado. Solo necesitas:
- Desplegar la función `enviar-email-notificacion`
- Ya tienes las credenciales SMTP configuradas

---

## 📝 Resumen Rápido

**El error significa:** Google no dio los permisos correctos para enviar correos.

**Solución:**
1. Eliminar servicio Gmail en EmailJS
2. Reconectar dando TODOS los permisos
3. O usar "Custom SMTP" con tus credenciales SMTP

¿Quieres que te guíe paso a paso para reconectar Gmail o prefieres usar Custom SMTP?

