// Función de prueba para enviar un correo de prueba
// Invoca esta función desde Supabase Dashboard o desde el frontend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Obtener email de destino del body o usar el por defecto
    const body = await req.json().catch(() => ({}));
    const emailDestino = body.email || 'rodrigozoramarroyo@gmail.com';

    // Obtener credenciales SMTP de variables de entorno
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;
    const smtpFromName = Deno.env.get('SMTP_FROM_NAME') || 'Sistema de Devoluciones';

    if (!smtpHost || !smtpUser || !smtpPassword) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuración SMTP incompleta',
          detalles: {
            tieneHost: !!smtpHost,
            tieneUser: !!smtpUser,
            tienePassword: !!smtpPassword
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Crear contenido del correo de prueba
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Correo de Prueba Exitoso</h1>
      <p style="margin: 0;">Sistema de Devoluciones</p>
    </div>
    
    <div class="content">
      <div class="success-box">
        <h2 style="margin-top: 0; color: #065f46;">¡Funciona Perfectamente! 🎉</h2>
        <p>Este es un correo de prueba para verificar que la configuración SMTP está funcionando correctamente.</p>
      </div>
      
      <h3>📋 Detalles de la Configuración:</h3>
      <ul>
        <li><strong>Servidor SMTP:</strong> ${smtpHost}</li>
        <li><strong>Puerto:</strong> ${smtpPort}</li>
        <li><strong>Remitente:</strong> ${smtpFromName} &lt;${smtpFrom}&gt;</li>
        <li><strong>Fecha de prueba:</strong> ${new Date().toLocaleString('es-MX')}</li>
      </ul>
      
      <p>Si recibiste este correo, significa que:</p>
      <ul>
        <li>✅ Las credenciales SMTP están correctas</li>
        <li>✅ La Edge Function está funcionando</li>
        <li>✅ El sistema de notificaciones está listo</li>
      </ul>
      
      <p style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
        <strong>Próximos pasos:</strong> Ahora puedes probar el sistema completo creando o actualizando una devolución. Los correos se enviarán automáticamente.
      </p>
    </div>
    
    <div class="footer">
      <p>Este es un correo automático del Sistema de Devoluciones.</p>
      <p>Correo de prueba enviado desde: ${smtpFrom}</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
CORREO DE PRUEBA EXITOSO
========================

¡Funciona Perfectamente! 🎉

Este es un correo de prueba para verificar que la configuración SMTP está funcionando correctamente.

Detalles de la Configuración:
- Servidor SMTP: ${smtpHost}
- Puerto: ${smtpPort}
- Remitente: ${smtpFromName} <${smtpFrom}>
- Fecha de prueba: ${new Date().toLocaleString('es-MX')}

Si recibiste este correo, significa que:
✅ Las credenciales SMTP están correctas
✅ La Edge Function está funcionando
✅ El sistema de notificaciones está listo

Próximos pasos: Ahora puedes probar el sistema completo creando o actualizando una devolución.

Correo de prueba enviado desde: ${smtpFrom}
    `;

    // Configurar cliente SMTP
    const client = new SmtpClient();

    console.log(`🔍 Intentando conectar a ${smtpHost}:${smtpPort}...`);

    // Conectar al servidor SMTP
    await client.connect({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPassword,
    });

    console.log(`✅ Conectado exitosamente a SMTP`);

    // Enviar correo de prueba
    await client.send({
      from: `${smtpFromName} <${smtpFrom}>`,
      to: emailDestino,
      subject: '✅ Correo de Prueba - Sistema de Devoluciones',
      content: textContent,
      html: htmlContent,
    });

    await client.close();

    console.log(`✅ Correo de prueba enviado exitosamente a: ${emailDestino}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        mensaje: `Correo de prueba enviado exitosamente a ${emailDestino}`,
        detalles: {
          desde: `${smtpFromName} <${smtpFrom}>`,
          hacia: emailDestino,
          servidor: smtpHost,
          puerto: smtpPort
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error en correo de prueba:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al enviar correo de prueba',
        mensaje: error.message,
        detalles: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});



