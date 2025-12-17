// Registrazione Service Worker per PresenzaCalcio PWA

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('[PWA] App is being served cache-first by service worker.');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[PWA] Service Worker registered:', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[PWA] New content available, refresh to update.');
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('[PWA] Content cached for offline use.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };

      // Richiedi permesso notifiche dopo registrazione
      if (config && config.onRegistered) {
        config.onRegistered(registration);
      }
    })
    .catch((error) => {
      console.error('[PWA] Error registering service worker:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[PWA] No internet connection. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// HELPER: Richiedi permesso notifiche
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[PWA] Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('[PWA] Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// HELPER: Invia notifica locale
export function sendLocalNotification(title, options = {}) {
  if (!('Notification' in window)) {
    console.log('[PWA] Browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
    };

    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        ...defaultOptions,
        ...options,
      });
    });
  }
}

// HELPER: Schedula notifica per evento
export function scheduleEventNotification(event) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const eventDate = new Date(event.date);
  const now = new Date();
  
  // Notifica 24h prima
  const dayBefore = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  if (dayBefore > now) {
    const delay = dayBefore.getTime() - now.getTime();
    setTimeout(() => {
      sendLocalNotification(`🔔 Domani: ${event.title}`, {
        body: `${event.type} alle ${event.time} - ${event.location}`,
        tag: `event-24h-${event.id}`,
        requireInteraction: true,
      });
    }, delay);
  }

  // Notifica 2h prima
  const twoHoursBefore = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);
  if (twoHoursBefore > now) {
    const delay = twoHoursBefore.getTime() - now.getTime();
    setTimeout(() => {
      sendLocalNotification(`⚡ Tra 2 ore: ${event.title}`, {
        body: `${event.type} alle ${event.time} - ${event.location}`,
        tag: `event-2h-${event.id}`,
        requireInteraction: true,
      });
    }, delay);
  }
}
