import React from 'react';

// ===== TERMS OF SERVICE COMPONENT =====
// Termini e Condizioni d'uso - PresenzaCalcio
// S.S.D. POGGESE ACADEMY a R.L.
const TermsOfService = ({ onBack }) => {
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
      background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
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
      color: '#43a047',
      marginBottom: '15px',
      borderBottom: '2px solid #43a047',
      paddingBottom: '8px',
    },
    paragraph: {
      fontSize: '15px',
      lineHeight: '1.8',
      color: '#333',
      marginBottom: '15px',
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
    backButton: {
      backgroundColor: '#43a047',
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
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backButton} onClick={onBack}>
          ← Indietro
        </button>

        <div style={styles.header}>
          <h1 style={styles.title}>📜 Termini e Condizioni d'Uso</h1>
          <p style={styles.subtitle}>PresenzaCalcio - Sistema di Gestione Presenze Sportive</p>
        </div>

        <div style={styles.updated}>
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
        </div>

        {/* Sezione 1 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Accettazione dei Termini</h2>
          <p style={styles.paragraph}>
            Utilizzando l'applicazione <strong>PresenzaCalcio</strong> ("l'App"), 
            accetti di essere vincolato da questi Termini e Condizioni d'Uso ("i Termini").
          </p>
          <p style={styles.paragraph}>
            Se non accetti questi Termini, non sei autorizzato ad utilizzare l'App.
          </p>
        </div>

        {/* Sezione 2 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Definizioni</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>"App"</strong> - L'applicazione web PresenzaCalcio
            </li>
            <li style={styles.listItem}>
              <strong>"Associazione"</strong> - S.S.D. POGGESE ACADEMY a R.L., 
              titolare della licenza d'uso dell'App
            </li>
            <li style={styles.listItem}>
              <strong>"Fornitore"</strong> - Giovanni Buoli, 
              sviluppatore e fornitore tecnico dell'App
            </li>
            <li style={styles.listItem}>
              <strong>"Utente"</strong> - Qualsiasi persona che utilizza l'App 
              (amministratore, allenatore, giocatore)
            </li>
          </ul>
        </div>

        {/* Sezione 3 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Licenza d'Uso</h2>
          <p style={styles.paragraph}>
            L'App è concessa in licenza esclusiva all'Associazione per:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Gestione delle convocazioni sportive dei propri tesserati
            </li>
            <li style={styles.listItem}>
              Organizzazione di allenamenti, partite e riunioni
            </li>
            <li style={styles.listItem}>
              Monitoraggio presenze e statistiche
            </li>
          </ul>
          <p style={styles.paragraph}>
            <strong>È vietato:</strong>
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Cedere, vendere o trasferire la licenza a terzi
            </li>
            <li style={styles.listItem}>
              Modificare, decompilare o fare reverse engineering dell'App
            </li>
            <li style={styles.listItem}>
              Utilizzare l'App per scopi diversi da quelli sportivi/organizzativi
            </li>
            <li style={styles.listItem}>
              Rimuovere copyright, marchi o altri avvisi di proprietà
            </li>
          </ul>
        </div>

        {/* Sezione 4 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Registrazione e Account</h2>
          <p style={styles.paragraph}>
            Per utilizzare l'App è necessario:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Essere tesserati presso l'Associazione o avere autorizzazione
            </li>
            <li style={styles.listItem}>
              Fornire informazioni accurate e veritiere
            </li>
            <li style={styles.listItem}>
              Mantenere riservate le credenziali di accesso
            </li>
            <li style={styles.listItem}>
              Avere almeno 18 anni o consenso genitoriale se minore
            </li>
          </ul>
          <p style={styles.paragraph}>
            Sei responsabile di tutte le attività effettuate con il tuo account.
          </p>
        </div>

        {/* Sezione 5 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Ruoli e Permessi</h2>
          <p style={styles.paragraph}>
            L'App prevede tre ruoli con diversi livelli di accesso:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Amministratore</strong> - Gestione completa: squadre, giocatori, 
              eventi, presenze
            </li>
            <li style={styles.listItem}>
              <strong>Allenatore</strong> - Gestione convocazioni e presenze della propria squadra
            </li>
            <li style={styles.listItem}>
              <strong>Giocatore</strong> - Visualizzazione convocazioni e conferma presenza
            </li>
          </ul>
        </div>

        {/* Sezione 6 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Utilizzo Accettabile</h2>
          <p style={styles.paragraph}>
            Ti impegni a NON:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Utilizzare l'App per attività illegali o non autorizzate
            </li>
            <li style={styles.listItem}>
              Tentare di accedere ad account o dati di altri utenti
            </li>
            <li style={styles.listItem}>
              Caricare contenuti offensivi, diffamatori o inappropriati
            </li>
            <li style={styles.listItem}>
              Interferire con il funzionamento dell'App (hacking, attacchi DDoS, ecc.)
            </li>
            <li style={styles.listItem}>
              Utilizzare bot, script o strumenti automatizzati non autorizzati
            </li>
            <li style={styles.listItem}>
              Violare diritti di proprietà intellettuale
            </li>
          </ul>
        </div>

        {/* Sezione 7 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Proprietà Intellettuale</h2>
          <p style={styles.paragraph}>
            L'App, inclusi codice sorgente, design, logo, marchi e contenuti, 
            sono di proprietà esclusiva del Fornitore e protetti da:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Legge sul diritto d'autore (Legge 633/1941)
            </li>
            <li style={styles.listItem}>
              Codice della Proprietà Industriale (D.Lgs. 30/2005)
            </li>
            <li style={styles.listItem}>
              Normativa UE e internazionale
            </li>
          </ul>
          <p style={styles.paragraph}>
            La licenza d'uso NON trasferisce la proprietà dell'App.
          </p>
        </div>

        {/* Sezione 8 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Dati e Privacy</h2>
          <p style={styles.paragraph}>
            Il trattamento dei dati personali è regolato dalla nostra 
            <strong> Informativa Privacy</strong>, conforme al GDPR.
          </p>
          <p style={styles.paragraph}>
            <strong>Titolare del Trattamento:</strong> S.S.D. POGGESE ACADEMY a R.L.<br/>
            <strong>Responsabile del Trattamento:</strong> Giovanni Buoli
          </p>
          <p style={styles.paragraph}>
            I dati rimangono di proprietà dell'Associazione. In caso di cessazione 
            del servizio, l'Associazione può richiedere l'esportazione completa dei dati.
          </p>
        </div>

        {/* Sezione 9 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Disponibilità del Servizio</h2>
          <p style={styles.paragraph}>
            Il Fornitore si impegna a garantire:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Uptime del 99%</strong> (escluse manutenzioni programmate)
            </li>
            <li style={styles.listItem}>
              <strong>Backup giornalieri</strong> automatici dei dati
            </li>
            <li style={styles.listItem}>
              <strong>Manutenzioni</strong> con preavviso di almeno 24h quando possibile
            </li>
          </ul>
          <p style={styles.paragraph}>
            <strong>Esclusioni:</strong> Il Fornitore NON è responsabile per interruzioni 
            causate da: eventi di forza maggiore, attacchi esterni, problemi di rete 
            dell'utente, aggiornamenti di sicurezza urgenti.
          </p>
        </div>

        {/* Sezione 10 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Limitazione di Responsabilità</h2>
          <p style={styles.paragraph}>
            L'App è fornita <strong>"così com'è"</strong> senza garanzie di alcun tipo.
          </p>
          <p style={styles.paragraph}>
            Il Fornitore NON è responsabile per:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Perdite economiche derivanti dall'uso dell'App
            </li>
            <li style={styles.listItem}>
              Danni indiretti, incidentali o conseguenti
            </li>
            <li style={styles.listItem}>
              Errori o omissioni nei contenuti inseriti dagli utenti
            </li>
            <li style={styles.listItem}>
              Uso improprio dell'App da parte degli utenti
            </li>
          </ul>
          <p style={styles.paragraph}>
            La responsabilità massima del Fornitore è limitata all'importo 
            pagato dall'Associazione negli ultimi 12 mesi.
          </p>
        </div>

        {/* Sezione 11 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Assistenza e Supporto</h2>
          <p style={styles.paragraph}>
            Il Fornitore fornisce:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Supporto tecnico via email: giovannibuoli@gmail.com
            </li>
            <li style={styles.listItem}>
              Tempo di risposta: entro 48 ore lavorative
            </li>
            <li style={styles.listItem}>
              Correzione bug critici: entro 7 giorni lavorativi
            </li>
          </ul>
        </div>

        {/* Sezione 12 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>12. Modifiche ai Termini</h2>
          <p style={styles.paragraph}>
            Il Fornitore si riserva il diritto di modificare questi Termini in qualsiasi momento.
          </p>
          <p style={styles.paragraph}>
            Le modifiche saranno comunicate tramite:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Notifica nell'App</li>
            <li style={styles.listItem}>Email all'Associazione</li>
          </ul>
          <p style={styles.paragraph}>
            L'uso continuato dell'App dopo le modifiche costituisce accettazione dei nuovi Termini.
          </p>
        </div>

        {/* Sezione 13 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>13. Sospensione e Cessazione</h2>
          <p style={styles.paragraph}>
            <strong>Il Fornitore può sospendere l'accesso in caso di:</strong>
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Violazione dei Termini</li>
            <li style={styles.listItem}>Mancato pagamento (se previsto)</li>
            <li style={styles.listItem}>Attività sospette o fraudolente</li>
          </ul>
          <p style={styles.paragraph}>
            <strong>L'Associazione può cessare l'uso:</strong>
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Con preavviso scritto di 30 giorni</li>
            <li style={styles.listItem}>Esportazione dati garantita entro 15 giorni</li>
          </ul>
        </div>

        {/* Sezione 14 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>14. Legge Applicabile e Foro</h2>
          <p style={styles.paragraph}>
            Questi Termini sono regolati dalla <strong>legge italiana</strong>.
          </p>
          <p style={styles.paragraph}>
            Per qualsiasi controversia è competente in via esclusiva il 
            <strong> Foro di Mantova</strong>.
          </p>
        </div>

        {/* Sezione 15 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>15. Varie</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Separabilità:</strong> Se una clausola è invalida, le altre rimangono valide
            </li>
            <li style={styles.listItem}>
              <strong>Integralità:</strong> Questi Termini costituiscono l'accordo completo
            </li>
            <li style={styles.listItem}>
              <strong>Rinuncia:</strong> La mancata applicazione di una clausola non costituisce rinuncia
            </li>
          </ul>
        </div>

        {/* Contatti */}
        <div style={{
          backgroundColor: '#f1f8f4',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '40px',
        }}>
          <h3 style={{ color: '#43a047', marginBottom: '10px' }}>
            📧 Domande sui Termini?
          </h3>
          <p style={styles.paragraph}>
            Contatta il Fornitore: <strong>giovannibuoli@gmail.com</strong><br/>
            Oppure l'Associazione: <strong>amministrazionepoggeseacademy@gmail.com</strong>
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

export default TermsOfService;
