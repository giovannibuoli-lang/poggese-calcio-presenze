import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Controlla se già installato
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Controlla se già mostrato (max 1 volta ogni 7 giorni)
    const lastPromptDate = localStorage.getItem('pwa-prompt-date');
    if (lastPromptDate) {
      const daysSinceLastPrompt = (Date.now() - parseInt(lastPromptDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < 7) {
        return;
      }
    }

    // Listener per evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostra prompt dopo 3 secondi
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener per quando viene installata
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully!');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback per iOS o browser che non supportano beforeinstallprompt
      setShowPrompt(false);
      alert('Per installare su iOS: tocca il pulsante Condividi e seleziona "Aggiungi a Home"');
      return;
    }

    // Mostra prompt nativo
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User choice: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted installation');
    } else {
      console.log('[PWA] User dismissed installation');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
    
    // Salva data per non mostrare di nuovo subito
    localStorage.setItem('pwa-prompt-date', Date.now().toString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-date', Date.now().toString());
  };

  // Non mostrare se già installato o nascosto
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      maxWidth: '500px',
      width: 'calc(100% - 40px)',
      animation: 'slideUp 0.5s ease-out',
    }}>
      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateX(-50%) translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      
      <div style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        border: '2px solid #d4af37',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 10px 40px rgba(212, 175, 55, 0.3)',
        position: 'relative',
      }}>
        {/* Pulsante chiudi */}
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = '#fff'}
          onMouseLeave={(e) => e.target.style.color = '#888'}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          {/* Icona */}
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #d4af37 0%, #ffd700 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)',
          }}>
            <Smartphone size={32} color="#0a0a0a" strokeWidth={2.5} />
          </div>

          {/* Contenuto */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: '700',
              color: '#fff',
              letterSpacing: '-0.5px',
            }}>
              Installa PresenzaCalcio
            </h3>
            
            <p style={{
              margin: '0 0 15px 0',
              fontSize: '14px',
              color: '#ccc',
              lineHeight: '1.5',
            }}>
              Accesso rapido dalla tua home. Funziona offline. Notifiche automatiche.
            </p>

            {/* Pulsanti */}
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={handleInstallClick}
                style={{
                  flex: '1',
                  minWidth: '120px',
                  background: 'linear-gradient(135deg, #d4af37 0%, #ffd700 100%)',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
                }}
              >
                <Download size={18} strokeWidth={2.5} />
                Installa App
              </button>

              <button
                onClick={handleDismiss}
                style={{
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#555';
                  e.target.style.color = '#aaa';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#333';
                  e.target.style.color = '#888';
                }}
              >
                Dopo
              </button>
            </div>
          </div>
        </div>

        {/* Benefits badges */}
        <div style={{
          marginTop: '15px',
          paddingTop: '15px',
          borderTop: '1px solid #333',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {[
            { icon: '⚡', text: 'Caricamento istantaneo' },
            { icon: '📱', text: 'Funziona offline' },
            { icon: '🔔', text: 'Notifiche push' },
          ].map((benefit, index) => (
            <div
              key={index}
              style={{
                fontSize: '11px',
                color: '#999',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{benefit.icon}</span>
              <span>{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
