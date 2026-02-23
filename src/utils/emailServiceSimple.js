// Versión SIMPLIFICADA usando EmailJS - Sale desde tu Gmail
// MUCHO MÁS SIMPLE que Supabase Edge Functions

import emailjs from '@emailjs/browser';
import { supabase } from '../config/supabase';

// ⚙️ CONFIGURACIÓN - EmailJS
const EMAILJS_SERVICE_ID = 'service_vosp5tq'; // ✅ Ya configurado
const EMAILJS_TEMPLATE_ID = 'template_6ymm82t'; // ✅ Ya configurado
const EMAILJS_PUBLIC_KEY = 'NPuNEema_2b9GzByp'; // ✅ Public Key configurado (probando este)

// O usar variables de entorno (recomendado):
// const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
// const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
// const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * 🚀 Función SIMPLIFICADA para enviar notificaciones por correo
 * Usa EmailJS - Sale desde tu Gmail (pedidosdmhn@gmail.com)
 */
export const enviarNotificacionEmail = async (devolucionData, procesoNuevo, procesoAnterior) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 [EMAILJS] Iniciando envío de notificación');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 Devolución ID:', devolucionData.id);
  console.log('📝 Número de Nota:', devolucionData.numero_nota);
  console.log('🔄 Proceso Nuevo:', procesoNuevo);
  console.log('🔄 Proceso Anterior:', procesoAnterior || 'N/A (registro inicial)');
  
  try {
    // Solo enviar correo si el proceso cambió a uno de los estados objetivo
    const procesosParaNotificar = ['almacen', 'credito', 'representante'];
    
    if (!procesosParaNotificar.includes(procesoNuevo)) {
      console.log('⏭️ [EMAILJS] No se requiere notificación para proceso:', procesoNuevo);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: true, skipped: true };
    }

    console.log('🔍 [EMAILJS] Buscando destinatarios para proceso:', procesoNuevo);
    
    // Obtener emails de destinatarios según el proceso
    const emailsDestinatarios = await obtenerEmailsPorProceso(procesoNuevo);
    
    console.log('👥 [EMAILJS] Destinatarios encontrados:', emailsDestinatarios);
    console.log('📊 [EMAILJS] Total destinatarios:', emailsDestinatarios?.length || 0);
    
    if (!emailsDestinatarios || emailsDestinatarios.length === 0) {
      console.warn('⚠️ [EMAILJS] No se encontraron destinatarios para el proceso:', procesoNuevo);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: true, skipped: true, reason: 'No hay destinatarios' };
    }

    // Mapear nombres de procesos
    const nombresProceso = {
      'almacen': 'Almacén',
      'credito': 'Crédito y Cobranza',
      'representante': 'Representante/Administración'
    };

    const nombreProceso = nombresProceso[procesoNuevo] || procesoNuevo;

    // Preparar datos para EmailJS - Un solo correo con múltiples destinatarios
    // EmailJS permite múltiples destinatarios separados por comas en to_email
    const todosLosEmails = emailsDestinatarios.join(', '); // Unir todos los emails con comas
    
    const emailData = {
      to_email: todosLosEmails, // Todos los destinatarios en un solo campo
      numero_nota: devolucionData.numero_nota || devolucionData.id,
      cliente: devolucionData.cliente,
      empresa: devolucionData.empresa,
      motivo: devolucionData.motivo_devolucion_general,
      proceso: nombreProceso,
      fecha_devolucion: new Date(devolucionData.fecha_devolucion).toLocaleDateString('es-MX'),
      vendedor: devolucionData.vendedor_nombre || 'N/A',
      estado: devolucionData.estado_actual
    };

    console.log('📤 [EMAILJS] Configuración:');
    console.log('   Service ID:', EMAILJS_SERVICE_ID);
    console.log('   Template ID:', EMAILJS_TEMPLATE_ID);
    console.log('   Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('   Public Key (verificación):', EMAILJS_PUBLIC_KEY.length, 'caracteres');
    console.log('📤 [EMAILJS] Datos del correo:', emailData);
    console.log('👥 [EMAILJS] Destinatarios (todos en un correo):', todosLosEmails);
    console.log('📊 [EMAILJS] Total destinatarios:', emailsDestinatarios.length);

    // Enviar UN SOLO correo con todos los destinatarios
    console.log('🚀 [EMAILJS] Enviando un solo correo con múltiples destinatarios...');
    
    try {
      const resultado = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        emailData,
        EMAILJS_PUBLIC_KEY
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [EMAILJS] Correo enviado exitosamente');
      console.log('📧 [EMAILJS] Destinatarios:', emailsDestinatarios.length);
      console.log('📋 [EMAILJS] Respuesta:', resultado);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return { 
        success: true, 
        data: resultado,
        enviados: emailsDestinatarios.length,
        total: emailsDestinatarios.length,
        destinatarios: emailsDestinatarios
      };

    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [EMAILJS] Error al enviar correo:');
      console.error('📋 Detalles del error:', error);
      console.error('📋 Error completo:', JSON.stringify(error, null, 2));
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return { 
        success: false, 
        error: error.message, 
        detalles: error,
        destinatarios: emailsDestinatarios
      };
    }

  } catch (error) {
    console.error('❌ Error en enviarNotificacionEmail:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 📧 Obtener emails de usuarios según el proceso/área
 * (Misma función que antes)
 */
const obtenerEmailsPorProceso = async (proceso) => {
  try {
    const mapeoProcesoRol = {
      'almacen': 'jefe_almacen',
      'credito': 'credito_cobranza',
      'representante': 'administrador'
    };

    const rolBuscado = mapeoProcesoRol[proceso];
    
    if (!rolBuscado) {
      console.warn('⚠️ No hay mapeo para proceso:', proceso);
      return [];
    }

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select(`
        email,
        nombre_completo,
        roles (name)
      `)
      .eq('activo', true)
      .not('email', 'is', null);

    if (error) {
      console.error('❌ Error al obtener usuarios:', error);
      return [];
    }

    if (!usuarios || usuarios.length === 0) {
      console.warn('⚠️ No se encontraron usuarios activos con email');
      return [];
    }

    const emailsRolEspecifico = usuarios
      .filter(usuario => usuario.roles?.name === rolBuscado)
      .map(usuario => usuario.email)
      .filter(email => email && email.trim() !== '');

    if (emailsRolEspecifico.length > 0) {
      const emailsAdmin = usuarios
        .filter(usuario => usuario.roles?.name === 'administrador')
        .map(usuario => usuario.email)
        .filter(email => email && email.trim() !== '');
      
      const todosEmails = [...new Set([...emailsRolEspecifico, ...emailsAdmin])];
      console.log(`📧 Emails encontrados para ${proceso}:`, todosEmails);
      return todosEmails;
    }

    console.log(`⚠️ No se encontraron usuarios con rol '${rolBuscado}', usando fallback a administrador`);
    const emailsAdmin = usuarios
      .filter(usuario => usuario.roles?.name === 'administrador')
      .map(usuario => usuario.email)
      .filter(email => email && email.trim() !== '');

    if (emailsAdmin.length === 0) {
      console.warn('⚠️ No se encontraron administradores como fallback');
      return [];
    }

    console.log(`📧 Emails de administrador (fallback) para ${proceso}:`, emailsAdmin);
    return emailsAdmin;

  } catch (error) {
    console.error('❌ Error en obtenerEmailsPorProceso:', error);
    return [];
  }
};

