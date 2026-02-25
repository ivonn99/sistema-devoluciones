# ✅ Configuración Final de EmailJS

## 🎉 ¡Ya Funciona!

Recibiste el correo de prueba, eso significa que:
- ✅ Gmail está conectado correctamente
- ✅ Service ID: `service_vosp5tq`

## 📋 Lo que Falta

### Paso 1: Obtener Template ID

1. Ir a EmailJS Dashboard: https://www.emailjs.com
2. Ir a **"Email Templates"**
3. Si ya creaste un template, copiar el **Template ID** (ej: `template_xxxxx`)
4. Si NO has creado template, crear uno:
   - Clic en **"Create New Template"**
   - **Name:** `notificacion-devolucion`
   - **From Name:** `Sistema de Devoluciones`
   - **From Email:** `pedidosdmhn@gmail.com`
   - **Subject:** `📦 Nueva Devolución Pendiente - {{numero_nota}}`
   - **Content (HTML):**
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
     <li><strong>Vendedor:</strong> {{vendedor}}</li>
   </ul>
   
   <p><strong>Acción requerida:</strong> Por favor, revise esta devolución en el sistema.</p>
   ```
   - **Copiar el Template ID**

### Paso 2: Obtener Public Key

1. En EmailJS Dashboard, ir a **"Account"** → **"General"**
2. Buscar **"Public Key"**
3. **Copiar el Public Key** (ej: `abcdefghijklmnop`)

### Paso 3: Instalar EmailJS (si no lo hiciste)

```bash
npm install @emailjs/browser
```

### Paso 4: Configurar en el Código

Editar `src/utils/emailServiceSimple.js`:

**Línea 8-10, reemplazar con tus valores:**
```javascript
const EMAILJS_SERVICE_ID = 'service_vosp5tq'; // ✅ Ya lo tienes
const EMAILJS_TEMPLATE_ID = 'template_xxxxx'; // ← Reemplazar con tu Template ID
const EMAILJS_PUBLIC_KEY = 'xxxxxxxxxxxxx'; // ← Reemplazar con tu Public Key
```

### Paso 5: Cambiar el Import

Editar `src/stores/devolucionesStore.jsx`:

**Línea 4, cambiar:**
```javascript
import { enviarNotificacionEmail } from '../utils/emailService';
```

**Por:**
```javascript
import { enviarNotificacionEmail } from '../utils/emailServiceSimple';
```

---

## ✅ Checklist Final

- [x] Service ID: `service_vosp5tq` ✅
- [ ] Template ID: `template_xxxxx` (obtener de EmailJS)
- [ ] Public Key: `xxxxxxxxxxxxx` (obtener de EmailJS)
- [ ] Instalar: `npm install @emailjs/browser`
- [ ] Configurar valores en `emailServiceSimple.js`
- [ ] Cambiar import en `devolucionesStore.jsx`
- [ ] Probar creando/actualizando una devolución

---

## 🧪 Probar

1. Crear o actualizar una devolución
2. Verificar en consola: `✅ Correos enviados: 1/1`
3. Verificar que llegue el correo

---

## 📝 Resumen

Ya tienes:
- ✅ Service ID: `service_vosp5tq`
- ✅ Gmail conectado y funcionando

Solo falta:
1. Template ID (crear template en EmailJS)
2. Public Key (copiar de Account → General)
3. Configurar en el código
4. Cambiar el import

¡Estás a 2 minutos de terminar! 🚀



