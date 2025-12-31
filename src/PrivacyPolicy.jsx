import React from 'react';

// ===== PRIVACY POLICY COMPONENT =====
// Conforme GDPR (Regolamento UE 2016/679)
// PresenzaCalcio - S.S.D. POGGESE ACADEMY a R.L.
const PrivacyPolicy = ({ onBack }) => {
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
      background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
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
      color: '#1e88e5',
      marginBottom: '15px',
      borderBottom: '2px solid #1e88e5',
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
      backgroundColor: '#1e88e5',
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
          <h1 style={styles.title}>🔒 Informativa sulla Privacy</h1>
          <p style={styles.subtitle}>Conforme al Regolamento UE 2016/679 (GDPR)</p>
        </div>

        <div style={styles.updated}>
          Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
        </div>

        {/* Sezione 1 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Titolare del Trattamento</h2>
          <p style={styles.paragraph}>
            Il <strong>Titolare del Trattamento</strong> dei dati personali raccolti tramite l'applicazione 
            "PresenzaCalcio" è:
          </p>
          <p style={styles.paragraph}>
            <strong>S.S.D. POGGESE ACADEMY a R.L.</strong><br/>
            Con sede in: Piazza Donatori di Sangue, 46020 San Giovanni del Dosso (MN)<br/>
            Codice Fiscale/P.IVA: 02753000203<br/>
            Email: amministrazionepoggeseacademy@gmail.com
          </p>
          <p style={styles.paragraph}>
            Il fornitore del software (Responsabile del Trattamento) è:<br/>
            <strong>Giovanni Buoli</strong><br/>
            Con sede in: via Virgiliana 124, 44012 Bondeno (FE)<br/>
            Codice Fiscale: BLUGNN69H01A965R<br/>
            Email: giovannibuoli@gmail.com
          </p>
        </div>

        {/* Sezione 2 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Dati Raccolti</h2>
          <p style={styles.paragraph}>
            L'applicazione raccoglie e tratta le seguenti categorie di dati personali:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Dati di autenticazione:</strong> email, password (crittografata)
            </li>
            <li style={styles.listItem}>
              <strong>Dati anagrafici:</strong> nome, cognome
            </li>
            <li style={styles.listItem}>
              <strong>Dati di utilizzo:</strong> presenze/assenze agli eventi sportivi, 
              conferme partecipazione, note personali
            </li>
            <li style={styles.listItem}>
              <strong>Dati tecnici:</strong> indirizzo IP, browser utilizzato, 
              data e ora di accesso (log di sistema)
            </li>
            <li style={styles.listItem}>
              <strong>Cookie tecnici:</strong> necessari per il funzionamento dell'applicazione
            </li>
          </ul>
          <p style={styles.paragraph}>
            <strong>Dati di minori:</strong> Se sei minorenne (sotto i 18 anni), 
            il trattamento dei tuoi dati richiede il consenso dei tuoi genitori o tutori legali.
          </p>
        </div>

        {/* Sezione 2.5 - MINORI */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2.5. Trattamento Dati di Minori</h2>
          <p style={styles.paragraph}>
            <strong>Protezione Speciale dei Minori (Art. 8 GDPR):</strong>
          </p>
          <p style={styles.paragraph}>
            Se hai <strong>meno di 18 anni</strong>, per utilizzare questa applicazione 
            è necessario il <strong>consenso esplicito</strong> di un genitore o tutore legale.
          </p>
          
          <h3 style={{fontSize: '16px', fontWeight: '700', marginTop: '20px', marginBottom: '10px'}}>
            Minori di 14 anni
          </h3>
          <p style={styles.paragraph}>
            Il consenso è <strong>obbligatorio</strong> e deve essere fornito dal 
            genitore o tutore attraverso il form di consenso genitoriale.
          </p>
          
          <h3 style={{fontSize: '16px', fontWeight: '700', marginTop: '20px', marginBottom: '10px'}}>
            Minori tra 14 e 18 anni
          </h3>
          <p style={styles.paragraph}>
            Puoi dare il consenso autonomamente, ma <strong>consigliamo vivamente</strong> 
            di informare i tuoi genitori e ottenere il loro consenso.
          </p>
          
          <h3 style={{fontSize: '16px', fontWeight: '700', marginTop: '20px', marginBottom: '10px'}}>
            Dati raccolti per il consenso genitoriale
          </h3>
          <ul style={styles.list}>
            <li style={styles.listItem}>Nome e cognome genitore/tutore</li>
            <li style={styles.listItem}>Email genitore/tutore</li>
            <li style={styles.listItem}>Relazione con il minore (padre/madre/tutore)</li>
            <li style={styles.listItem}>Data di nascita del minore (per verifica età)</li>
            <li style={styles.listItem}>Data e ora del consenso</li>
          </ul>
          
          <p style={styles.paragraph}>
            <strong>Verifica identità genitori:</strong> Il genitore riceverà un'email 
            di conferma. Il consenso sarà valido solo dopo la conferma via email.
          </p>
          
          <p style={styles.paragraph}>
            <strong>Revoca consenso:</strong> I genitori possono revocare il consenso 
            in qualsiasi momento contattando l'associazione. La revoca comporterà la 
            disattivazione immediata dell'account del minore e la cancellazione dei dati 
            entro 30 giorni.
          </p>
          
          <p style={{...styles.paragraph, backgroundColor: '#fff3e0', padding: '12px', borderRadius: '8px'}}>
            <strong>⚠️ Importante per i genitori:</strong> Avete il diritto di accedere, 
            rettificare o cancellare i dati del/la minore in qualsiasi momento. 
            Potete esercitare questi diritti contattando l'associazione all'indirizzo 
            email amministrazionepoggeseacademy@gmail.com
          </p>
        </div>

        {/* Sezione 3 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Finalità del Trattamento</h2>
          <p style={styles.paragraph}>I tuoi dati vengono trattati per:</p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              Gestione delle convocazioni e presenze agli eventi sportivi
            </li>
            <li style={styles.listItem}>
              Comunicazioni relative agli allenamenti, partite e riunioni
            </li>
            <li style={styles.listItem}>
              Gestione dell'organizzazione sportiva dell'associazione
            </li>
            <li style={styles.listItem}>
              Statistiche anonime sulle presenze (senza identificare singoli individui)
            </li>
            <li style={styles.listItem}>
              Sicurezza e protezione dell'applicazione
            </li>
          </ul>
        </div>

        {/* Sezione 4 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Base Giuridica</h2>
          <p style={styles.paragraph}>
            Il trattamento dei dati è basato su:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Consenso dell'interessato</strong> (Art. 6.1.a GDPR) - 
              fornito al momento della registrazione
            </li>
            <li style={styles.listItem}>
              <strong>Esecuzione di un contratto</strong> (Art. 6.1.b GDPR) - 
              tesseramento presso l'associazione sportiva
            </li>
            <li style={styles.listItem}>
              <strong>Legittimo interesse</strong> (Art. 6.1.f GDPR) - 
              organizzazione delle attività sportive
            </li>
          </ul>
        </div>

        {/* Sezione 5 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Destinatari dei Dati</h2>
          <p style={styles.paragraph}>
            I tuoi dati possono essere comunicati a:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Allenatori e dirigenti</strong> dell'associazione (solo per finalità organizzative)
            </li>
            <li style={styles.listItem}>
              <strong>Fornitori di servizi tecnici:</strong>
              <ul style={styles.list}>
                <li style={styles.listItem}>Clerk Inc. (autenticazione) - USA, Privacy Shield</li>
                <li style={styles.listItem}>Cloudflare Inc. (database) - USA, Standard Contractual Clauses</li>
                <li style={styles.listItem}>Vercel Inc. (hosting) - USA, Privacy Shield</li>
              </ul>
            </li>
          </ul>
          <p style={styles.paragraph}>
            I tuoi dati <strong>NON vengono venduti</strong> a terze parti per scopi commerciali.
          </p>
        </div>

        {/* Sezione 6 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Conservazione dei Dati</h2>
          <p style={styles.paragraph}>
            I dati vengono conservati per:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Dati di iscrizione:</strong> fino alla cancellazione dell'account 
              o revoca del consenso
            </li>
            <li style={styles.listItem}>
              <strong>Dati di presenze:</strong> per la durata della stagione sportiva + 2 anni 
              (per fini statistici e organizzativi)
            </li>
            <li style={styles.listItem}>
              <strong>Log di sistema:</strong> massimo 12 mesi (per sicurezza)
            </li>
          </ul>
        </div>

        {/* Sezione 7 - DIRITTI GDPR */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>7. I Tuoi Diritti (GDPR)</h2>
          <p style={styles.paragraph}>
            Hai il diritto di:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Accesso</strong> (Art. 15) - Ottenere conferma che stiamo trattando i tuoi dati 
              e ricevere una copia
            </li>
            <li style={styles.listItem}>
              <strong>Rettifica</strong> (Art. 16) - Correggere dati inesatti o incompleti
            </li>
            <li style={styles.listItem}>
              <strong>Cancellazione</strong> (Art. 17) - Richiedere la cancellazione dei tuoi dati 
              ("diritto all'oblio")
            </li>
            <li style={styles.listItem}>
              <strong>Limitazione</strong> (Art. 18) - Limitare il trattamento in determinate circostanze
            </li>
            <li style={styles.listItem}>
              <strong>Portabilità</strong> (Art. 20) - Ricevere i tuoi dati in formato strutturato 
              e trasferirli ad altro titolare
            </li>
            <li style={styles.listItem}>
              <strong>Opposizione</strong> (Art. 21) - Opporti al trattamento per motivi legittimi
            </li>
            <li style={styles.listItem}>
              <strong>Revoca consenso</strong> (Art. 7.3) - Revocare il consenso in qualsiasi momento
            </li>
          </ul>
          <p style={styles.paragraph}>
            Per esercitare questi diritti, vai alla sezione <strong>"Gestisci i miei dati"</strong> 
            nell'app o contatta l'associazione all'indirizzo email amministrazionepoggeseacademy@gmail.com
          </p>
        </div>

        {/* Sezione 8 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Sicurezza dei Dati</h2>
          <p style={styles.paragraph}>
            Adottiamo misure tecniche e organizzative per proteggere i tuoi dati:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Crittografia HTTPS</strong> per tutte le comunicazioni
            </li>
            <li style={styles.listItem}>
              <strong>Password crittografate</strong> con algoritmi sicuri
            </li>
            <li style={styles.listItem}>
              <strong>Backup automatici</strong> giornalieri
            </li>
            <li style={styles.listItem}>
              <strong>Controllo accessi</strong> basato su ruoli (admin/allenatore/giocatore)
            </li>
            <li style={styles.listItem}>
              <strong>Log delle attività</strong> per tracciare accessi non autorizzati
            </li>
          </ul>
        </div>

        {/* Sezione 9 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Trasferimento Dati Extra-UE</h2>
          <p style={styles.paragraph}>
            Alcuni fornitori di servizi si trovano negli Stati Uniti (USA). 
            Il trasferimento dei dati è garantito da:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <strong>Standard Contractual Clauses</strong> (SCC) approvate dalla Commissione Europea
            </li>
            <li style={styles.listItem}>
              <strong>Adeguatezza</strong> secondo decisioni della Commissione UE
            </li>
            <li style={styles.listItem}>
              <strong>Certificazioni di sicurezza</strong> (SOC 2, ISO 27001)
            </li>
          </ul>
        </div>

        {/* Sezione 10 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Cookie</h2>
          <p style={styles.paragraph}>
            L'applicazione utilizza <strong>cookie tecnici</strong> strettamente necessari 
            per il funzionamento (es. mantenere la sessione di login). 
            Non utilizziamo cookie di profilazione o pubblicità.
          </p>
          <p style={styles.paragraph}>
            Per maggiori dettagli, consulta la nostra <strong>Cookie Policy</strong>.
          </p>
        </div>

        {/* Sezione 11 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Reclami</h2>
          <p style={styles.paragraph}>
            Se ritieni che il trattamento dei tuoi dati violi il GDPR, hai il diritto di 
            presentare reclamo all'Autorità Garante:
          </p>
          <p style={styles.paragraph}>
            <strong>Garante per la Protezione dei Dati Personali</strong><br/>
            Piazza Venezia, 11 - 00187 Roma<br/>
            Email: garante@gpdp.it<br/>
            Web: www.garanteprivacy.it
          </p>
        </div>

        {/* Sezione 12 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>12. Modifiche a questa Informativa</h2>
          <p style={styles.paragraph}>
            Ci riserviamo il diritto di modificare questa informativa. 
            Le modifiche saranno comunicate tramite l'applicazione e la data di 
            "Ultimo aggiornamento" sarà aggiornata.
          </p>
        </div>

        {/* Contatti */}
        <div style={{
          backgroundColor: '#f0f7ff',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '40px',
        }}>
          <h3 style={{ color: '#1e88e5', marginBottom: '10px' }}>
            📧 Hai domande sulla privacy?
          </h3>
          <p style={styles.paragraph}>
            Contatta l'associazione all'indirizzo: <strong>amministrazionepoggeseacademy@gmail.com</strong>
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

export default PrivacyPolicy;
