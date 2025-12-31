// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 COPIA TUTTO QUESTO CODICE IN: DataManagement.jsx
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';

const DataManagement = ({ onBack }) => {
  const { user } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' },
    card: { backgroundColor: 'white', borderRadius: '12px', padding: '40px', maxWidth: '900px', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    header: { background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)', color: 'white', padding: '40px 20px', textAlign: 'center', marginBottom: '40px', borderRadius: '12px' },
    title: { fontSize: '32px', fontWeight: '700', marginBottom: '10px' },
    section: { marginBottom: '30px', padding: '24px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '12px' },
    paragraph: { fontSize: '14px', lineHeight: '1.6', color: '#666', marginBottom: '12px' },
    button: { padding: '12px 24px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginRight: '12px', marginTop: '12px' },
    backButton: { backgroundColor: '#757575', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' },
    dataBox: { backgroundColor: 'white', padding: '16px', borderRadius: '8px', marginTop: '12px', border: '1px solid #e0e0e0' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 },
    modalCard: { backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%' },
  };

  const handleDownloadData = () => {
    const userData = {
      user: {
        email: user?.primaryEmailAddress?.emailAddress || 'N/A',
        name: user?.fullName || 'N/A',
        userId: user?.id || 'N/A',
      },
      exportDate: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `miei-dati-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'ELIMINA') {
      alert('Devi digitare "ELIMINA" per confermare');
      return;
    }
    try {
      await user.delete();
      localStorage.clear();
      alert('Account eliminato con successo.');
      window.location.href = '/';
    } catch (error) {
      alert('Errore durante eliminazione account. Contatta il supporto.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backButton} onClick={onBack}>← Indietro</button>
        <div style={styles.header}>
          <h1 style={styles.title}>🗂️ I Miei Dati</h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>Gestisci i tuoi dati personali - Diritti GDPR</p>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>📋 Cosa sappiamo di te</div>
          <p style={styles.paragraph}>Secondo l'Art. 15 GDPR, hai il diritto di conoscere quali dati trattiamo.</p>
          <div style={styles.dataBox}>
            <div><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'N/A'}</div>
            <div><strong>Nome:</strong> {user?.fullName || 'N/A'}</div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>⬇️ Scarica i tuoi dati</div>
          <p style={styles.paragraph}>Art. 20 GDPR - Diritto alla portabilità dei dati.</p>
          <button style={{...styles.button, backgroundColor: '#1e88e5', color: 'white'}} onClick={handleDownloadData}>
            📥 Scarica Dati (JSON)
          </button>
        </div>

        <div style={{...styles.section, borderColor: '#e53935', borderWidth: '2px'}}>
          <div style={{...styles.sectionTitle, color: '#e53935'}}>🗑️ Elimina account</div>
          <p style={styles.paragraph}>Art. 17 GDPR - Diritto all'oblio. Azione IRREVERSIBILE!</p>
          <button style={{...styles.button, backgroundColor: '#e53935', color: 'white'}} onClick={() => setShowDeleteConfirm(true)}>
            🗑️ Elimina Account
          </button>
        </div>

        {showDeleteConfirm && (
          <div style={styles.modal} onClick={() => setShowDeleteConfirm(false)}>
            <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ color: '#e53935' }}>⚠️ Conferma Eliminazione</h2>
              <p>Digita ELIMINA per confermare:</p>
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} style={styles.input} placeholder="ELIMINA" />
              <button style={{...styles.button, backgroundColor: '#e53935', color: 'white'}} onClick={handleDeleteAccount}>Elimina Definitivamente</button>
              <button style={{...styles.button, backgroundColor: '#757575', color: 'white'}} onClick={() => setShowDeleteConfirm(false)}>Annulla</button>
            </div>
          </div>
        )}

        <button style={{...styles.backButton, marginTop: '30px'}} onClick={onBack}>← Torna all'App</button>
      </div>
    </div>
  );
};

export default DataManagement;
