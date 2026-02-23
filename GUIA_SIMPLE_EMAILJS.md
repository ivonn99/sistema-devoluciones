# 🚀 Guía SIMPLE: EmailJS con Gmail (5 minutos)

## ✅ Lo que Necesitas

1. Cuenta en EmailJS (gratis)
2. Conectar tu Gmail: pedidosdmhn@gmail.com
3. Instalar un paquete
4. Cambiar 1 línea de código

---

## 📋 Paso 1: Crear cuenta en EmailJS (2 minutos)

1. Ir a: **https://www.emailjs.com**
2. Clic en **"Sign Up"** (gratis)
3. Crear cuenta con tu email

---

## 📋 Paso 2: Conectar tu Gmail (1 minuto)

1. En EmailJS Dashboard, ir a **"Email Services"**
2. Clic en **"Add New Service"**
3. Seleccionar **"Gmail"**
4. Conectar tu cuenta: **pedidosdmhn@gmail.com**
5. Autorizar acceso de Google
6. **Copiar el Service ID** (ej: `service_abc123`)

---

## 📋 Paso 3: Crear Template (1 minuto)

1. Ir a **"Email Templates"**
2. Clic en **"Create New Template"**
3. Configurar:
   - **Name:** `notificacion-devolucion`
   - **From Name:** `Sistema de Devoluciones`
   - **From Email:** `pedidosdmhn@gmail.com`
   - **Subject:** `📦 Nueva Devolución Pendiente - {{numero_nota}}`
   - **Content:**
   ```html
   <h2>📦 Nueva Devolución Pendiente</h2>
   <p>Se ha asignado una nueva devolución a <strong>{{proceso}}</strong> que requiere su atención.</p>
   
   <h3>Detalles:</h3>
   <ul>
     <li><strong>Nota:</strong> {{numero_nota}}</li>
     <li><strong>Cliente:</strong> {{cliente}}</li>
     <li><strong>Empresa:</strong> {{empresa}}</li>
     <li><strong>Motivo:</strong> {{motivo}}</li>
     <li><strong>Fecha:</strong> {{fecha_devolucion}}</li>
   </ul>
   
   <p>Por favor, revise esta devolución en el sistema.</p>
   ```
4. **Copiar el Template ID** (ej: `template_xyz789`)

---

## 📋 Paso 4: Obtener Public Key (30 segundos)

1. Ir a **"Account"** → **"General"**
2. **Copiar el Public Key** (ej: `abcdefghijklmnop`)

---

## 📋 Paso 5: Instalar EmailJS (30 segundos)

```bash
npm install @emailjs/browser
```

---

## 📋 Paso 6: Configurar en tu código (1 minuto)

### Opción A: Variables de entorno (Recomendado)

1. Crear/editar archivo `.env` en la raíz del proyecto:
```
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abcdefghijklmnop
```

2. Editar `src/utils/emailServiceSimple.js`:
   - Descomentar las líneas 12-14 (las que usan `import.meta.env`)
   - Comentar las líneas 8-10 (las que tienen valores hardcodeados)

### Opción B: Directo en el código

Editar `src/utils/emailServiceSimple.js` líneas 8-10:
```javascript
const EMAILJS_SERVICE_ID = 'service_abc123'; // Tu Service ID
const EMAILJS_TEMPLATE_ID = 'template_xyz789'; // Tu Template ID
const EMAILJS_PUBLIC_KEY = 'abcdefghijklmnop'; // Tu Public Key
```

---

## 📋 Paso 7: Cambiar el import (30 segundos)

Editar `src/stores/devolucionesStore.jsx`:

**Cambiar esta línea:**
```javascript
import { enviarNotificacionEmail } from '../utils/emailService';
```

**Por esta:**
```javascript
import { enviarNotificacionEmail } from '../utils/emailServiceSimple';
```

---

## ✅ ¡Listo!

Ahora:
- ✅ Los correos salen desde **pedidosdmhn@gmail.com**
- ✅ Aparecen como **"Sistema de Devoluciones"**
- ✅ Funciona automáticamente
- ✅ **MUCHO MÁS SIMPLE** que Supabase Edge Functions

---

## 🧪 Probar

1. Crear o actualizar una devolución
2. Verificar en la consola: `✅ Correos enviados: 1/1`
3. Verificar que llegue el correo

---

## 📊 Resumen de Cambios

1. ✅ Instalar: `npm install @emailjs/browser`
2. ✅ Configurar EmailJS (Service ID, Template ID, Public Key)
3. ✅ Cambiar import en `devolucionesStore.jsx`
4. ✅ ¡Listo!

**Total: 5 minutos** vs 30+ minutos con Supabase Edge Functions

---

## 💡 Ventajas

- ⚡ **Súper simple** - Solo frontend
- 🚀 **Rápido** - 5 minutos de setup
- 📧 **Sale desde tu Gmail** - pedidosdmhn@gmail.com
- 🆓 **Gratis** - 200 emails/mes
- ✅ **Sin backend** - No necesitas Supabase Edge Functions

---

## ⚠️ Nota

Si prefieres usar variables de entorno (más seguro), crea el archivo `.env` y usa:
```javascript
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
```

