import React, { useState, useEffect } from 'react';

// ===== COOKIE BANNER COMPONENT =====
// Banner consenso cookie conforme GDPR
const CookieBanner = () => {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      technical: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setShow(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      technical: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setShow(false);
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  if (!show) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '24px',
      zIndex: 10000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.3s ease-out',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      margin: 0,
    },
    text: {
      fontSize: '14px',
      lineHeight: '1.6',
      marginBottom: '20px',
      opacity: 0.9,
    },
    link: {
      color: '#64b5f6',
      textDecoration: 'underline',
      cursor: 'pointer',
    },
    buttonsContainer: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    acceptButton: {
      backgroundColor: '#43a047',
      color: 'white',
    },
    rejectButton: {
      backgroundColor: 'transparent',
      color: 'white',
      border: '2px solid white',
    },
    customizeButton: {
      backgroundColor: 'transparent',
      color: 'white',
      border: '2px solid #64b5f6',
    },
    detailsBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px',
      marginBottom: '20px',
    },
    cookieType: {
      marginBottom: '16px',
      paddingBottom: '16px',
      borderBottom: '1px solid rgba(255,255,255,0.2)',
    },
    cookieTitle: {
      fontSize: '16px',
      fontWeight: '700',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cookieDescription: {
      fontSize: '13px',
      opacity: 0.8,
      marginBottom: '8px',
    },
    required: {
      fontSize: '12px',
      color: '#ffa726',
      fontWeight: '600',
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={styles.header}>
            <span style={{ fontSize: '28px' }}>🍪</span>
            <h3 style={styles.title}>Utilizzo dei Cookie</h3>
          </div>

          <p style={styles.text}>
            Questo sito utilizza <strong>cookie tecnici</strong> necessari per il funzionamento 
            dell'applicazione (mantenimento sessione di login, preferenze). 
            Non utilizziamo cookie di profilazione o pubblicitari.
            {' '}
            <span 
              style={styles.link} 
              onClick={() => window.open('/cookie-policy', '_blank')}
            >
              Leggi la Cookie Policy
            </span>
            {' o '}
            <span 
              style={styles.link} 
              onClick={() => window.open('/privacy', '_blank')}
            >
              Informativa Privacy
            </span>
          </p>

          {showDetails && (
            <div style={styles.detailsBox}>
              <div style={styles.cookieType}>
                <div style={styles.cookieTitle}>
                  🔧 Cookie Tecnici (Necessari)
                  <span style={styles.required}>SEMPRE ATTIVI</span>
                </div>
                <div style={styles.cookieDescription}>
                  Essenziali per il funzionamento dell'app. Consentono il login, 
                  salvano le tue preferenze e garantiscono la sicurezza. 
                  Non possono essere disabilitati.
                </div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  Esempi: clerk_session, clerk_client_token
                </div>
              </div>

              <div style={styles.cookieType}>
                <div style={styles.cookieTitle}>
                  📊 Cookie Analitici
                  <span style={{ fontSize: '12px', color: '#66bb6a' }}>NON UTILIZZATI</span>
                </div>
                <div style={styles.cookieDescription}>
                  Attualmente NON utilizziamo cookie di analytics o statistiche.
                </div>
              </div>

              <div style={styles.cookieType}>
                <div style={styles.cookieTitle}>
                  🎯 Cookie Marketing/Pubblicitari
                  <span style={{ fontSize: '12px', color: '#66bb6a' }}>NON UTILIZZATI</span>
                </div>
                <div style={styles.cookieDescription}>
                  NON utilizziamo cookie pubblicitari o di profilazione.
                </div>
              </div>

              <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '12px' }}>
                <strong>Durata:</strong> I cookie tecnici rimangono attivi per la durata della sessione 
                o fino a 30 giorni (per il mantenimento del login).
              </div>
            </div>
          )}

          <div style={styles.buttonsContainer}>
            <button
              style={{...styles.button, ...styles.acceptButton}}
              onClick={handleAcceptAll}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#388e3c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#43a047'}
            >
              ✓ Accetta Cookie Tecnici
            </button>

            <button
              style={{...styles.button, ...styles.customizeButton}}
              onClick={handleCustomize}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(100, 181, 246, 0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {showDetails ? '↑ Nascondi Dettagli' : '⚙️ Dettagli Cookie'}
            </button>

            <button
              style={{...styles.button, ...styles.rejectButton}}
              onClick={handleRejectAll}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Continua Solo con Cookie Necessari
            </button>
          </div>

          <div style={{ 
            fontSize: '12px', 
            opacity: 0.7, 
            marginTop: '16px',
            textAlign: 'center',
          }}>
            Cliccando su "Accetta" o continuando la navigazione, acconsenti all'uso dei cookie tecnici necessari.
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieBanner;
