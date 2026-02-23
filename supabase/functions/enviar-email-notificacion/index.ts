// Supabase Edge Function para enviar correos de notificación por SMTP
// Esta función se ejecuta cuando cambia el proceso de una devolución

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  to: string[];
  proceso: string;
  procesoAnterior: string;
  devolucion: {
    id: number;
    numero_nota: string;
    cliente: string;
    empresa: string;
    fecha_devolucion: string;
    motivo_devolucion_general: string;
    estado_actual: string;
    vendedor_nombre?: string;
  };
}

serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const emailData: EmailData = await req.json();

    // Validar datos requeridos
    if (!emailData.to || !Array.isArray(emailData.to) || emailData.to.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hay destinatarios para el correo' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!emailData.devolucion) {
      return new Response(
        JSON.stringify({ error: 'Datos de devolución faltantes' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obtener credenciales SMTP de variables de entorno
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME') || 'Sistema de Devoluciones';

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error('❌ Credenciales SMTP no configuradas');
      return new Response(
        JSON.stringify({ error: 'Configuración SMTP incompleta' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mapear nombres de procesos a nombres legibles
    const nombresProceso: Record<string, string> = {
      'almacen': 'Almacén',
      'credito': 'Crédito y Cobranza',
      'representante': 'Representante/Administración'
    };

    const nombreProceso = nombresProceso[emailData.proceso] || emailData.proceso;
    const nombreProcesoAnterior = nombresProceso[emailData.procesoAnterior] || emailData.procesoAnterior || 'Inicial';

    // Formatear fecha
    const fechaDevolucion = new Date(emailData.devolucion.fecha_devolucion);
    const fechaFormateada = fechaDevolucion.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Crear contenido HTML del correo
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .info-box { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; border-radius: 4px; }
    .info-label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .info-value { font-size: 16px; margin-top: 5px; }
    .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-almacen { background-color: #3b82f6; color: white; }
    .badge-credito { background-color: #10b981; color: white; }
    .badge-representante { background-color: #f59e0b; color: white; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Nueva Devolución Pendiente</h1>
      <p style="margin: 0;">Sistema de Devoluciones</p>
    </div>
    
    <div class="content">
      <p>Se ha asignado una nueva devolución a <strong>${nombreProceso}</strong> que requiere su atención.</p>
      
      <div class="info-box">
        <div class="info-label">Número de Nota</div>
        <div class="info-value">${emailData.devolucion.numero_nota || 'N/A'}</div>
      </div>
      
      <div class="info-box">
        <div class="info-label">Cliente</div>
        <div class="info-value">${emailData.devolucion.cliente}</div>
      </div>
      
      <div class="info-box">
        <div class="info-label">Empresa</div>
        <div class="info-value">${emailData.devolucion.empresa}</div>
      </div>
      
      <div class="info-box">
        <div class="info-label">Fecha de Devolución</div>
        <div class="info-value">${fechaFormateada}</div>
      </div>
      
      ${emailData.devolucion.vendedor_nombre ? `
      <div class="info-box">
        <div class="info-label">Vendedor</div>
        <div class="info-value">${emailData.devolucion.vendedor_nombre}</div>
      </div>
      ` : ''}
      
      <div class="info-box">
        <div class="info-label">Motivo de Devolución</div>
        <div class="info-value">${emailData.devolucion.motivo_devolucion_general}</div>
      </div>
      
      <div class="info-box">
        <div class="info-label">Estado Actual</div>
        <div class="info-value">
          <span class="badge badge-${emailData.proceso}">${emailData.devolucion.estado_actual.replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>
      
      <div class="info-box">
        <div class="info-label">Proceso</div>
        <div class="info-value">
          ${nombreProcesoAnterior !== nombreProceso ? `${nombreProcesoAnterior} → ${nombreProceso}` : nombreProceso}
        </div>
      </div>
      
      <p style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
        <strong>Acción requerida:</strong> Por favor, revise esta devolución en el sistema y tome las acciones correspondientes.
      </p>
    </div>
    
    <div class="footer">
      <p>Este es un correo automático del Sistema de Devoluciones.</p>
      <p>ID de Devolución: ${emailData.devolucion.id}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Crear contenido de texto plano (fallback)
    const textContent = `
NUEVA DEVOLUCIÓN PENDIENTE
==========================

Se ha asignado una nueva devolución a ${nombreProceso} que requiere su atención.

Número de Nota: ${emailData.devolucion.numero_nota || 'N/A'}
Cliente: ${emailData.devolucion.cliente}
Empresa: ${emailData.devolucion.empresa}
Fecha de Devolución: ${fechaFormateada}
${emailData.devolucion.vendedor_nombre ? `Vendedor: ${emailData.devolucion.vendedor_nombre}` : ''}
Motivo: ${emailData.devolucion.motivo_devolucion_general}
Estado: ${emailData.devolucion.estado_actual}
Proceso: ${nombreProceso}

Acción requerida: Por favor, revise esta devolución en el sistema.

ID de Devolución: ${emailData.devolucion.id}
    `;

    // Configurar cliente SMTP
    const client = new SmtpClient();

    // Conectar al servidor SMTP
    await client.connect({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPassword,
    });

    // Enviar correo a todos los destinatarios
    const resultados = [];
    for (const destinatario of emailData.to) {
      try {
        await client.send({
          from: `${smtpFromName} <${smtpFrom}>`,
          to: destinatario,
          subject: `📦 Nueva Devolución Pendiente - Nota ${emailData.devolucion.numero_nota || emailData.devolucion.id}`,
          content: textContent,
          html: htmlContent,
        });
        resultados.push({ email: destinatario, success: true });
        console.log(`✅ Correo enviado a: ${destinatario}`);
      } catch (error) {
        console.error(`❌ Error al enviar a ${destinatario}:`, error);
        resultados.push({ email: destinatario, success: false, error: error.message });
      }
    }

    await client.close();

    // Verificar si al menos un correo se envió exitosamente
    const exitosos = resultados.filter(r => r.success).length;
    if (exitosos === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No se pudo enviar ningún correo',
          detalles: resultados 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        mensaje: `Correos enviados: ${exitosos}/${emailData.to.length}`,
        resultados 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error en Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al procesar solicitud de correo',
        mensaje: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

