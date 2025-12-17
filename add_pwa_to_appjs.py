#!/usr/bin/env python3
"""
Script automatico per aggiungere PWA a PresenzaCalcio App.js
Uso: python3 add_pwa_to_appjs.py
"""

import sys
import os

print("🚀 PresenzaCalcio - Aggiunta PWA ad App.js")
print("=" * 60)

# Controlla che App.js esista
if not os.path.exists('src/App.js'):
    print("❌ ERRORE: File src/App.js non trovato!")
    print("   Esegui questo script dalla root del progetto React.")
    sys.exit(1)

print("✅ File src/App.js trovato")

# Leggi il file originale
with open('src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Backup del file originale
with open('src/App.js.backup', 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ Backup creato: src/App.js.backup")

# MODIFICA 1: Aggiungi import PWA dopo riga 2
pwa_imports = """
// ===== PWA IMPORTS =====
import InstallPrompt from './InstallPrompt';
import { 
  register as registerServiceWorker,
  requestNotificationPermission,
  sendLocalNotification,
  scheduleEventNotification 
} from './serviceWorkerRegistration';
"""

# Trova la posizione dopo gli import di Clerk
clerk_import = "import { SignedIn, SignedOut, SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';"
if clerk_import in content:
    content = content.replace(clerk_import, clerk_import + pwa_imports)
    print("✅ MODIFICA 1: Import PWA aggiunti")
else:
    print("⚠️  ATTENZIONE: Import Clerk non trovato, skip modifica 1")

# MODIFICA 2 & 3: Aggiungi stati PWA e useEffect nel componente App
# Cerca "const App = () => {"
app_component_start = "const App = () => {\n  const [currentScreen, setCurrentScreen] = useState('role-selection');  \n  const [currentRole, setCurrentRole] = useState('');\n  const [screenData, setScreenData] = useState(null);"

if app_component_start in content:
    pwa_states_and_effect = """

  // ===== PWA STATES =====
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  // ===== PWA SERVICE WORKER REGISTRATION =====
  useEffect(() => {
    // Controlla se già installato come app standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true;
    setPwaInstalled(isStandalone);

    // Registra Service Worker
    registerServiceWorker({
      onSuccess: (registration) => {
        console.log('✅ Service Worker registrato con successo!');
        setServiceWorkerReady(true);
      },
      onUpdate: (registration) => {
        console.log('🔄 Nuova versione disponibile! Ricarica per aggiornare.');
      },
      onRegistered: (registration) => {
        console.log('📝 Service Worker in attivazione...');
      }
    });

    // Richiedi permessi notifiche dopo 3 secondi
    const notificationTimer = setTimeout(() => {
      requestNotificationPermission()
        .then(permission => {
          setNotificationsEnabled(permission === 'granted');
          if (permission === 'granted') {
            sendLocalNotification(
              '🎉 Notifiche Attivate!',
              {
                body: 'Riceverai aggiornamenti su eventi e convocazioni',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-64x64.png'
              }
            );
          }
        })
        .catch(err => console.log('Permesso notifiche rifiutato'));
    }, 3000);

    // Listener per quando l'app viene installata
    const handleAppInstalled = () => {
      setPwaInstalled(true);
      console.log('✅ PWA installata!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(notificationTimer);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);"""
    
    content = content.replace(app_component_start, app_component_start + pwa_states_and_effect)
    print("✅ MODIFICA 2: Stati PWA aggiunti")
    print("✅ MODIFICA 3: useEffect Service Worker aggiunto")
else:
    print("⚠️  ATTENZIONE: Componente App non trovato, skip modifiche 2 e 3")

# MODIFICA 4: Aggiungi InstallPrompt nel return
# Cerca la chiusura del componente App prima dell'ultimo </>
return_end_pattern = "      {currentScreen === 'my-events' && (\n        <PlayerEvents onLogout={handleLogout} />\n      )}\n    </>\n  );\n};"

if return_end_pattern in content:
    pwa_render = """      {currentScreen === 'my-events' && (
        <PlayerEvents onLogout={handleLogout} />
      )}
      
      {/* PWA INSTALL PROMPT */}
      {!pwaInstalled && <InstallPrompt />}
    </>
  );
};"""
    content = content.replace(return_end_pattern, pwa_render)
    print("✅ MODIFICA 4: InstallPrompt aggiunto nel render")
else:
    print("⚠️  ATTENZIONE: Pattern return non trovato, skip modifica 4")

# BONUS: Aggiungi notifica quando si crea evento
create_event_pattern = """    if (eventId) {
      updateEvent(eventId, eventData);
      addNotification('Evento aggiornato con successo', 'success');
    } else {
      addEvent(eventData);
      addNotification('Evento creato con successo', 'success');
    }"""

if create_event_pattern in content:
    create_event_with_notification = """    if (eventId) {
      updateEvent(eventId, eventData);
      addNotification('Evento aggiornato con successo', 'success');
    } else {
      addEvent(eventData);
      addNotification('Evento creato con successo', 'success');
      
      // 🔔 NOTIFICA PWA: Schedula notifiche automatiche
      if (eventData.date && eventData.time) {
        scheduleEventNotification(eventData);
      }
    }"""
    content = content.replace(create_event_pattern, create_event_with_notification)
    print("✅ BONUS: Notifica creazione evento aggiunta")
else:
    print("⚠️  BONUS: Pattern creazione evento non trovato, skip")

# Salva il file modificato
with open('src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n" + "=" * 60)
print("🎉 APP.JS MODIFICATO CON SUCCESSO!")
print("=" * 60)
print("\n📋 PROSSIMI PASSI:")
print("1. Verifica che il file sia corretto: cat src/App.js")
print("2. Se tutto OK, elimina backup: rm src/App.js.backup")
print("3. Se problemi, ripristina: mv src/App.js.backup src/App.js")
print("\n✅ PWA è stata integrata con successo!")
