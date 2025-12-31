// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 COPIA TUTTO QUESTO CODICE IN: AgeVerification.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';

const AgeVerification = ({ onVerified, onRequireParentalConsent }) => {
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');

  const styles = {
    container: { backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', margin: '40px auto', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    title: { fontSize: '24px', fontWeight: '700', color: '#333', marginBottom: '8px', textAlign: 'center' },
    input: { width: '100%', padding: '14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '16px', marginBottom: '8px', boxSizing: 'border-box' },
    button: { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '16px', backgroundColor: '#1e88e5', color: 'white' },
    errorText: { color: '#e53935', fontSize: '13px', marginBottom: '16px' },
  };

  const calculateAge = (birthDateString) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleVerify = () => {
    setError('');
    if (!birthDate) {
      setError('Inserisci la tua data di nascita');
      return;
    }
    const age = calculateAge(birthDate);
    if (age < 0 || age > 120) {
      setError('Data di nascita non valida');
      return;
    }
    if (age < 6) {
      setError('Devi avere almeno 6 anni');
      return;
    }
    if (age >= 18) {
      onVerified({ age, birthDate, requiresParentalConsent: false });
    } else {
      onRequireParentalConsent({ age, birthDate, requiresParentalConsent: true });
    }
  };

  const displayAge = birthDate ? calculateAge(birthDate) : null;

  return (
    <div style={styles.container}>
      <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>🎂</div>
      <h2 style={styles.title}>Verifica Età</h2>
      <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '24px' }}>Il GDPR richiede verifica età per i minori di 18 anni</p>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Quando sei nato/a?</label>
      <input type="date" style={styles.input} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
      {error && <div style={styles.errorText}>{error}</div>}
      {displayAge !== null && !error && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e88e5' }}>{displayAge}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>anni</div>
        </div>
      )}
      <button style={styles.button} onClick={handleVerify}>
        {displayAge !== null && displayAge < 18 ? '👨‍👩‍👧 Richiedi Consenso Genitori' : '✓ Verifica Età'}
      </button>
    </div>
  );
};

export default AgeVerification;
