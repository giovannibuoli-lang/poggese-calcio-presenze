import React from 'react';

// ===== COOKIE POLICY COMPONENT =====
// Cookie Policy completa conforme GDPR
// S.S.D. POGGESE ACADEMY a R.L.
const CookiePolicy = ({ onBack }) => {
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '40px',
      maxWidth: '900px',
      margin: '0 auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    header: {
      background: 'linear-gradient(135deg, #ff6f00 0%, #e65100 100%)',
      color: 'white',
      padding: '40px 20px',
      textAlign: 'center',
      marginBottom: '40px',
      borderRadius: '12px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      marginBottom: '10px',
    },
    subtitle: {
      fontSize: '16px',
      opacity: 0.9,
    },
    section: {
      marginBottom: '30px',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#ff6f00',
      marginBottom: '15px',
      borderBottom: '2px solid #ff6f00',
      paddingBottom: '8px',
    },
    paragraph: {
      fontSize: '15px',
      lineHeight: '1.8',
      color: '#333',
      marginBottom: '15px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '20px',
    },
    th: {
      backgroundColor: '#fff3e0',
      padding: '12px',
      textAlign: 'left',
      fontWeight: '700',
      borderBottom: '2px solid #ff6f00',
      fontSize: '14px',
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e0e0e0',
      fontSize: '14px',
    },
    backButton: {
      backgroundColor: '#ff6f00',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '20px',
    },
    updated: {
      fontSize: '14px',
      color: '#666',
      fontStyle: 'italic',
      marginBottom: '20px',
      textAlign: 'right',
    },
    list: {
      marginLeft: '20px',
      marginBottom: '15px',
    },
    listItem: {
      fontSize: '15px',
      lineHeight: '1.8',
      color: '#333',
      marginBottom: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backButton} onClick={onBack}>
          ← Indietro
        </button>

        <div style={styles.header}>
          <h1 style={styles.title}>🍪 Cookie Policy</h1>
          <p style={styles.subtitle}>Informativa sull'uso dei Cookie</p>
        </div>

        <div style={styles.updated}>
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
        </div>

        {/* Sezione 1 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Cosa sono i Cookie?</h2>
          <p style={styles.paragraph}>
            I <strong>cookie</strong> sono piccoli file di testo che vengono memorizzati 
            sul tuo dispositivo (computer, tablet, smartphone) quando visiti un sito web.
          </p>
          <p style={styles.paragraph}>
            I cookie permettono al sito di:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Ricordarti quando torni (es. mantenere il login attivo)</li>
            <li style={styles.listItem}>Salvare le tue preferenze</li>
            <li style={styles.listItem}>Migliorare la tua esperienza di navigazione</li>
            <li style={styles.listItem}>Garantire la sicurezza del sito</li>
          </ul>
        </div>

        {/* Sezione 2 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Tipologie di Cookie</h2>
          <p style={styles.paragraph}>Esistono diverse tipologie di cookie:</p>
          
          <h3 style={{fontSize: '16px', fontWeight: '700', marginTop: '20px', marginBottom: '10px'}}>
            A) Cookie Tecnici (Necessari)
          </h3>
          <p style={styles.paragraph}>
            Sono <strong>essenziali</strong> per il funzionamento del sito. 
            Senza questi cookie, alcune funzionalità non potrebbero essere fornite.
          </p>
          <p style={styles.paragraph}>
            <strong>Non richiedono consenso</strong> ai sensi del GDPR e delle Linee Guida 
            del Garante Privacy italiano.
          </p>

          <h3 style={{fontSize: '16px', fontWeight: '700', marginTop: '20px', marginBottom: '10px'}}>
            B) Cookie Analitici/Statistici
          </h3>
          <p style={styles.paragraph}>
            Raccolgono informazioni su come gli utenti utilizzano il sito 
            (pagine visitate, tempo di permanenza, ecc.) in forma aggregata e anonima.
          </p>
          <p style={styles.paragraph}>
            <strong>PresenzaCalcio NON utilizza cookie analitici.</strong>
          </p>

          <h3 style={{fontSize: '16px', fontWeight: '700', marginTop: '20px', marginBottom: '10px'}}>
            C) Cookie di Profilazione/Marketing
          </h3>
          <p style={styles.paragraph}>
            Tracciano le tue abitudini di navigazione per mostrarti pubblicità personalizzata.
          </p>
          <p style={styles.paragraph}>
            <strong>PresenzaCalcio NON utilizza cookie di profilazione o marketing.</strong>
          </p>
        </div>

        {/* Sezione 3 - Tabella Cookie */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Cookie Utilizzati da PresenzaCalcio</h2>
          <p style={styles.paragraph}>
            Questa applicazione utilizza <strong>SOLO cookie tecnici necessari</strong> 
            per il funzionamento del servizio di autenticazione e gestione sessioni.
          </p>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome Cookie</th>
                <th style={styles.th}>Tipologia</th>
                <th style={styles.th}>Finalità</th>
                <th style={styles.th}>Durata</th>
                <th style={styles.th}>Terze Parti</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>__clerk_db_jwt</td>
                <td style={styles.td}>Tecnico</td>
                <td style={styles.td}>Token autenticazione utente</td>
                <td style={styles.td}>Sessione</td>
                <td style={styles.td}>Clerk (USA)</td>
              </tr>
              <tr>
                <td style={styles.td}>__session</td>
                <td style={styles.td}>Tecnico</td>
                <td style={styles.td}>Mantenimento sessione login</td>
                <td style={styles.td}>30 giorni</td>
                <td style={styles.td}>Clerk (USA)</td>
              </tr>
              <tr>
                <td style={styles.td}>__client</td>
                <td style={styles.td}>Tecnico</td>
                <td style={styles.td}>Identificativo client</td>
                <td style={styles.td}>1 anno</td>
                <td style={styles.td}>Clerk (USA)</td>
              </tr>
              <tr>
                <td style={styles.td}>cookieConsent</td>
                <td style={styles.td}>Tecnico</td>
                <td style={styles.td}>Memorizza preferenze cookie</td>
                <td style={styles.td}>1 anno</td>
                <td style={styles.td}>PresenzaCalcio</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sezione 4 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Cookie di Terze Parti</h2>
          <p style={styles.paragraph}>
            Utilizziamo <strong>Clerk Inc.</strong> come fornitore del servizio di autenticazione.
          </p>
          
          <h3 style={{fontSize: '16px', fontWeight: '700', marginTop: '20px', marginBottom: '10px'}}>
            Clerk Inc. (USA)
          </h3>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Finalità:</strong> Gestione autenticazione e sicurezza account
            </li>
            <li style={styles.listItem}>
              <strong>Cookie:</strong> __clerk_db_jwt, __session, __client
            </li>
            <li style={styles.listItem}>
              <strong>Privacy Policy:</strong> <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">https://clerk.com/privacy</a>
            </li>
            <li style={styles.listItem}>
              <strong>Base legale trasferimento USA:</strong> Standard Contractual Clauses (SCC)
            </li>
          </ul>
        </div>

        {/* Sezione 5 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Gestione dei Cookie</h2>
          <p style={styles.paragraph}>
            Puoi gestire o disabilitare i cookie attraverso le impostazioni del tuo browser.
          </p>

          <h3 style={{fontSize: '16px', fontWeight: '700', marginTop: '20px', marginBottom: '10px'}}>
            Come disabilitare i cookie nel browser:
          </h3>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Chrome:</strong> Impostazioni → Privacy e sicurezza → Cookie
            </li>
            <li style={styles.listItem}>
              <strong>Firefox:</strong> Opzioni → Privacy e sicurezza → Cookie e dati dei siti
            </li>
            <li style={styles.listItem}>
              <strong>Safari:</strong> Preferenze → Privacy → Gestisci dati siti web
            </li>
            <li style={styles.listItem}>
              <strong>Edge:</strong> Impostazioni → Privacy, ricerca e servizi → Cookie
            </li>
          </ul>

          <p style={{...styles.paragraph, backgroundColor: '#fff3e0', padding: '12px', borderRadius: '8px', marginTop: '16px'}}>
            ⚠️ <strong>Attenzione:</strong> Disabilitando i cookie tecnici, alcune funzionalità 
            dell'applicazione potrebbero non funzionare correttamente (es. non potrai effettuare il login).
          </p>
        </div>

        {/* Sezione 6 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Consenso</h2>
          <p style={styles.paragraph}>
            I cookie <strong>tecnici necessari</strong> non richiedono il tuo consenso 
            ai sensi delle Linee Guida del Garante Privacy (Provvedimento 229/2014).
          </p>
          <p style={styles.paragraph}>
            Tuttavia, ti informiamo del loro utilizzo tramite il banner cookie 
            che appare al primo accesso.
          </p>
        </div>

        {/* Sezione 7 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Durata dei Cookie</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Cookie di sessione:</strong> Vengono cancellati automaticamente quando chiudi il browser
            </li>
            <li style={styles.listItem}>
              <strong>Cookie persistenti:</strong> Rimangono sul tuo dispositivo fino alla scadenza 
              (massimo 1 anno) o fino a quando li elimini manualmente
            </li>
          </ul>
        </div>

        {/* Sezione 8 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Aggiornamenti</h2>
          <p style={styles.paragraph}>
            Questa Cookie Policy può essere aggiornata periodicamente. 
            Ti consigliamo di consultarla regolarmente.
          </p>
          <p style={styles.paragraph}>
            La data di "Ultimo aggiornamento" in cima alla pagina indica quando 
            sono state apportate le ultime modifiche.
          </p>
        </div>

        {/* Sezione 9 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Base Normativa</h2>
          <p style={styles.paragraph}>
            Questa Cookie Policy è redatta in conformità a:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Regolamento UE 2016/679 (GDPR)
            </li>
            <li style={styles.listItem}>
              Decreto Legislativo 196/2003 (Codice Privacy italiano)
            </li>
            <li style={styles.listItem}>
              Provvedimento Garante Privacy n. 229/2014 sui cookie
            </li>
            <li style={styles.listItem}>
              Linee Guida EDPB 5/2020 sul consenso
            </li>
          </ul>
        </div>

        {/* Contatti */}
        <div style={{
          backgroundColor: '#fff3e0',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '40px',
        }}>
          <h3 style={{ color: '#ff6f00', marginBottom: '10px' }}>
            📧 Domande sui Cookie?
          </h3>
          <p style={styles.paragraph}>
            Contatta il Titolare del Trattamento:<br/>
            <strong>S.S.D. POGGESE ACADEMY a R.L.</strong><br/>
            Email: <strong>amministrazionepoggeseacademy@gmail.com</strong>
          </p>
        </div>

        <button 
          style={{...styles.backButton, marginTop: '30px'}} 
          onClick={onBack}
        >
          ← Torna all'App
        </button>
      </div>
    </div>
  );
};

export default CookiePolicy;
