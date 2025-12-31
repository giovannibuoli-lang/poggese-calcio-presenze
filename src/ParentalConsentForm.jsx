// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 COPIA TUTTO QUESTO CODICE IN: ParentalConsentForm.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';

const ParentalConsentForm = ({ onConsent, onCancel, childName }) => {
  const [formData, setFormData] = useState({
    parentName: '', parentSurname: '', parentEmail: '', parentPhone: '',
    relationship: 'padre', childName: childName || '', childBirthDate: '',
    privacyAccepted: false, termsAccepted: false, parentalAuthorization: false,
  });
  const [errors, setErrors] = useState({});

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px', overflowY: 'auto' },
    modal: { backgroundColor: 'white', borderRadius: '16px', padding: '40px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
    header: { background: 'linear-gradient(135deg, #ff6f00 0%, #e65100 100%)', color: 'white', padding: '24px', marginLeft: '-40px', marginRight: '-40px', marginTop: '-40px', marginBottom: '30px', borderRadius: '16px 16px 0 0', textAlign: 'center' },
    title: { fontSize: '24px', fontWeight: '700', marginBottom: '8px' },
    section: { marginBottom: '24px' },
    sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '12px', paddingBottom: '8px', borderBottom: '2px solid #ff6f00' },
    label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '6px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' },
    select: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', backgroundColor: 'white' },
    button: { flex: 1, padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
    warningBox: { backgroundColor: '#fff3e0', border: '2px solid #ff6f00', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '13px' },
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.parentName.trim()) newErrors.parentName = 'Obbligatorio';
    if (!formData.parentSurname.trim()) newErrors.parentSurname = 'Obbligatorio';
    if (!formData.parentEmail.trim() || !formData.parentEmail.includes('@')) newErrors.parentEmail = 'Email valida obbligatoria';
    if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Obbligatorio';
    if (!formData.childName.trim()) newErrors.childName = 'Obbligatorio';
    if (!formData.childBirthDate) newErrors.childBirthDate = 'Obbligatorio';
    if (!formData.privacyAccepted) newErrors.privacyAccepted = 'Devi accettare';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'Devi accettare';
    if (!formData.parentalAuthorization) newErrors.parentalAuthorization = 'Devi autorizzare';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const consentData = { ...formData, consentDate: new Date().toISOString(), consentType: 'parental' };
      localStorage.setItem(`parentalConsent_${formData.childName}`, JSON.stringify(consentData));
      onConsent(consentData);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>👨‍👩‍👧 Consenso Genitoriale</h2>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>Richiesto per minori di 18 anni (Art. 8 GDPR)</p>
        </div>
        <div style={styles.warningBox}><strong>⚠️ IMPORTANTE:</strong> Consenso obbligatorio per minori di 18 anni (GDPR).</div>
        <form onSubmit={handleSubmit}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Dati Genitore/Tutore</h3>
            <label style={styles.label}>Relazione *</label>
            <select style={styles.select} value={formData.relationship} onChange={(e) => setFormData({...formData, relationship: e.target.value})}>
              <option value="padre">Padre</option>
              <option value="madre">Madre</option>
              <option value="tutore">Tutore Legale</option>
            </select>
            <label style={styles.label}>Nome *</label>
            <input type="text" style={styles.input} value={formData.parentName} onChange={(e) => setFormData({...formData, parentName: e.target.value})} />
            <label style={styles.label}>Cognome *</label>
            <input type="text" style={styles.input} value={formData.parentSurname} onChange={(e) => setFormData({...formData, parentSurname: e.target.value})} />
            <label style={styles.label}>Email *</label>
            <input type="email" style={styles.input} value={formData.parentEmail} onChange={(e) => setFormData({...formData, parentEmail: e.target.value})} />
            <label style={styles.label}>Telefono *</label>
            <input type="tel" style={styles.input} value={formData.parentPhone} onChange={(e) => setFormData({...formData, parentPhone: e.target.value})} />
          </div>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Dati Minore</h3>
            <label style={styles.label}>Nome e Cognome *</label>
            <input type="text" style={styles.input} value={formData.childName} onChange={(e) => setFormData({...formData, childName: e.target.value})} />
            <label style={styles.label}>Data di Nascita *</label>
            <input type="date" style={styles.input} value={formData.childBirthDate} onChange={(e) => setFormData({...formData, childBirthDate: e.target.value})} max={new Date().toISOString().split('T')[0]} />
          </div>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Consensi *</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input type="checkbox" checked={formData.privacyAccepted} onChange={(e) => setFormData({...formData, privacyAccepted: e.target.checked})} />
              <label style={{ fontSize: '13px' }}>Accetto Privacy Policy *</label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input type="checkbox" checked={formData.termsAccepted} onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})} />
              <label style={{ fontSize: '13px' }}>Accetto Termini e Condizioni *</label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input type="checkbox" checked={formData.parentalAuthorization} onChange={(e) => setFormData({...formData, parentalAuthorization: e.target.checked})} />
              <label style={{ fontSize: '13px' }}><strong>Autorizzo</strong> il trattamento dati del minore *</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
            <button type="button" style={{...styles.button, backgroundColor: '#757575', color: 'white'}} onClick={onCancel}>Annulla</button>
            <button type="submit" style={{...styles.button, backgroundColor: '#43a047', color: 'white'}}>✓ Conferma</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentalConsentForm;
