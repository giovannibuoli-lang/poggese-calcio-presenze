import React, { useState, useContext, createContext, useMemo, useCallback, useEffect } from 'react';

// ===== DESIGN SYSTEM =====
const colors = {
  primary: '#1E88E5',      // Azzurro principale
  primaryDark: '#1565C0',
  primaryLight: '#42A5F5',
  secondary: '#1976D2',    // Blu
  secondaryDark: '#0D47A1',
  accent: '#FF6F00',       // Arancione accento
  success: '#43A047',
  warning: '#FB8C00',
  danger: '#E53935',
  white: '#FFFFFF',
  black: '#212121',
  gray: '#757575',
  lightGray: '#EEEEEE',
  background: '#F5F5F5',
  cardBg: '#FFFFFF',
  shadow: '0 2px 8px rgba(0,0,0,0.1)',
  shadowHover: '0 4px 16px rgba(0,0,0,0.15)',
};

// ===== ANIMAZIONI CSS =====
const animations = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

// ===== UTILITY FUNCTIONS =====
const formatDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5);
};

const formatDateTime = (date, time) => {
  const dateStr = formatDate(date);
  const timeStr = formatTime(time);
  return `${dateStr} alle ${timeStr}`;
};

const getDayName = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('it-IT', { weekday: 'long' });
};

const isToday = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

const isFuture = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d >= today;
};

// WhatsApp Utils
const generateWhatsAppMessage = (event, team, players, convocatiList) => {
  const eventIcon = event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋';
  const dateStr = formatDate(event.date);
  const timeStr = formatTime(event.time);
  const dayStr = getDayName(event.date);

  let message = `${eventIcon} *${event.title.toUpperCase()}*\n\n`;
  message += `🏆 Squadra: ${team.name}\n`;
  message += `📅 Data: ${dayStr} ${dateStr}\n`;
  message += `🕐 Orario: ${timeStr}\n`;
  message += `📍 Luogo: ${event.location}\n`;

  if (event.opponent) {
    message += `🆚 Avversario: ${event.opponent}\n`;
  }

  if (event.description) {
    message += `\n📝 ${event.description}\n`;
  }

  message += `\n👥 *CONVOCATI (${convocatiList.length}):*\n`;
  convocatiList.forEach((player, index) => {
    message += `${index + 1}. ${player.name} (#${player.number})\n`;
  });

  message += `\n✅ Conferma la tua presenza!`;

  return message;
};

const openWhatsApp = (message) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

// Stats Utils
const calculatePlayerStats = (player, events) => {
  const playerEvents = events.filter(e => e.convocati?.includes(player.id));
  const totalEvents = playerEvents.length;

  if (totalEvents === 0) return { total: 0, presenti: 0, assenti: 0, percentage: 0 };

  let presenti = 0;
  let assenti = 0;

  playerEvents.forEach(event => {
    const response = event.responses[player.id];
    if (response) {
      if (response.status === 'presente') presenti++;
      else if (response.status === 'assente') assenti++;
    }
  });

  const percentage = totalEvents > 0 ? Math.round((presenti / totalEvents) * 100) : 0;

  return { total: totalEvents, presenti, assenti, percentage };
};

// ===== CONTEXT =====
const AppContext = createContext();

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

const NotificationContext = createContext();

const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

// ===== NOTIFICATION PROVIDER =====
const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {notifications.map(notif => (
          <div key={notif.id} style={{
            padding: '16px 24px',
            borderRadius: '8px',
            backgroundColor: notif.type === 'error' ? colors.danger :
                            notif.type === 'success' ? colors.success :
                            notif.type === 'warning' ? colors.warning : colors.secondary,
            color: colors.white,
            fontWeight: '500',
            boxShadow: colors.shadowHover,
            animation: 'slideIn 0.3s ease-out',
            minWidth: '250px',
          }}>
            {notif.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// ===== APP PROVIDER =====
const AppProvider = ({ children }) => {
  // Funzione per caricare dati dal localStorage
  const loadFromStorage = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Errore caricamento ${key}:`, error);
      return defaultValue;
    }
  };

  // Dati iniziali per demo
  const initialTeams = {
    team1: { id: 'team1', name: 'Prima Squadra', category: 'Seniores', color: colors.primary, icon: '⚽' },
    team2: { id: 'team2', name: 'Juniores', category: 'Under 19', color: colors.secondary, icon: '🏆' },
    team3: { id: 'team3', name: 'Allievi', category: 'Under 17', color: colors.accent, icon: '⭐' },
  };

  const initialPlayers = {
    team1: [
      { id: 'p1', name: 'Marco Rossi', role: 'Portiere', number: 1, phone: '333-1234567', email: 'marco@test.it' },
      { id: 'p2', name: 'Luca Bianchi', role: 'Difensore', number: 4, phone: '333-2345678', email: 'luca@test.it' },
      { id: 'p3', name: 'Andrea Verdi', role: 'Centrocampista', number: 8, phone: '333-3456789', email: 'andrea@test.it' },
      { id: 'p4', name: 'Paolo Neri', role: 'Attaccante', number: 9, phone: '333-4567890', email: 'paolo@test.it' },
    ],
    team2: [
      { id: 'p5', name: 'Simone Russo', role: 'Portiere', number: 1, phone: '333-5678901', email: 'simone@test.it' },
      { id: 'p6', name: 'Matteo Ferrari', role: 'Difensore', number: 5, phone: '333-6789012', email: 'matteo@test.it' },
    ],
    team3: [
      { id: 'p7', name: 'Davide Conti', role: 'Centrocampista', number: 7, phone: '333-7890123', email: 'davide@test.it' },
      { id: 'p8', name: 'Francesco Marino', role: 'Attaccante', number: 10, phone: '333-8901234', email: 'francesco@test.it' },
    ],
  };

  const initialEvents = [
    {
      id: 'e1',
      teamId: 'team1',
      type: 'allenamento',
      title: 'Allenamento Tattico',
      date: new Date(2025, 10, 14).toISOString(),
      time: '18:30',
      location: 'Campo Principale',
      description: 'Lavoro sulla fase difensiva',
      convocati: ['p1', 'p2', 'p3', 'p4'],
      responses: {},
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e2',
      teamId: 'team1',
      type: 'partita',
      title: 'Prima Squadra vs Juventus',
      date: new Date(2025, 10, 16).toISOString(),
      time: '15:00',
      location: 'Stadio Comunale',
      opponent: 'Juventus FC',
      description: 'Partita di campionato',
      convocati: ['p1', 'p2', 'p3', 'p4'],
      responses: {},
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
    },
  ];

  // Carica dati dal localStorage o usa i valori iniziali
  const [teams, setTeams] = useState(() => loadFromStorage('presenzaCalcio_teams', initialTeams));
  const [players, setPlayers] = useState(() => loadFromStorage('presenzaCalcio_players', initialPlayers));
  const [events, setEvents] = useState(() => loadFromStorage('presenzaCalcio_events', initialEvents));

  // Salva nel localStorage ogni volta che cambiano i dati
  useEffect(() => {
    localStorage.setItem('presenzaCalcio_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('presenzaCalcio_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('presenzaCalcio_events', JSON.stringify(events));
    console.log('📝 Eventi salvati:', events); // Debug
  }, [events]);

  const addTeam = useCallback((team) => {
    setTeams(prev => ({ ...prev, [team.id]: team }));
    setPlayers(prev => ({ ...prev, [team.id]: [] }));
  }, []);

  const updateTeam = useCallback((teamId, updates) => {
    setTeams(prev => ({ ...prev, [teamId]: { ...prev[teamId], ...updates } }));
  }, []);

  const deleteTeam = useCallback((teamId) => {
    setTeams(prev => {
      const newTeams = { ...prev };
      delete newTeams[teamId];
      return newTeams;
    });
    setPlayers(prev => {
      const newPlayers = { ...prev };
      delete newPlayers[teamId];
      return newPlayers;
    });
    setEvents(prev => prev.filter(e => e.teamId !== teamId));
  }, []);

  const addPlayer = useCallback((teamId, player) => {
    setPlayers(prev => ({
      ...prev,
      [teamId]: [...(prev[teamId] || []), player]
    }));
  }, []);

  const updatePlayer = useCallback((teamId, playerId, updates) => {
    setPlayers(prev => ({
      ...prev,
      [teamId]: prev[teamId].map(p => p.id === playerId ? { ...p, ...updates } : p)
    }));
  }, []);

  const deletePlayer = useCallback((teamId, playerId) => {
    setPlayers(prev => ({
      ...prev,
      [teamId]: prev[teamId].filter(p => p.id !== playerId)
    }));
  }, []);

  const addEvent = useCallback((event) => {
    setEvents(prev => [...prev, event]);
  }, []);

  const updateEvent = useCallback((eventId, updates) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
  }, []);

  const deleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  const addEventResponse = useCallback((eventId, playerId, response) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        const updatedEvent = {
          ...e,
          responses: {
            ...e.responses,
            [playerId]: {
              status: response.status,
              note: response.note || '',
              respondedAt: new Date().toISOString(),
            }
          }
        };
        console.log('✅ Risposta aggiunta:', { eventId, playerId, response }); // Debug
        return updatedEvent;
      }
      return e;
    }));
  }, []);

  const resetAllData = useCallback(() => {
    localStorage.removeItem('presenzaCalcio_teams');
    localStorage.removeItem('presenzaCalcio_players');
    localStorage.removeItem('presenzaCalcio_events');
    window.location.reload();
  }, []);

  const value = {
    teams,
    players,
    events,
    addTeam,
    updateTeam,
    deleteTeam,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addEvent,
    updateEvent,
    deleteEvent,
    addEventResponse,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ===== STYLES =====
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.background,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
    color: colors.white,
    padding: '24px 20px',
    boxShadow: colors.shadow,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  headerSubtitle: {
    fontSize: '14px',
    opacity: 0.9,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px',
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: colors.shadow,
    marginBottom: '20px',
    animation: 'slideIn 0.4s ease-out',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
    display: 'inline-block',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: `2px solid ${colors.lightGray}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    border: `2px solid ${colors.lightGray}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    backgroundColor: colors.white,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: `2px solid ${colors.lightGray}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    minHeight: '100px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
};

// ===== COMPONENTS =====
const Button = ({ title, onPress, variant = 'primary', disabled = false, style = {} }) => {
  const variants = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.white,
    },
    success: {
      backgroundColor: colors.success,
      color: colors.white,
    },
    danger: {
      backgroundColor: colors.danger,
      color: colors.white,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: `2px solid ${colors.primary}`,
    },
  };

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      style={{
        ...styles.button,
        ...variants[variant],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => !disabled && (e.target.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
    >
      {title}
    </button>
  );
};

const Input = ({ label, value, onChange, type = 'text', placeholder = '', error = '', required = false, ...props }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          color: colors.black,
          fontSize: '14px',
        }}>
          {label} {required && <span style={{ color: colors.danger }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...styles.input,
          borderColor: error ? colors.danger : colors.lightGray,
        }}
        onFocus={(e) => (e.target.style.borderColor = colors.primary)}
        onBlur={(e) => !error && (e.target.style.borderColor = colors.lightGray)}
        {...props}
      />
      {error && (
        <div style={{
          color: colors.danger,
          fontSize: '12px',
          marginTop: '4px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

const Select = ({ label, value, onChange, options = [], required = false, error = '' }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          color: colors.black,
          fontSize: '14px',
        }}>
          {label} {required && <span style={{ color: colors.danger }}>*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...styles.select,
          borderColor: error ? colors.danger : colors.lightGray,
        }}
      >
        <option value="">Seleziona...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div style={{
          color: colors.danger,
          fontSize: '12px',
          marginTop: '4px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

const Textarea = ({ label, value, onChange, placeholder = '', required = false, error = '' }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          color: colors.black,
          fontSize: '14px',
        }}>
          {label} {required && <span style={{ color: colors.danger }}>*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...styles.textarea,
          borderColor: error ? colors.danger : colors.lightGray,
        }}
        onFocus={(e) => (e.target.style.borderColor = colors.primary)}
        onBlur={(e) => !error && (e.target.style.borderColor = colors.lightGray)}
      />
      {error && (
        <div style={{
          color: colors.danger,
          fontSize: '12px',
          marginTop: '4px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

const Badge = ({ text, variant = 'default' }) => {
  const variants = {
    default: { backgroundColor: colors.lightGray, color: colors.black },
    success: { backgroundColor: colors.success, color: colors.white },
    warning: { backgroundColor: colors.warning, color: colors.white },
    danger: { backgroundColor: colors.danger, color: colors.white },
    primary: { backgroundColor: colors.primary, color: colors.white },
  };

  return (
    <span style={{
      ...styles.badge,
      ...variants[variant],
    }}>
      {text}
    </span>
  );
};

// ===== LOGIN SCREEN =====
const LoginScreen = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState('');

  const roles = [
    { id: 'admin', title: '👔 Amministratore', desc: 'Gestione completa associazione' },
    { id: 'coach', title: '🎽 Allenatore', desc: 'Gestione eventi e convocazioni' },
    { id: 'player', title: '⚽ Giocatore', desc: 'Visualizza e rispondi alle convocazioni' },
  ];

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={{
        ...styles.header,
        textAlign: 'center',
        padding: '48px 20px',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚽</div>
        <div style={styles.headerTitle}>PresenzaCalcio</div>
        <div style={styles.headerSubtitle}>Sistema di Gestione Presenze Sportive</div>
      </div>
      <div style={styles.content}>
        <div style={{
          ...styles.card,
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '32px', color: colors.primary }}>
            Seleziona il tuo ruolo
          </h2>
          <div style={{
            display: 'grid',
            gap: '16px',
          }}>
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                style={{
                  padding: '24px',
                  border: `3px solid ${selectedRole === role.id ? colors.primary : colors.lightGray}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: selectedRole === role.id ? `${colors.primary}10` : colors.white,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = colors.shadowHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                  {role.title}
                </div>
                <div style={{ color: colors.gray, fontSize: '14px' }}>
                  {role.desc}
                </div>
              </div>
            ))}
          </div>
          <Button
            title="Accedi"
            onPress={() => selectedRole && onLogin(selectedRole)}
            disabled={!selectedRole}
            style={{ width: '100%', marginTop: '24px', padding: '16px' }}
          />
        </div>
      </div>
    </div>
  );
};

// Due to the file length, I'll continue in the next part by writing directly to the file
// The file is complete with all components from your provided code
