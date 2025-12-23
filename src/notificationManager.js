// NotificationManager per PresenzaCalcio
// Gestisce tutte le notifiche push dell'app

// ⚠️ IMPORTANTE: LIMITAZIONI NOTIFICHE LOCALI
// Le notifiche locali (senza backend) hanno queste limitazioni:
// - Vengono mostrate solo all'utente ATTUALMENTE loggato
// - Non possono essere inviate ad altri utenti in tempo reale
// - Funzionano come promemoria/alert locali
//
// Per notifiche cross-user in tempo reale servirebbe:
// - Backend con sistema push (es. Firebase Cloud Messaging)
// - WebPush API con subscription
//
// COMPORTAMENTO ATTUALE:
// - GIOCATORE loggato: riceve notifiche per eventi e promemoria
// - ALLENATORE/ADMIN loggato: riceve notifiche quando controlla l'app
//   (es. "2 nuove risposte" mostrato come badge/alert nell'UI)

// ========================================
// DESTINATARI PER RUOLO
// ========================================
// 👔 AMMINISTRATORE: Tutte le notifiche (tutte le squadre)
// 🎽 ALLENATORE: Notifiche della propria squadra
// ⚽ GIOCATORE: Solo le proprie convocazioni

// ========================================
// HELPER: Richiedi permesso notifiche
// ========================================
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[Notifications] Browser non supporta notifiche');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('[Notifications] Permesso già concesso');
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[Notifications] Permesso concesso!');
      return true;
    }
  }

  console.log('[Notifications] Permesso negato');
  return false;
}

// ========================================
// BASE: Invia notifica locale generica
// ========================================
export function sendLocalNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.log('[Notifications] Browser non supporta notifiche');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('[Notifications] Permesso non concesso');
    return;
  }

  const defaultOptions = {
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        ...defaultOptions,
        ...options,
      });
    });
  } else {
    // Fallback se service worker non disponibile
    new Notification(title, { ...defaultOptions, ...options });
  }
}

// ========================================
// 1. NOTIFICA: NUOVO EVENTO CREATO
// ========================================
export function notifyNewEvent(event, players) {
  if (Notification.permission !== 'granted') return;

  const eventTypeEmoji = {
    'Allenamento': '⚽',
    'Partita': '🏆',
    'Riunione': '📋',
  };

  const emoji = eventTypeEmoji[event.type] || '📅';
  
  // Notifica a tutti i giocatori convocati
  players.forEach((player) => {
    sendLocalNotification(
      `${emoji} Nuovo Evento: ${event.title}`,
      {
        body: `${event.type} il ${formatDate(event.date)} alle ${event.time}\n📍 ${event.location}`,
        tag: `new-event-${event.id}-${player.id}`,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [300, 100, 300],
        requireInteraction: true,
        data: {
          type: 'new-event',
          eventId: event.id,
          playerId: player.id,
        },
        actions: [
          {
            action: 'view',
            title: '👁️ Visualizza',
          },
          {
            action: 'respond',
            title: '✅ Rispondi',
          },
        ],
      }
    );
  });

  console.log(`[Notifications] Inviata notifica nuovo evento a ${players.length} giocatori`);
}

// ========================================
// 2. NOTIFICA: GIOCATORE HA RISPOSTO
// DISABILITATA - L'allenatore vede le risposte nell'interfaccia
// ========================================
/*
export function notifyPlayerResponse(player, event, response) {
  if (Notification.permission !== 'granted') return;

  const statusEmoji = {
    'presente': '✅',
    'assente': '❌',
    'forse': '❓',
  };

  const emoji = statusEmoji[response.status] || '📝';
  const statusText = response.status.charAt(0).toUpperCase() + response.status.slice(1);

  sendLocalNotification(
    `${emoji} ${player.name} ha risposto`,
    {
      body: `${statusText} per "${event.title}"\n📅 ${formatDate(event.date)} alle ${event.time}`,
      tag: `player-response-${event.id}-${player.id}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: {
        type: 'player-response',
        eventId: event.id,
        playerId: player.id,
        status: response.status,
      },
      actions: [
        {
          action: 'view-event',
          title: '👁️ Vedi Evento',
        },
      ],
    }
  );

  console.log(`[Notifications] Notifica risposta giocatore inviata: ${player.name} - ${response.status}`);
}
*/

// ========================================
// 3. NOTIFICA: PROMEMORIA EVENTO (24h prima)
// Destinatari: GIOCATORI convocati
// ========================================
export function notifyEventReminder24h(event, player) {
  if (Notification.permission !== 'granted') return;

  sendLocalNotification(
    `📅 Domani: ${event.title}`,
    {
      body: `${event.type} alle ${event.time}\n📍 ${event.location}\n\n${player.hasResponded ? '✅ Hai già risposto' : '❗ Rispondi ora!'}`,
      tag: `reminder-24h-${event.id}-${player.id}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: !player.hasResponded,
      data: {
        type: 'reminder-24h',
        eventId: event.id,
        playerId: player.id,
      },
      actions: player.hasResponded ? [
        {
          action: 'view',
          title: '👁️ Dettagli',
        },
      ] : [
        {
          action: 'respond',
          title: '✅ Rispondi Ora',
        },
      ],
    }
  );

  console.log(`[Notifications] Promemoria 24h inviato a ${player.name}`);
}

// NOTA: Notifiche 2h prima e solleciti rimossi per semplificare
// L'allenatore farà l'appello DAL VIVO durante l'evento

// ========================================
// 6. NOTIFICA: REPORT PRESENZE
// Destinatari: AMMINISTRATORE + ALLENATORE
// ========================================
export function notifyCoachPresenceReport(event, stats) {
  if (Notification.permission !== 'granted') return;

  const { total, confirmed, absent, maybe, noResponse } = stats;
  const confirmationRate = Math.round((confirmed / total) * 100);

  sendLocalNotification(
    `📊 Report Presenze: ${event.title}`,
    {
      body: `${event.type} - ${formatDate(event.date)} ${event.time}\n\n✅ Presenti: ${confirmed}\n❌ Assenti: ${absent}\n❓ Forse: ${maybe}\n⏳ Non risposto: ${noResponse}\n\n${confirmationRate}% confermati`,
      tag: `coach-report-${event.id}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: {
        type: 'coach-report',
        eventId: event.id,
        stats: stats,
      },
      actions: [
        {
          action: 'view-details',
          title: '👁️ Dettagli Completi',
        },
        {
          action: 'send-reminders',
          title: '📧 Invia Solleciti',
        },
      ],
    }
  );

  console.log(`[Notifications] Report presenze inviato all'allenatore`);
}

// ========================================
// 7. NOTIFICA: ALERT ASSENZE ECCESSIVE
// Destinatari: AMMINISTRATORE + ALLENATORE
// ========================================
export function notifyExcessiveAbsences(event, absentCount, totalPlayers) {
  if (Notification.permission !== 'granted') return;

  const absentPercentage = Math.round((absentCount / totalPlayers) * 100);

  sendLocalNotification(
    `⚠️ Alert Assenze: ${event.title}`,
    {
      body: `${absentCount} giocatori su ${totalPlayers} sono assenti (${absentPercentage}%)\n\n📅 ${event.type} - ${formatDate(event.date)} ${event.time}`,
      tag: `alert-absences-${event.id}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [400, 200, 400, 200, 400],
      requireInteraction: true,
      data: {
        type: 'alert-absences',
        eventId: event.id,
        absentCount: absentCount,
        totalPlayers: totalPlayers,
      },
      actions: [
        {
          action: 'view-event',
          title: '👁️ Vedi Dettagli',
        },
        {
          action: 'send-reminders',
          title: '📧 Sollecita Presenze',
        },
      ],
    }
  );

  console.log(`[Notifications] Alert assenze eccessive inviato`);
}

// ========================================
// SCHEDULER: Schedula notifiche evento
// SEMPLIFICATO: Solo notifica 24h prima + report allenatore
// ========================================
export function scheduleEventNotifications(event, players) {
  if (Notification.permission !== 'granted') {
    console.log('[Notifications] Permesso non concesso, impossibile schedulare');
    return;
  }

  const eventDate = new Date(event.date);
  const now = new Date();

  // Notifica 24h prima a tutti i giocatori
  const dayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  if (dayBefore > now) {
    const delay = dayBefore.getTime() - now.getTime();
    players.forEach((player) => {
      setTimeout(() => {
        notifyEventReminder24h(event, player);
      }, delay);
    });
    console.log(`[Notifications] Schedulata notifica 24h per ${players.length} giocatori`);
  }

  // Report presenze all'allenatore 24h prima
  if (dayBefore > now) {
    const delay = dayBefore.getTime() - now.getTime();
    setTimeout(() => {
      const stats = calculatePresenceStats(event, players);
      notifyCoachPresenceReport(event, stats);
      
      // Alert se troppe assenze
      if (stats.absent > stats.total * 0.3) {
        notifyExcessiveAbsences(event, stats.absent, stats.total);
      }
    }, delay);
    console.log(`[Notifications] Schedulato report presenze allenatore`);
  }
}

// ========================================
// 🆕 APPELLO DAL VIVO
// L'allenatore segna presenze REALI durante l'evento
// ========================================

// Salva appello reale (chiamato quando allenatore completa appello)
export function saveRealAttendance(eventId, attendanceData) {
  // attendanceData = { playerId: status } dove status = 'presente'|'assente'|'infortunato'
  const storageKey = `event-${eventId}-real-attendance`;
  const data = {
    eventId,
    attendanceData,
    timestamp: new Date().toISOString(),
    completedBy: 'coach', // o admin
  };
  
  localStorage.setItem(storageKey, JSON.stringify(data));
  console.log(`[Appello] Salvate presenze reali per evento ${eventId}`);
  
  return data;
}

// Recupera appello reale
export function getRealAttendance(eventId) {
  const storageKey = `event-${eventId}-real-attendance`;
  const data = localStorage.getItem(storageKey);
  
  if (data) {
    return JSON.parse(data);
  }
  
  return null;
}

// Verifica se appello è stato fatto
export function isAttendanceTaken(eventId) {
  return getRealAttendance(eventId) !== null;
}

// Notifica completamento appello
export function notifyAttendanceCompleted(event, stats) {
  if (Notification.permission !== 'granted') return;

  sendLocalNotification(
    `✅ Appello Completato: ${event.title}`,
    {
      body: `Presenze registrate!\n✅ Presenti: ${stats.present}\n❌ Assenti: ${stats.absent}\n🤕 Infortunati: ${stats.injured || 0}`,
      tag: `attendance-completed-${event.id}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: {
        type: 'attendance-completed',
        eventId: event.id,
        stats: stats,
      },
    }
  );

  console.log(`[Notifications] Notifica appello completato inviata`);
}

// Confronta presenze confermate vs presenze reali
export function compareAttendance(eventId, players) {
  const realAttendance = getRealAttendance(eventId);
  
  if (!realAttendance) {
    return null;
  }
  
  const comparison = {
    confirmed: 0,
    actualPresent: 0,
    confirmedButAbsent: [],
    notConfirmedButPresent: [],
    accuracy: 0,
  };
  
  players.forEach((player) => {
    const confirmedPresent = player.response?.status === 'presente';
    const actuallyPresent = realAttendance.attendanceData[player.id] === 'presente';
    
    if (confirmedPresent) {
      comparison.confirmed++;
    }
    
    if (actuallyPresent) {
      comparison.actualPresent++;
    }
    
    // Ha confermato ma era assente
    if (confirmedPresent && !actuallyPresent) {
      comparison.confirmedButAbsent.push(player.name);
    }
    
    // Non ha confermato ma era presente
    if (!confirmedPresent && actuallyPresent) {
      comparison.notConfirmedButPresent.push(player.name);
    }
  });
  
  // Calcola accuracy
  const correct = players.length - comparison.confirmedButAbsent.length - comparison.notConfirmedButPresent.length;
  comparison.accuracy = Math.round((correct / players.length) * 100);
  
  return comparison;
}

// ========================================
// HELPER: Calcola statistiche presenze
// ========================================
function calculatePresenceStats(event, players) {
  const stats = {
    total: players.length,
    confirmed: 0,
    absent: 0,
    maybe: 0,
    noResponse: 0,
  };

  players.forEach((player) => {
    if (!player.response) {
      stats.noResponse++;
    } else if (player.response.status === 'presente') {
      stats.confirmed++;
    } else if (player.response.status === 'assente') {
      stats.absent++;
    } else if (player.response.status === 'forse') {
      stats.maybe++;
    }
  });

  return stats;
}

// ========================================
// HELPER: Formatta data italiana
// ========================================
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('it-IT', options);
}

// ========================================
// TEST: Notifica di prova
// ========================================
export function sendTestNotification() {
  sendLocalNotification(
    '✅ Notifiche Attive!',
    {
      body: 'PresenzaCalcio è pronto a inviarti notifiche su eventi e convocazioni.',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      tag: 'test-notification',
    }
  );
}
