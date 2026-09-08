// Versión SIMPLIFICADA usando EmailJS - Sale desde tu Gmail
// MUCHO MÁS SIMPLE que Supabase Edge Functions

import emailjs from '@emailjs/browser';
import { supabase } from '../config/supabase';
import useAuthStore from '../stores/authStore';

// ⚙️ CONFIGURACIÓN - EmailJS
const EMAILJS_SERVICE_ID = 'service_vosp5tq'; // ✅ Ya configurado
const EMAILJS_TEMPLATE_ID = 'template_6ymm82t'; // ✅ Ya configurado
const EMAILJS_PUBLIC_KEY = 'NPuNEema_2b9GzByp'; // ✅ Public Key configurado (probando este)

// O usar variables de entorno (recomendado):
// const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
// const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
// const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// EmailJS devuelve el detalle del fallo en .text, no en .message
const describirError = (error) => error?.text || error?.message || String(error);

/**
 * 📝 Registrar el envío en la bitácora
 * Nunca interrumpe el envío: si la tabla no existe, solo avisa en consola.
 */
const registrarEnvio = async ({ devolucion, proceso, destinatarios, origen, exito, error, payload, reenvio = false }) => {
  try {
    const usuario = useAuthStore.getState().user;

    const { error: errorInsert } = await supabase
      .from('notificaciones_log')
      .insert([{
        devolucion_id: devolucion?.id ?? null,
        numero_nota: devolucion?.numero_nota ? String(devolucion.numero_nota) : null,
        proceso: proceso ?? null,
        destinatarios: destinatarios?.join(', ') || null,
        total_destinatarios: destinatarios?.length || 0,
        origen: origen ?? null,
        exito,
        error: error || null,
        usuario: usuario?.username || usuario?.nombre_completo || null,
        reenvio,
        payload: payload ?? null
      }]);

    if (errorInsert) throw errorInsert;
  } catch (e) {
    console.warn('⚠️ No se pudo registrar el envío en la bitácora:', e.message);
  }
};

/**
 * 🔁 Reenviar un correo desde el historial, con los mismos datos del envío original
 */
export const reenviarNotificacion = async (log) => {
  if (!log?.payload) {
    return { success: false, error: 'Este registro no tiene datos para reenviar' };
  }

  const destinatarios = (log.payload.to_email || '')
    .split(',')
    .map(email => email.trim())
    .filter(Boolean);

  const devolucion = { id: log.devolucion_id, numero_nota: log.numero_nota };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, log.payload, EMAILJS_PUBLIC_KEY);

    await registrarEnvio({
      devolucion,
      proceso: log.proceso,
      destinatarios,
      origen: log.origen,
      exito: true,
      payload: log.payload,
      reenvio: true
    });

    return { success: true, destinatarios };
  } catch (error) {
    const mensaje = describirError(error);
    console.error('❌ [EMAILJS] Error al reenviar correo:', error);

    await registrarEnvio({
      devolucion,
      proceso: log.proceso,
      destinatarios,
      origen: log.origen,
      exito: false,
      error: mensaje,
      payload: log.payload,
      reenvio: true
    });

    return { success: false, error: mensaje };
  }
};

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
    const { emails: emailsDestinatarios, origen } = await obtenerEmailsPorProceso(procesoNuevo);
    
    console.log('👥 [EMAILJS] Destinatarios encontrados:', emailsDestinatarios);
    console.log('📊 [EMAILJS] Total destinatarios:', emailsDestinatarios?.length || 0);
    
    if (!emailsDestinatarios || emailsDestinatarios.length === 0) {
      console.warn('⚠️ [EMAILJS] No se encontraron destinatarios para el proceso:', procesoNuevo);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      await registrarEnvio({
        devolucion: devolucionData,
        proceso: procesoNuevo,
        destinatarios: [],
        origen,
        exito: false,
        error: 'No hay destinatarios configurados para este proceso'
      });

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

      await registrarEnvio({
        devolucion: devolucionData,
        proceso: procesoNuevo,
        destinatarios: emailsDestinatarios,
        origen,
        exito: true,
        payload: emailData
      });

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

      await registrarEnvio({
        devolucion: devolucionData,
        proceso: procesoNuevo,
        destinatarios: emailsDestinatarios,
        origen,
        exito: false,
        error: describirError(error),
        payload: emailData
      });

      return { 
        success: false, 
        error: describirError(error), 
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
 * 📧 Destinatarios configurados desde el panel de Notificaciones
 * Devuelve [] si la tabla no existe o el proceso no tiene nadie activo,
 * para que el envío caiga en el respaldo por rol.
 */
const obtenerEmailsConfigurados = async (proceso) => {
  const { data, error } = await supabase
    .from('notificaciones_destinatarios')
    .select('email')
    .eq('proceso', proceso)
    .eq('activo', true);

  if (error) {
    console.warn('⚠️ No se pudieron leer los destinatarios configurados:', error.message);
    return [];
  }

  return [...new Set((data || []).map(d => d.email?.trim()).filter(Boolean))];
};

/**
 * 📧 Obtener emails de destinatarios según el proceso/área
 * 1. Los configurados en el panel de Notificaciones
 * 2. Si no hay ninguno, los usuarios del sistema con el rol correspondiente
 */
const obtenerEmailsPorProceso = async (proceso) => {
  try {
    const emailsConfigurados = await obtenerEmailsConfigurados(proceso);

    if (emailsConfigurados.length > 0) {
      console.log(`📧 Destinatarios configurados para ${proceso}:`, emailsConfigurados);
      return { emails: emailsConfigurados, origen: 'panel' };
    }

    console.log(`ℹ️ Sin destinatarios configurados para ${proceso}, se notifica por rol`);

    const mapeoProcesoRol = {
      'almacen': 'jefe_almacen',
      'credito': 'credito_cobranza',
      'representante': 'administrador'
    };

    const rolBuscado = mapeoProcesoRol[proceso];
    
    if (!rolBuscado) {
      console.warn('⚠️ No hay mapeo para proceso:', proceso);
      return { emails: [], origen: 'rol' };
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
      return { emails: [], origen: 'rol' };
    }

    if (!usuarios || usuarios.length === 0) {
      console.warn('⚠️ No se encontraron usuarios activos con email');
      return { emails: [], origen: 'rol' };
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
      return { emails: todosEmails, origen: 'rol' };
    }

    console.log(`⚠️ No se encontraron usuarios con rol '${rolBuscado}', usando fallback a administrador`);
    const emailsAdmin = usuarios
      .filter(usuario => usuario.roles?.name === 'administrador')
      .map(usuario => usuario.email)
      .filter(email => email && email.trim() !== '');

    if (emailsAdmin.length === 0) {
      console.warn('⚠️ No se encontraron administradores como fallback');
      return { emails: [], origen: 'rol' };
    }

    console.log(`📧 Emails de administrador (fallback) para ${proceso}:`, emailsAdmin);
    return { emails: emailsAdmin, origen: 'rol' };

  } catch (error) {
    console.error('❌ Error en obtenerEmailsPorProceso:', error);
    return { emails: [], origen: 'rol' };
  }
};

