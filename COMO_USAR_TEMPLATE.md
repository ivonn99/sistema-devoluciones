# 📧 Cómo Usar el Template en EmailJS

## 🎯 Template Genérico Creado

He creado 2 versiones del template:

1. **`TEMPLATE_EMAILJS.html`** - Versión completa con estilos
2. **`TEMPLATE_EMAILJS_SIMPLE.html`** - Versión simple y rápida

## 📋 Pasos para Configurar en EmailJS

### Paso 1: Ir a EmailJS Templates

1. Ir a: https://www.emailjs.com
2. Iniciar sesión
3. Ir a **"Email Templates"**

### Paso 2: Crear Nuevo Template

1. Clic en **"Create New Template"**
2. Configurar:

   **Name:** `notificacion-devolucion`
   
   **From Name:** `Sistema de Devoluciones`
   
   **From Email:** `pedidosdmhn@gmail.com`
   
   **Subject:** `📦 Nueva Devolución Pendiente - {{numero_nota}}`
   
   **Content:** Copiar y pegar el contenido de `TEMPLATE_EMAILJS.html` o `TEMPLATE_EMAILJS_SIMPLE.html`

### Paso 3: Configurar Variables

El template usa estas variables (EmailJS las reemplazará automáticamente):

- `{{numero_nota}}` - Número de nota de la devolución
- `{{cliente}}` - Nombre del cliente
- `{{empresa}}` - Empresa
- `{{fecha_devolucion}}` - Fecha de devolución
- `{{vendedor}}` - Nombre del vendedor
- `{{motivo}}` - Motivo de devolución
- `{{proceso}}` - Proceso actual (Almacén, Crédito, etc.)
- `{{estado}}` - Estado actual

**No necesitas configurar nada más**, el código ya envía estas variables.

### Paso 4: Guardar y Copiar Template ID

1. Clic en **"Save"**
2. **Copiar el Template ID** (ej: `template_abc123`)

---

## ✅ Después de Crear el Template

1. **Template ID:** Copiarlo de EmailJS
2. **Public Key:** Copiarlo de Account → General
3. **Configurar en código:** Editar `src/utils/emailServiceSimple.js` líneas 9-10
4. **Cambiar import:** En `src/stores/devolucionesStore.jsx` línea 4

---

## 🎨 Personalización (Opcional)

Puedes modificar el template:
- Cambiar colores
- Agregar más información
- Cambiar el diseño

Solo asegúrate de mantener las variables `{{variable}}` para que funcionen.

---

## 📝 Variables Disponibles

El código envía estas variables al template:

```javascript
{
  to_email: email,
  numero_nota: devolucionData.numero_nota,
  cliente: devolucionData.cliente,
  empresa: devolucionData.empresa,
  motivo: devolucionData.motivo_devolucion_general,
  proceso: nombreProceso,
  fecha_devolucion: fecha formateada,
  vendedor: devolucionData.vendedor_nombre,
  estado: devolucionData.estado_actual
}
```

Todas estas variables están disponibles en el template con `{{variable}}`.



