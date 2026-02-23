import { supabase } from '../config/supabase';

/**
 * 🚀 Función para enviar notificaciones por correo cuando cambia el proceso
 * Esta función se ejecuta de forma asíncrona y NO bloquea la actualización principal
 */
export const enviarNotificacionEmail = async (devolucionData, procesoNuevo, procesoAnterior) => {
  try {
    // Solo enviar correo si el proceso cambió a uno de los estados objetivo
    const procesosParaNotificar = ['almacen', 'credito', 'representante'];
    
    if (!procesosParaNotificar.includes(procesoNuevo)) {
      console.log('📧 No se requiere notificación para proceso:', procesoNuevo);
      return { success: true, skipped: true };
    }

    // Obtener emails de destinatarios según el proceso
    const emailsDestinatarios = await obtenerEmailsPorProceso(procesoNuevo);
    
    if (!emailsDestinatarios || emailsDestinatarios.length === 0) {
      console.warn('⚠️ No se encontraron destinatarios para el proceso:', procesoNuevo);
      return { success: true, skipped: true, reason: 'No hay destinatarios' };
    }

    // Preparar datos del correo
    const emailData = {
      to: emailsDestinatarios,
      proceso: procesoNuevo,
      procesoAnterior: procesoAnterior,
      devolucion: {
        id: devolucionData.id,
        numero_nota: devolucionData.numero_nota,
        cliente: devolucionData.cliente,
        empresa: devolucionData.empresa,
        fecha_devolucion: devolucionData.fecha_devolucion,
        motivo_devolucion_general: devolucionData.motivo_devolucion_general,
        estado_actual: devolucionData.estado_actual,
        vendedor_nombre: devolucionData.vendedor_nombre
      }
    };

    // Llamar a la Edge Function de Supabase (asíncrono, no bloquea)
    const { data, error } = await supabase.functions.invoke('enviar-email-notificacion', {
      body: emailData
    });

    if (error) {
      console.error('❌ Error al enviar correo:', error);
      // NO lanzar error, solo loguear - no queremos que falle la actualización
      return { success: false, error: error.message };
    }

    console.log('✅ Notificación de correo enviada exitosamente');
    return { success: true, data };

  } catch (error) {
    // Capturar cualquier error y solo loguearlo
    console.error('❌ Error en enviarNotificacionEmail:', error);
    // NO lanzar el error para no afectar la actualización principal
    return { success: false, error: error.message };
  }
};

/**
 * 📧 Obtener emails de usuarios según el proceso/área
 * 
 * Lógica:
 * - almacen → jefe_almacen (si no hay, fallback a administrador)
 * - credito → credito_cobranza (si no hay, fallback a administrador)
 * - representante → administrador
 */
const obtenerEmailsPorProceso = async (proceso) => {
  try {
    // Mapeo de procesos a roles
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

    // Obtener todos los usuarios activos con email
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

    // Filtrar usuarios por el rol específico
    const emailsRolEspecifico = usuarios
      .filter(usuario => usuario.roles?.name === rolBuscado)
      .map(usuario => usuario.email)
      .filter(email => email && email.trim() !== '');

    // Si hay usuarios del rol específico, retornarlos (incluyendo admins si también tienen ese rol)
    if (emailsRolEspecifico.length > 0) {
      // También incluir administradores si no están ya incluidos
      const emailsAdmin = usuarios
        .filter(usuario => usuario.roles?.name === 'administrador')
        .map(usuario => usuario.email)
        .filter(email => email && email.trim() !== '');
      
      // Combinar y eliminar duplicados
      const todosEmails = [...new Set([...emailsRolEspecifico, ...emailsAdmin])];
      console.log(`📧 Emails encontrados para ${proceso} (rol: ${rolBuscado}):`, todosEmails);
      return todosEmails;
    }

    // Si no hay usuarios del rol específico, usar fallback a administrador
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

