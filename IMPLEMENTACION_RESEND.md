# 📧 Implementación con Resend (Alternativa Simple)

## ¿Qué es Resend?

Resend es un servicio de email transaccional que permite enviar correos desde el frontend usando una API key pública (segura).

## Ventajas

- ✅ **Muy fácil** - Solo necesitas una API key
- ✅ **Mejor deliverability** - Menos correos en spam
- ✅ **Gratis** - 3,000 emails/mes
- ✅ **Desde frontend** - No necesitas backend
- ✅ **Analytics** - Puedes ver qué correos se enviaron

## Pasos de Implementación

### Paso 1: Crear cuenta en Resend

1. Ir a: https://resend.com
2. Crear cuenta (gratis)
3. Verificar tu email
4. Ir a **API Keys**
5. Crear nueva API key
6. **Copiar la API key** (empieza con `re_`)

### Paso 2: Instalar Resend

```bash
npm install resend
```

### Paso 3: Crear función de envío

Reemplazar `src/utils/emailService.js` con versión que usa Resend.

### Paso 4: Configurar API Key

Agregar la API key como variable de entorno en `.env`:

```
VITE_RESEND_API_KEY=re_tu_api_key_aqui
```

---

## Código de Implementación

### Opción A: Desde Frontend (Simple)

```javascript
// src/utils/emailService.js
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export const enviarNotificacionEmail = async (devolucionData, procesoNuevo, procesoAnterior) => {
  try {
    const procesosParaNotificar = ['almacen', 'credito', 'representante'];
    
    if (!procesosParaNotificar.includes(procesoNuevo)) {
      return { success: true, skipped: true };
    }

    const emailsDestinatarios = await obtenerEmailsPorProceso(procesoNuevo);
    
    if (!emailsDestinatarios || emailsDestinatarios.length === 0) {
      return { success: true, skipped: true };
    }

    // Preparar contenido del correo
    const htmlContent = generarHTMLCorreo(devolucionData, procesoNuevo);
    
    // Enviar a todos los destinatarios
    const resultados = await Promise.all(
      emailsDestinatarios.map(email => 
        resend.emails.send({
          from: 'Sistema de Devoluciones <onboarding@resend.dev>',
          to: email,
          subject: `📦 Nueva Devolución Pendiente - Nota ${devolucionData.numero_nota}`,
          html: htmlContent
        })
      )
    );

    console.log('✅ Correos enviados con Resend');
    return { success: true, data: resultados };

  } catch (error) {
    console.error('❌ Error al enviar correo con Resend:', error);
    return { success: false, error: error.message };
  }
};
```

### Opción B: Desde Backend (Más Seguro)

Crear endpoint en `server.json`:

```javascript
// server.json - Agregar endpoint
import express from 'express';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/api/enviar-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    const result = await resend.emails.send({
      from: 'Sistema de Devoluciones <onboarding@resend.dev>',
      to,
      subject,
      html
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Comparación: Resend vs Supabase Edge Functions

| Característica | Resend | Supabase Edge Functions |
|---------------|--------|------------------------|
| **Complejidad** | ⭐ Muy fácil | ⭐⭐ Media |
| **Setup** | API key + npm install | Edge Function + Secrets |
| **Costo** | 3,000/mes gratis | Gratis (límites según plan) |
| **Deliverability** | ✅ Excelente | ⚠️ Depende de SMTP |
| **Desde Frontend** | ✅ Sí (con API key pública) | ❌ No (necesita backend) |
| **Analytics** | ✅ Sí | ❌ No |

---

## ¿Cuándo usar Resend?

✅ **Usa Resend si:**
- Quieres algo más simple
- Necesitas mejor deliverability
- Quieres analytics de envíos
- No te importa depender de un servicio externo

❌ **Mantén Supabase si:**
- Ya está implementado (como en tu caso)
- Quieres control total
- No quieres depender de servicios externos
- Prefieres usar tus propias credenciales SMTP

---

## 💡 Recomendación

**Para tu caso específico:**

1. **Ahora:** Mantén Supabase Edge Functions (ya está hecho, solo falta configurar)
2. **Después:** Si tienes problemas de deliverability o necesitas más volumen, migra a Resend

**¿Por qué?**
- Ya tienes todo implementado
- Solo falta agregar las credenciales SMTP
- Resend requiere cambiar código
- Puedes migrar después si lo necesitas

---

## ¿Quieres que implemente Resend?

Si prefieres Resend, puedo:
1. ✅ Modificar `emailService.js` para usar Resend
2. ✅ Agregar endpoint en `server.json` (opcional, más seguro)
3. ✅ Actualizar documentación

¿Prefieres Resend o mantener Supabase?



