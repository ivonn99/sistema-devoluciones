# 📧 Solución MÁS SIMPLE: EmailJS con Gmail

## ✅ Ventajas

- ⚡ **MUY FÁCIL** - Solo 3 pasos
- 🚀 **Desde el frontend** - No necesitas backend
- 📧 **Sale desde tu Gmail** - pedidosdmhn@gmail.com
- 🆓 **Gratis** - 200 emails/mes
- ⏱️ **5 minutos** de configuración

---

## 🚀 Pasos (Súper Simple)

### Paso 1: Crear cuenta en EmailJS

1. Ir a: https://www.emailjs.com
2. Clic en **"Sign Up"** (gratis)
3. Crear cuenta con tu email

### Paso 2: Conectar tu Gmail

1. En EmailJS Dashboard, ir a **"Email Services"**
2. Clic en **"Add New Service"**
3. Seleccionar **"Gmail"**
4. Conectar tu cuenta: **pedidosdmhn@gmail.com**
5. Autorizar acceso
6. **Copiar el Service ID** (ej: `service_xxxxx`)

### Paso 3: Crear Template de Correo

1. Ir a **"Email Templates"**
2. Clic en **"Create New Template"**
3. Nombre: `notificacion-devolucion`
4. **From Name:** `Sistema de Devoluciones`
5. **From Email:** `pedidosdmhn@gmail.com`
6. **Subject:** `📦 Nueva Devolución Pendiente - {{numero_nota}}`
7. **Content (HTML):**
```html
<h2>📦 Nueva Devolución Pendiente</h2>
<p>Se ha asignado una nueva devolución a <strong>{{proceso}}</strong> que requiere su atención.</p>

<h3>Detalles:</h3>
<ul>
  <li><strong>Nota:</strong> {{numero_nota}}</li>
  <li><strong>Cliente:</strong> {{cliente}}</li>
  <li><strong>Empresa:</strong> {{empresa}}</li>
  <li><strong>Motivo:</strong> {{motivo}}</li>
</ul>

<p>Por favor, revise esta devolución en el sistema.</p>
```
8. **Copiar el Template ID** (ej: `template_xxxxx`)

### Paso 4: Obtener Public Key

1. Ir a **"Account"** → **"General"**
2. **Copiar el Public Key** (ej: `xxxxxxxxxxxxx`)

---

## 💻 Instalación en tu Proyecto

### 1. Instalar EmailJS

```bash
npm install @emailjs/browser
```

### 2. Reemplazar `src/utils/emailService.js`

```javascript
import emailjs from '@emailjs/browser';

// Configurar (solo una vez)
const EMAILJS_SERVICE_ID = 'service_xxxxx'; // Tu Service ID
const EMAILJS_TEMPLATE_ID = 'template_xxxxx'; // Tu Template ID
const EMAILJS_PUBLIC_KEY = 'xxxxxxxxxxxxx'; // Tu Public Key

export const enviarNotificacionEmail = async (devolucionData, procesoNuevo, procesoAnterior) => {
  try {
    const procesosParaNotificar = ['almacen', 'credito', 'representante'];
    
    if (!procesosParaNotificar.includes(procesoNuevo)) {
      return { success: true, skipped: true };
    }

    // Obtener emails de destinatarios
    const emailsDestinatarios = await obtenerEmailsPorProceso(procesoNuevo);
    
    if (!emailsDestinatarios || emailsDestinatarios.length === 0) {
      return { success: true, skipped: true };
    }

    // Enviar a todos los destinatarios
    const resultados = await Promise.all(
      emailsDestinatarios.map(email => 
        emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            numero_nota: devolucionData.numero_nota || devolucionData.id,
            cliente: devolucionData.cliente,
            empresa: devolucionData.empresa,
            motivo: devolucionData.motivo_devolucion_general,
            proceso: procesoNuevo,
            to_email: email
          },
          EMAILJS_PUBLIC_KEY
        )
      )
    );

    console.log('✅ Correos enviados con EmailJS');
    return { success: true, data: resultados };

  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    return { success: false, error: error.message };
  }
};

// Mantener la función obtenerEmailsPorProceso igual
const obtenerEmailsPorProceso = async (proceso) => {
  // ... (código existente)
};
```

### 3. Agregar variables de entorno (opcional)

Crear archivo `.env`:
```
VITE_EMAILJS_SERVICE_ID=service_xxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxx
```

Y usar en el código:
```javascript
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
```

---

## ✅ ¡Listo!

Con esto:
- ✅ Los correos salen desde **pedidosdmhn@gmail.com**
- ✅ Aparecen como **"Sistema de Devoluciones"**
- ✅ Funciona desde el frontend (sin backend)
- ✅ Muy simple de configurar

---

## 📊 Comparación

| Característica | EmailJS | Supabase Edge Functions |
|---------------|---------|------------------------|
| **Complejidad** | ⭐ Muy fácil | ⭐⭐ Media |
| **Setup** | 5 minutos | 30+ minutos |
| **Backend** | ❌ No necesario | ✅ Necesario |
| **Desde Gmail** | ✅ Sí | ✅ Sí |
| **Costo** | 200/mes gratis | Gratis (límites) |

---

## 🎯 ¿Prefieres esta opción?

Si quieres, puedo:
1. ✅ Modificar `emailService.js` para usar EmailJS
2. ✅ Crear el template de correo
3. ✅ Darte instrucciones paso a paso

**Es la opción MÁS SIMPLE** y funciona perfectamente con Gmail.



