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
      responses: {
        p1: { status: 'presente', note: '', respondedAt: new Date().toISOString() },
        p2: { status: 'assente', note: 'Lavoro', respondedAt: new Date().toISOString() },
      },
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

  const [teams, setTeams] = useState(initialTeams);
  const [players, setPlayers] = useState(initialPlayers);
  const [events, setEvents] = useState(initialEvents);

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
        return {
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
      }
      return e;
    }));
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
        <div style={styles.headerTitle}>Calcio Presenze</div>
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

// ===== DASHBOARD =====
const Dashboard = ({ role, onNavigate, onLogout }) => {
  const { teams, players, events } = useAppContext();

  const stats = useMemo(() => {
    const totalTeams = Object.keys(teams).length;
    const totalPlayers = Object.values(players).reduce((sum, p) => sum + p.length, 0);
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => isFuture(e.date)).length;

    return { totalTeams, totalPlayers, totalEvents, upcomingEvents };
  }, [teams, players, events]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => isFuture(e.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [events]);

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>
              {role === 'admin' ? '👔 Dashboard Amministratore' :
               role === 'coach' ? '🎽 Dashboard Allenatore' :
               '⚽ Dashboard Giocatore'}
            </div>
            <div style={styles.headerSubtitle}>Calcio Presenze</div>
          </div>
          <Button title="Esci" onPress={onLogout} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {/* Statistiche */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}>
          <div
            style={{...styles.card, cursor: 'pointer', transition: 'all 0.3s'}}
            onClick={() => onNavigate('teams')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = colors.shadowHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = colors.shadow;
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: colors.primary }}>
              {stats.totalTeams}
            </div>
            <div style={{ color: colors.gray }}>Squadre</div>
          </div>
          <div
            style={{...styles.card, cursor: 'pointer', transition: 'all 0.3s'}}
            onClick={() => onNavigate('players')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = colors.shadowHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = colors.shadow;
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: colors.secondary }}>
              {stats.totalPlayers}
            </div>
            <div style={{ color: colors.gray }}>Giocatori</div>
          </div>
          <div
            style={{...styles.card, cursor: 'pointer', transition: 'all 0.3s'}}
            onClick={() => onNavigate('events')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = colors.shadowHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = colors.shadow;
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: colors.success }}>
              {stats.totalEvents}
            </div>
            <div style={{ color: colors.gray }}>Eventi Totali</div>
          </div>
          <div
            style={{...styles.card, cursor: 'pointer', transition: 'all 0.3s'}}
            onClick={() => onNavigate('events')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = colors.shadowHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = colors.shadow;
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔜</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: colors.accent }}>
              {stats.upcomingEvents}
            </div>
            <div style={{ color: colors.gray }}>Prossimi Eventi</div>
          </div>
        </div>

        {/* Prossimi Eventi */}
        {upcomingEvents.length > 0 && (
          <div style={styles.card}>
            <h2 style={{ marginBottom: '20px', color: colors.primary }}>📅 Prossimi Eventi</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingEvents.map(event => {
                const team = teams[event.teamId];
                return (
                  <div
                    key={event.id}
                    style={{
                      padding: '16px',
                      border: `2px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onClick={() => onNavigate('event-detail', event.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.backgroundColor = `${colors.primary}05`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.lightGray;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                          {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'} {event.title}
                        </div>
                        <div style={{ color: colors.gray, fontSize: '14px' }}>
                          {team?.name}
                        </div>
                      </div>
                      <Badge
                        text={event.type.toUpperCase()}
                        variant={event.type === 'partita' ? 'danger' : event.type === 'allenamento' ? 'success' : 'primary'}
                      />
                    </div>
                    <div style={{ fontSize: '14px', color: colors.gray }}>
                      📅 {formatDateTime(event.date, event.time)}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.gray }}>
                      📍 {event.location}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu Azioni */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
        }}>
          {(role === 'admin' || role === 'coach') && (
            <>
              <Button
                title="📅 Calendario"
                onPress={() => onNavigate('calendar')}
                variant="primary"
                style={{ padding: '20px', fontSize: '16px' }}
              />
              <Button
                title="📊 Statistiche"
                onPress={() => onNavigate('statistics')}
                variant="secondary"
                style={{ padding: '20px', fontSize: '16px' }}
              />
              <Button
                title="📋 Gestisci Eventi"
                onPress={() => onNavigate('events')}
                variant="primary"
                style={{ padding: '20px', fontSize: '16px' }}
              />
              <Button
                title="➕ Crea Evento"
                onPress={() => onNavigate('create-event')}
                variant="success"
                style={{ padding: '20px', fontSize: '16px' }}
              />
            </>
          )}
          {role === 'admin' && (
            <>
              <Button
                title="🏆 Gestisci Squadre"
                onPress={() => onNavigate('teams')}
                variant="secondary"
                style={{ padding: '20px', fontSize: '16px' }}
              />
              <Button
                title="👥 Gestisci Giocatori"
                onPress={() => onNavigate('players')}
                variant="secondary"
                style={{ padding: '20px', fontSize: '16px' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== EVENTS LIST =====
const EventsList = ({ role, onNavigate, onBack }) => {
  const { events, teams, deleteEvent } = useAppContext();
  const { addNotification } = useNotification();
  const [filter, setFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => {
        if (filter === 'upcoming') return isFuture(e.date);
        if (filter === 'past') return !isFuture(e.date);
        return true;
      })
      .filter(e => teamFilter === 'all' || e.teamId === teamFilter)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events, filter, teamFilter]);

  const handleDelete = (eventId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      deleteEvent(eventId);
      addNotification('Evento eliminato con successo', 'success');
    }
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>📅 Eventi</div>
            <div style={styles.headerSubtitle}>Gestisci tutti gli eventi</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {/* Filtri */}
        <div style={{...styles.card, marginBottom: '24px'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
            <Select
              label="Periodo"
              value={filter}
              onChange={setFilter}
              options={[
                {value: 'all', label: 'Tutti gli eventi'},
                {value: 'upcoming', label: 'Prossimi'},
                {value: 'past', label: 'Passati'},
              ]}
            />
            <Select
              label="Squadra"
              value={teamFilter}
              onChange={setTeamFilter}
              options={[
                {value: 'all', label: 'Tutte le squadre'},
                ...Object.values(teams).map(t => ({value: t.id, label: t.name}))
              ]}
            />
          </div>
        </div>

        {/* Pulsante Crea */}
        {(role === 'admin' || role === 'coach') && (
          <Button
            title="➕ Crea Nuovo Evento"
            onPress={() => onNavigate('create-event')}
            variant="success"
            style={{marginBottom: '24px', width: '100%', padding: '16px'}}
          />
        )}

        {/* Lista Eventi */}
        {filteredEvents.length === 0 ? (
          <div style={{...styles.card, textAlign: 'center', padding: '48px'}}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>📭</div>
            <div style={{fontSize: '18px', color: colors.gray}}>Nessun evento trovato</div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {filteredEvents.map(event => {
              const team = teams[event.teamId];
              const totalResponses = Object.keys(event.responses || {}).length;
              const presenti = Object.values(event.responses || {}).filter(r => r.status === 'presente').length;
              const assenti = Object.values(event.responses || {}).filter(r => r.status === 'assente').length;

              return (
                <div key={event.id} style={styles.card}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                        <div style={{fontSize: '32px'}}>
                          {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'}
                        </div>
                        <div>
                          <div style={{fontSize: '20px', fontWeight: '700'}}>{event.title}</div>
                          <div style={{color: colors.gray, fontSize: '14px'}}>{team?.name}</div>
                        </div>
                      </div>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px'}}>
                        <div style={{fontSize: '14px', color: colors.gray}}>
                          📅 {formatDateTime(event.date, event.time)}
                        </div>
                        <div style={{fontSize: '14px', color: colors.gray}}>
                          📍 {event.location}
                        </div>
                        {event.opponent && (
                          <div style={{fontSize: '14px', color: colors.gray}}>
                            🆚 {event.opponent}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      text={event.type.toUpperCase()}
                      variant={event.type === 'partita' ? 'danger' : event.type === 'allenamento' ? 'success' : 'primary'}
                    />
                  </div>

                  {/* Statistiche Risposte */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: colors.background,
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{flex: 1, textAlign: 'center'}}>
                      <div style={{fontSize: '24px', fontWeight: '700', color: colors.primary}}>
                        {event.convocati?.length || 0}
                      </div>
                      <div style={{fontSize: '12px', color: colors.gray}}>Convocati</div>
                    </div>
                    <div style={{flex: 1, textAlign: 'center'}}>
                      <div style={{fontSize: '24px', fontWeight: '700', color: colors.success}}>
                        {presenti}
                      </div>
                      <div style={{fontSize: '12px', color: colors.gray}}>Presenti</div>
                    </div>
                    <div style={{flex: 1, textAlign: 'center'}}>
                      <div style={{fontSize: '24px', fontWeight: '700', color: colors.danger}}>
                        {assenti}
                      </div>
                      <div style={{fontSize: '12px', color: colors.gray}}>Assenti</div>
                    </div>
                    <div style={{flex: 1, textAlign: 'center'}}>
                      <div style={{fontSize: '24px', fontWeight: '700', color: colors.warning}}>
                        {(event.convocati?.length || 0) - totalResponses}
                      </div>
                      <div style={{fontSize: '12px', color: colors.gray}}>Senza Risposta</div>
                    </div>
                  </div>

                  {/* Azioni */}
                  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                    <Button
                      title="👁️ Dettagli"
                      onPress={() => onNavigate('event-detail', event.id)}
                      variant="primary"
                      style={{flex: 1, minWidth: '120px'}}
                    />
                    {(role === 'admin' || role === 'coach') && (
                      <>
                        <Button
                          title="✏️ Modifica"
                          onPress={() => onNavigate('edit-event', event.id)}
                          variant="secondary"
                          style={{flex: 1, minWidth: '120px'}}
                        />
                        <Button
                          title="🗑️ Elimina"
                          onPress={() => handleDelete(event.id)}
                          variant="danger"
                          style={{flex: 1, minWidth: '120px'}}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== CREATE/EDIT EVENT =====
const CreateEditEvent = ({ role, onNavigate, onBack, eventId = null }) => {
  const { events, teams, players, addEvent, updateEvent } = useAppContext();
  const { addNotification } = useNotification();

  const editingEvent = eventId ? events.find(e => e.id === eventId) : null;

  const [formData, setFormData] = useState({
    teamId: editingEvent?.teamId || '',
    type: editingEvent?.type || 'allenamento',
    title: editingEvent?.title || '',
    date: editingEvent?.date ? new Date(editingEvent.date).toISOString().split('T')[0] : '',
    time: editingEvent?.time || '',
    location: editingEvent?.location || '',
    opponent: editingEvent?.opponent || '',
    description: editingEvent?.description || '',
    convocati: editingEvent?.convocati || [],
  });

  const [errors, setErrors] = useState({});

  const selectedPlayers = formData.teamId ? players[formData.teamId] || [] : [];

  const validate = () => {
    const newErrors = {};
    if (!formData.teamId) newErrors.teamId = 'Seleziona una squadra';
    if (!formData.title) newErrors.title = 'Inserisci un titolo';
    if (!formData.date) newErrors.date = 'Inserisci una data';
    if (!formData.time) newErrors.time = 'Inserisci un orario';
    if (!formData.location) newErrors.location = 'Inserisci un luogo';
    if (formData.type === 'partita' && !formData.opponent) newErrors.opponent = 'Inserisci l\'avversario';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      addNotification('Compila tutti i campi obbligatori', 'error');
      return;
    }

    const eventData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      responses: editingEvent?.responses || {},
    };

    if (editingEvent) {
      updateEvent(eventId, eventData);
      addNotification('Evento aggiornato con successo!', 'success');
    } else {
      const newEvent = {
        ...eventData,
        id: `event_${Date.now()}`,
        createdBy: role,
        createdAt: new Date().toISOString(),
      };
      addEvent(newEvent);
      addNotification('Evento creato con successo!', 'success');
    }

    onNavigate('events');
  };

  const togglePlayer = (playerId) => {
    setFormData(prev => ({
      ...prev,
      convocati: prev.convocati.includes(playerId)
        ? prev.convocati.filter(id => id !== playerId)
        : [...prev.convocati, playerId]
    }));
  };

  const selectAll = () => {
    setFormData(prev => ({
      ...prev,
      convocati: selectedPlayers.map(p => p.id)
    }));
  };

  const deselectAll = () => {
    setFormData(prev => ({
      ...prev,
      convocati: []
    }));
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>
              {editingEvent ? '✏️ Modifica Evento' : '➕ Crea Evento'}
            </div>
            <div style={styles.headerSubtitle}>Inserisci i dettagli dell'evento</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.card}>
          <Select
            label="Squadra"
            value={formData.teamId}
            onChange={(value) => setFormData({...formData, teamId: value, convocati: []})}
            options={Object.values(teams).map(t => ({value: t.id, label: t.name}))}
            required
            error={errors.teamId}
          />

          <Select
            label="Tipo Evento"
            value={formData.type}
            onChange={(value) => setFormData({...formData, type: value})}
            options={[
              {value: 'allenamento', label: '🏃 Allenamento'},
              {value: 'partita', label: '⚽ Partita'},
              {value: 'altro', label: '📋 Altro'},
            ]}
            required
          />

          <Input
            label="Titolo"
            value={formData.title}
            onChange={(value) => setFormData({...formData, title: value})}
            placeholder="Es. Allenamento Tattico"
            required
            error={errors.title}
          />

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
            <Input
              label="Data"
              type="date"
              value={formData.date}
              onChange={(value) => setFormData({...formData, date: value})}
              required
              error={errors.date}
            />
            <Input
              label="Orario"
              type="time"
              value={formData.time}
              onChange={(value) => setFormData({...formData, time: value})}
              required
              error={errors.time}
            />
          </div>

          <Input
            label="Luogo"
            value={formData.location}
            onChange={(value) => setFormData({...formData, location: value})}
            placeholder="Es. Campo Principale"
            required
            error={errors.location}
          />

          {formData.type === 'partita' && (
            <Input
              label="Avversario"
              value={formData.opponent}
              onChange={(value) => setFormData({...formData, opponent: value})}
              placeholder="Es. Juventus FC"
              required={formData.type === 'partita'}
              error={errors.opponent}
            />
          )}

          <Textarea
            label="Descrizione"
            value={formData.description}
            onChange={(value) => setFormData({...formData, description: value})}
            placeholder="Aggiungi dettagli aggiuntivi..."
          />

          {/* Convocati */}
          {formData.teamId && (
            <div style={{marginTop: '24px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <label style={{fontWeight: '600', fontSize: '16px'}}>
                  👥 Convocati ({formData.convocati.length}/{selectedPlayers.length})
                </label>
                <div style={{display: 'flex', gap: '8px'}}>
                  <Button title="Tutti" onPress={selectAll} variant="outline" style={{padding: '8px 16px', fontSize: '12px'}} />
                  <Button title="Nessuno" onPress={deselectAll} variant="outline" style={{padding: '8px 16px', fontSize: '12px'}} />
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
              }}>
                {selectedPlayers.map(player => (
                  <div
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    style={{
                      padding: '12px',
                      border: `2px solid ${formData.convocati.includes(player.id) ? colors.primary : colors.lightGray}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: formData.convocati.includes(player.id) ? `${colors.primary}10` : colors.white,
                      transition: 'all 0.3s',
                    }}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `2px solid ${formData.convocati.includes(player.id) ? colors.primary : colors.gray}`,
                        backgroundColor: formData.convocati.includes(player.id) ? colors.primary : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.white,
                        fontSize: '12px',
                        fontWeight: '700',
                      }}>
                        {formData.convocati.includes(player.id) && '✓'}
                      </div>
                      <div>
                        <div style={{fontWeight: '600', fontSize: '14px'}}>{player.name}</div>
                        <div style={{fontSize: '12px', color: colors.gray}}>#{player.number} - {player.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Azioni */}
          <div style={{display: 'flex', gap: '12px', marginTop: '32px'}}>
            <Button
              title={editingEvent ? '💾 Salva Modifiche' : '➕ Crea Evento'}
              onPress={handleSubmit}
              variant="success"
              style={{flex: 1, padding: '16px'}}
            />
            <Button
              title="Annulla"
              onPress={onBack}
              variant="outline"
              style={{flex: 1, padding: '16px'}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== EVENT DETAIL =====
const EventDetail = ({ role, onNavigate, onBack, eventId }) => {
  const { events, teams, players, deleteEvent, addEventResponse } = useAppContext();
  const { addNotification } = useNotification();

  const event = events.find(e => e.id === eventId);
  const team = event ? teams[event.teamId] : null;
  const teamPlayers = event ? (players[event.teamId] || []) : [];

  if (!event || !team) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={{...styles.card, textAlign: 'center'}}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>❌</div>
            <div style={{fontSize: '18px', marginBottom: '24px'}}>Evento non trovato</div>
            <Button title="← Indietro" onPress={onBack} />
          </div>
        </div>
      </div>
    );
  }

  const convocatiList = teamPlayers.filter(p => event.convocati?.includes(p.id));
  const presenti = convocatiList.filter(p => event.responses[p.id]?.status === 'presente');
  const assenti = convocatiList.filter(p => event.responses[p.id]?.status === 'assente');
  const senzaRisposta = convocatiList.filter(p => !event.responses[p.id]);

  const handleDelete = () => {
    if (window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      deleteEvent(eventId);
      addNotification('Evento eliminato con successo', 'success');
      onNavigate('events');
    }
  };

  const handleWhatsApp = () => {
    const message = generateWhatsAppMessage(event, team, teamPlayers, convocatiList);
    openWhatsApp(message);
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>
              {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'} {event.title}
            </div>
            <div style={styles.headerSubtitle}>{team.name}</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {/* Informazioni Evento */}
        <div style={styles.card}>
          <h2 style={{marginBottom: '20px', color: colors.primary}}>📋 Dettagli Evento</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontWeight: '600', minWidth: '100px'}}>📅 Data:</span>
              <span>{formatDateTime(event.date, event.time)}</span>
              {isToday(event.date) && <Badge text="OGGI" variant="warning" />}
              {isFuture(event.date) && !isToday(event.date) && <Badge text="FUTURO" variant="success" />}
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontWeight: '600', minWidth: '100px'}}>📍 Luogo:</span>
              <span>{event.location}</span>
            </div>
            {event.opponent && (
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontWeight: '600', minWidth: '100px'}}>🆚 Avversario:</span>
                <span>{event.opponent}</span>
              </div>
            )}
            {event.description && (
              <div style={{display: 'flex', alignItems: 'start', gap: '8px'}}>
                <span style={{fontWeight: '600', minWidth: '100px'}}>📝 Note:</span>
                <span>{event.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistiche */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{...styles.card, textAlign: 'center', padding: '20px'}}>
            <div style={{fontSize: '36px', fontWeight: '700', color: colors.primary}}>
              {convocatiList.length}
            </div>
            <div style={{color: colors.gray}}>Convocati</div>
          </div>
          <div style={{...styles.card, textAlign: 'center', padding: '20px'}}>
            <div style={{fontSize: '36px', fontWeight: '700', color: colors.success}}>
              {presenti.length}
            </div>
            <div style={{color: colors.gray}}>Presenti</div>
          </div>
          <div style={{...styles.card, textAlign: 'center', padding: '20px'}}>
            <div style={{fontSize: '36px', fontWeight: '700', color: colors.danger}}>
              {assenti.length}
            </div>
            <div style={{color: colors.gray}}>Assenti</div>
          </div>
          <div style={{...styles.card, textAlign: 'center', padding: '20px'}}>
            <div style={{fontSize: '36px', fontWeight: '700', color: colors.warning}}>
              {senzaRisposta.length}
            </div>
            <div style={{color: colors.gray}}>Senza Risposta</div>
          </div>
        </div>

        {/* Presenti */}
        {presenti.length > 0 && (
          <div style={styles.card}>
            <h3 style={{marginBottom: '16px', color: colors.success}}>✅ Presenti ({presenti.length})</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px'}}>
              {presenti.map(player => (
                <div key={player.id} style={{
                  padding: '12px',
                  border: `2px solid ${colors.success}`,
                  borderRadius: '8px',
                  backgroundColor: `${colors.success}10`,
                }}>
                  <div style={{fontWeight: '600'}}>{player.name}</div>
                  <div style={{fontSize: '12px', color: colors.gray}}>#{player.number} - {player.role}</div>
                  {event.responses[player.id]?.note && (
                    <div style={{fontSize: '12px', marginTop: '4px', fontStyle: 'italic'}}>
                      💬 {event.responses[player.id].note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assenti */}
        {assenti.length > 0 && (
          <div style={styles.card}>
            <h3 style={{marginBottom: '16px', color: colors.danger}}>❌ Assenti ({assenti.length})</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px'}}>
              {assenti.map(player => (
                <div key={player.id} style={{
                  padding: '12px',
                  border: `2px solid ${colors.danger}`,
                  borderRadius: '8px',
                  backgroundColor: `${colors.danger}10`,
                }}>
                  <div style={{fontWeight: '600'}}>{player.name}</div>
                  <div style={{fontSize: '12px', color: colors.gray}}>#{player.number} - {player.role}</div>
                  {event.responses[player.id]?.note && (
                    <div style={{fontSize: '12px', marginTop: '4px', fontStyle: 'italic'}}>
                      💬 {event.responses[player.id].note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Senza Risposta */}
        {senzaRisposta.length > 0 && (
          <div style={styles.card}>
            <h3 style={{marginBottom: '16px', color: colors.warning}}>⏳ Senza Risposta ({senzaRisposta.length})</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px'}}>
              {senzaRisposta.map(player => (
                <div key={player.id} style={{
                  padding: '12px',
                  border: `2px solid ${colors.warning}`,
                  borderRadius: '8px',
                  backgroundColor: `${colors.warning}10`,
                }}>
                  <div style={{fontWeight: '600'}}>{player.name}</div>
                  <div style={{fontSize: '12px', color: colors.gray}}>#{player.number} - {player.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
          <Button
            title="📱 Condividi su WhatsApp"
            onPress={handleWhatsApp}
            variant="success"
            style={{flex: 1, minWidth: '200px', padding: '16px'}}
          />
          {(role === 'admin' || role === 'coach') && (
            <>
              <Button
                title="✏️ Modifica"
                onPress={() => onNavigate('edit-event', eventId)}
                variant="secondary"
                style={{flex: 1, minWidth: '150px', padding: '16px'}}
              />
              <Button
                title="🗑️ Elimina"
                onPress={handleDelete}
                variant="danger"
                style={{flex: 1, minWidth: '150px', padding: '16px'}}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== CALENDAR VIEW =====
const CalendarView = ({ onNavigate, onBack }) => {
  const { events, teams } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthEvents = useMemo(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    return events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  }, [events, currentMonth]);

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>📅 Calendario</div>
            <div style={styles.headerSubtitle}>Visualizza tutti gli eventi</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
            <Button title="← Mese Prec." onPress={previousMonth} variant="outline" />
            <h2 style={{fontSize: '24px', fontWeight: '700', color: colors.primary, textTransform: 'capitalize'}}>
              {monthName}
            </h2>
            <Button title="Mese Succ. →" onPress={nextMonth} variant="outline" />
          </div>

          {monthEvents.length === 0 ? (
            <div style={{textAlign: 'center', padding: '48px'}}>
              <div style={{fontSize: '64px', marginBottom: '16px'}}>📭</div>
              <div style={{fontSize: '18px', color: colors.gray}}>Nessun evento in questo mese</div>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {monthEvents
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(event => {
                  const team = teams[event.teamId];
                  return (
                    <div
                      key={event.id}
                      onClick={() => onNavigate('event-detail', event.id)}
                      style={{
                        padding: '16px',
                        border: `2px solid ${colors.lightGray}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.primary;
                        e.currentTarget.style.backgroundColor = `${colors.primary}05`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.lightGray;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                            <div style={{fontSize: '32px'}}>
                              {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'}
                            </div>
                            <div>
                              <div style={{fontSize: '18px', fontWeight: '700'}}>{event.title}</div>
                              <div style={{fontSize: '14px', color: colors.gray}}>{team?.name}</div>
                            </div>
                          </div>
                          <div style={{display: 'flex', gap: '16px', marginLeft: '44px'}}>
                            <div style={{fontSize: '14px', color: colors.gray}}>
                              📅 {formatDateTime(event.date, event.time)}
                            </div>
                            <div style={{fontSize: '14px', color: colors.gray}}>
                              📍 {event.location}
                            </div>
                          </div>
                        </div>
                        <Badge
                          text={event.type.toUpperCase()}
                          variant={event.type === 'partita' ? 'danger' : event.type === 'allenamento' ? 'success' : 'primary'}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== STATISTICS VIEW =====
const StatisticsView = ({ onBack }) => {
  const { teams, players, events } = useAppContext();
  const [selectedTeam, setSelectedTeam] = useState('all');

  const teamStats = useMemo(() => {
    return Object.values(teams).map(team => {
      const teamPlayers = players[team.id] || [];
      const teamEvents = events.filter(e => e.teamId === team.id);

      return {
        team,
        totalPlayers: teamPlayers.length,
        totalEvents: teamEvents.length,
        upcomingEvents: teamEvents.filter(e => isFuture(e.date)).length,
      };
    });
  }, [teams, players, events]);

  const playerStats = useMemo(() => {
    const selectedPlayers = selectedTeam === 'all'
      ? Object.values(players).flat()
      : (players[selectedTeam] || []);

    return selectedPlayers.map(player => {
      const stats = calculatePlayerStats(player, events);
      return { player, ...stats };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [players, events, selectedTeam]);

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>📊 Statistiche</div>
            <div style={styles.headerSubtitle}>Analisi presenze e performance</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {/* Statistiche Squadre */}
        <div style={styles.card}>
          <h2 style={{marginBottom: '20px', color: colors.primary}}>🏆 Statistiche Squadre</h2>
          <div style={{display: 'grid', gap: '16px'}}>
            {teamStats.map(({ team, totalPlayers, totalEvents, upcomingEvents }) => (
              <div key={team.id} style={{
                padding: '20px',
                border: `2px solid ${colors.lightGray}`,
                borderRadius: '12px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = team.color;
                e.currentTarget.style.backgroundColor = `${team.color}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.lightGray;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                  <div style={{fontSize: '32px'}}>{team.icon}</div>
                  <div>
                    <div style={{fontSize: '20px', fontWeight: '700'}}>{team.name}</div>
                    <div style={{fontSize: '14px', color: colors.gray}}>{team.category}</div>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: colors.background,
                  borderRadius: '8px',
                }}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '28px', fontWeight: '700', color: colors.secondary}}>
                      {totalPlayers}
                    </div>
                    <div style={{fontSize: '12px', color: colors.gray}}>Giocatori</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '28px', fontWeight: '700', color: colors.primary}}>
                      {totalEvents}
                    </div>
                    <div style={{fontSize: '12px', color: colors.gray}}>Eventi Totali</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '28px', fontWeight: '700', color: colors.success}}>
                      {upcomingEvents}
                    </div>
                    <div style={{fontSize: '12px', color: colors.gray}}>Prossimi</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiche Giocatori */}
        <div style={styles.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{color: colors.primary, margin: 0}}>👥 Statistiche Giocatori</h2>
            <Select
              value={selectedTeam}
              onChange={setSelectedTeam}
              options={[
                {value: 'all', label: 'Tutte le squadre'},
                ...Object.values(teams).map(t => ({value: t.id, label: t.name}))
              ]}
            />
          </div>

          {playerStats.length === 0 ? (
            <div style={{textAlign: 'center', padding: '48px'}}>
              <div style={{fontSize: '64px', marginBottom: '16px'}}>👤</div>
              <div style={{fontSize: '18px', color: colors.gray}}>Nessun giocatore trovato</div>
            </div>
          ) : (
            <div style={{display: 'grid', gap: '12px'}}>
              {playerStats.map(({ player, total, presenti, assenti, percentage }) => (
                <div key={player.id} style={{
                  padding: '16px',
                  border: `2px solid ${colors.lightGray}`,
                  borderRadius: '8px',
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>
                        {player.name}
                      </div>
                      <div style={{fontSize: '14px', color: colors.gray}}>
                        #{player.number} - {player.role}
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '24px', alignItems: 'center'}}>
                      <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '20px', fontWeight: '700', color: colors.primary}}>
                          {total}
                        </div>
                        <div style={{fontSize: '11px', color: colors.gray}}>Totali</div>
                      </div>
                      <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '20px', fontWeight: '700', color: colors.success}}>
                          {presenti}
                        </div>
                        <div style={{fontSize: '11px', color: colors.gray}}>Presenti</div>
                      </div>
                      <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '20px', fontWeight: '700', color: colors.danger}}>
                          {assenti}
                        </div>
                        <div style={{fontSize: '11px', color: colors.gray}}>Assenti</div>
                      </div>
                      <div style={{textAlign: 'center'}}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: percentage >= 80 ? colors.success :
                                 percentage >= 50 ? colors.warning : colors.danger
                        }}>
                          {percentage}%
                        </div>
                        <div style={{fontSize: '11px', color: colors.gray}}>Presenze</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== TEAMS LIST =====
const TeamsList = ({ onNavigate, onBack }) => {
  const { teams, players, deleteTeam, addTeam, updateTeam } = useAppContext();
  const { addNotification } = useNotification();
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', color: colors.primary, icon: '⚽' });

  const icons = ['⚽', '🏆', '⭐', '🔥', '⚡', '💪', '🎯', '👑', '🏅', '💎'];
  const colorOptions = [
    { value: colors.primary, label: 'Azzurro' },
    { value: colors.secondary, label: 'Blu' },
    { value: colors.accent, label: 'Arancione' },
    { value: colors.success, label: 'Verde' },
    { value: colors.danger, label: 'Rosso' },
  ];

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      addNotification('Compila tutti i campi', 'error');
      return;
    }

    if (editingTeam) {
      updateTeam(editingTeam.id, formData);
      addNotification('Squadra aggiornata!', 'success');
    } else {
      const newTeam = { ...formData, id: `team_${Date.now()}` };
      addTeam(newTeam);
      addNotification('Squadra creata!', 'success');
    }

    setShowForm(false);
    setEditingTeam(null);
    setFormData({ name: '', category: '', color: colors.primary, icon: '⚽' });
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, category: team.category, color: team.color, icon: team.icon });
    setShowForm(true);
  };

  const handleDelete = (teamId) => {
    if (window.confirm('Eliminare questa squadra? Verranno eliminati anche tutti i giocatori e gli eventi associati.')) {
      deleteTeam(teamId);
      addNotification('Squadra eliminata', 'success');
    }
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>🏆 Squadre</div>
            <div style={styles.headerSubtitle}>Gestisci le squadre</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {!showForm && (
          <Button
            title="➕ Crea Nuova Squadra"
            onPress={() => setShowForm(true)}
            variant="success"
            style={{marginBottom: '24px', width: '100%', padding: '16px'}}
          />
        )}

        {showForm && (
          <div style={styles.card}>
            <h3 style={{marginBottom: '20px', color: colors.primary}}>
              {editingTeam ? '✏️ Modifica Squadra' : '➕ Nuova Squadra'}
            </h3>
            <Input
              label="Nome Squadra"
              value={formData.name}
              onChange={(value) => setFormData({...formData, name: value})}
              placeholder="Es. Prima Squadra"
              required
            />
            <Input
              label="Categoria"
              value={formData.category}
              onChange={(value) => setFormData({...formData, category: value})}
              placeholder="Es. Seniores, Under 19, ecc."
              required
            />
            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                Icona
              </label>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                {icons.map(icon => (
                  <div
                    key={icon}
                    onClick={() => setFormData({...formData, icon})}
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      border: `2px solid ${formData.icon === icon ? colors.primary : colors.lightGray}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: formData.icon === icon ? `${colors.primary}10` : colors.white,
                    }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            <Select
              label="Colore"
              value={formData.color}
              onChange={(value) => setFormData({...formData, color: value})}
              options={colorOptions}
            />
            <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
              <Button
                title={editingTeam ? '💾 Salva' : '➕ Crea'}
                onPress={handleSubmit}
                variant="success"
                style={{flex: 1}}
              />
              <Button
                title="Annulla"
                onPress={() => {
                  setShowForm(false);
                  setEditingTeam(null);
                  setFormData({ name: '', category: '', color: colors.primary, icon: '⚽' });
                }}
                variant="outline"
                style={{flex: 1}}
              />
            </div>
          </div>
        )}

        <div style={{display: 'grid', gap: '16px'}}>
          {Object.values(teams).map(team => {
            const teamPlayers = players[team.id] || [];
            return (
              <div key={team.id} style={styles.card}>
                <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px'}}>
                  <div style={{
                    fontSize: '48px',
                    width: '64px',
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    backgroundColor: `${team.color}20`,
                  }}>
                    {team.icon}
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: '24px', fontWeight: '700'}}>{team.name}</div>
                    <div style={{fontSize: '14px', color: colors.gray}}>{team.category}</div>
                    <div style={{fontSize: '14px', color: colors.gray, marginTop: '4px'}}>
                      👥 {teamPlayers.length} giocatori
                    </div>
                  </div>
                </div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <Button
                    title="✏️ Modifica"
                    onPress={() => handleEdit(team)}
                    variant="secondary"
                    style={{flex: 1}}
                  />
                  <Button
                    title="🗑️ Elimina"
                    onPress={() => handleDelete(team.id)}
                    variant="danger"
                    style={{flex: 1}}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ===== PLAYERS LIST =====
const PlayersList = ({ onNavigate, onBack }) => {
  const { teams, players, addPlayer, updatePlayer, deletePlayer } = useAppContext();
  const { addNotification } = useNotification();
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', number: '', phone: '', email: '' });

  const roles = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];

  const handleSubmit = () => {
    if (!selectedTeam) {
      addNotification('Seleziona una squadra', 'error');
      return;
    }
    if (!formData.name || !formData.role || !formData.number) {
      addNotification('Compila i campi obbligatori', 'error');
      return;
    }

    if (editingPlayer) {
      updatePlayer(selectedTeam, editingPlayer.id, formData);
      addNotification('Giocatore aggiornato!', 'success');
    } else {
      const newPlayer = { ...formData, id: `player_${Date.now()}` };
      addPlayer(selectedTeam, newPlayer);
      addNotification('Giocatore aggiunto!', 'success');
    }

    setShowForm(false);
    setEditingPlayer(null);
    setFormData({ name: '', role: '', number: '', phone: '', email: '' });
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      role: player.role,
      number: player.number,
      phone: player.phone || '',
      email: player.email || ''
    });
    setShowForm(true);
  };

  const handleDelete = (playerId) => {
    if (window.confirm('Eliminare questo giocatore?')) {
      deletePlayer(selectedTeam, playerId);
      addNotification('Giocatore eliminato', 'success');
    }
  };

  const teamPlayers = selectedTeam ? (players[selectedTeam] || []) : [];

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>👥 Giocatori</div>
            <div style={styles.headerSubtitle}>Gestisci i giocatori</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.card}>
          <Select
            label="Seleziona Squadra"
            value={selectedTeam}
            onChange={setSelectedTeam}
            options={Object.values(teams).map(t => ({value: t.id, label: t.name}))}
            required
          />
        </div>

        {selectedTeam && !showForm && (
          <Button
            title="➕ Aggiungi Giocatore"
            onPress={() => setShowForm(true)}
            variant="success"
            style={{marginBottom: '24px', width: '100%', padding: '16px'}}
          />
        )}

        {selectedTeam && showForm && (
          <div style={styles.card}>
            <h3 style={{marginBottom: '20px', color: colors.primary}}>
              {editingPlayer ? '✏️ Modifica Giocatore' : '➕ Nuovo Giocatore'}
            </h3>
            <Input
              label="Nome e Cognome"
              value={formData.name}
              onChange={(value) => setFormData({...formData, name: value})}
              placeholder="Es. Mario Rossi"
              required
            />
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px'}}>
              <Select
                label="Ruolo"
                value={formData.role}
                onChange={(value) => setFormData({...formData, role: value})}
                options={roles.map(r => ({value: r, label: r}))}
                required
              />
              <Input
                label="Numero"
                type="number"
                value={formData.number}
                onChange={(value) => setFormData({...formData, number: value})}
                placeholder="Es. 10"
                required
              />
            </div>
            <Input
              label="Telefono"
              type="tel"
              value={formData.phone}
              onChange={(value) => setFormData({...formData, phone: value})}
              placeholder="Es. 333-1234567"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => setFormData({...formData, email: value})}
              placeholder="Es. mario@email.it"
            />
            <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
              <Button
                title={editingPlayer ? '💾 Salva' : '➕ Aggiungi'}
                onPress={handleSubmit}
                variant="success"
                style={{flex: 1}}
              />
              <Button
                title="Annulla"
                onPress={() => {
                  setShowForm(false);
                  setEditingPlayer(null);
                  setFormData({ name: '', role: '', number: '', phone: '', email: '' });
                }}
                variant="outline"
                style={{flex: 1}}
              />
            </div>
          </div>
        )}

        {selectedTeam && teamPlayers.length === 0 && !showForm && (
          <div style={{...styles.card, textAlign: 'center', padding: '48px'}}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>👤</div>
            <div style={{fontSize: '18px', color: colors.gray}}>Nessun giocatore in questa squadra</div>
          </div>
        )}

        {selectedTeam && teamPlayers.length > 0 && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px'}}>
            {teamPlayers
              .sort((a, b) => parseInt(a.number) - parseInt(b.number))
              .map(player => (
                <div key={player.id} style={styles.card}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary,
                      color: colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: '700',
                    }}>
                      {player.number}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: '700', fontSize: '16px'}}>{player.name}</div>
                      <div style={{fontSize: '14px', color: colors.gray}}>{player.role}</div>
                    </div>
                  </div>
                  {(player.phone || player.email) && (
                    <div style={{fontSize: '12px', color: colors.gray, marginBottom: '12px'}}>
                      {player.phone && <div>📱 {player.phone}</div>}
                      {player.email && <div>📧 {player.email}</div>}
                    </div>
                  )}
                  <div style={{display: 'flex', gap: '8px'}}>
                    <Button
                      title="✏️"
                      onPress={() => handleEdit(player)}
                      variant="secondary"
                      style={{flex: 1, padding: '8px'}}
                    />
                    <Button
                      title="🗑️"
                      onPress={() => handleDelete(player.id)}
                      variant="danger"
                      style={{flex: 1, padding: '8px'}}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== PLAYER EVENTS (For Player Role) =====
const PlayerEvents = ({ playerId, onBack }) => {
  const { events, teams, players, addEventResponse } = useAppContext();
  const { addNotification } = useNotification();

  // In una vera app, playerId sarebbe l'ID del giocatore loggato
  // Per demo, usiamo il primo giocatore disponibile
  const demoPlayerId = playerId || Object.values(players).flat()[0]?.id;
  const demoPlayer = Object.values(players).flat().find(p => p.id === demoPlayerId);

  const playerEvents = useMemo(() => {
    return events
      .filter(e => e.convocati?.includes(demoPlayerId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events, demoPlayerId]);

  const handleResponse = (eventId, status, note = '') => {
    addEventResponse(eventId, demoPlayerId, { status, note });
    addNotification(`Risposta registrata: ${status === 'presente' ? 'Presente' : 'Assente'}`, 'success');
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>⚽ Le Mie Convocazioni</div>
            <div style={styles.headerSubtitle}>
              {demoPlayer ? `${demoPlayer.name} - #${demoPlayer.number}` : 'Giocatore'}
            </div>
          </div>
          <Button title="Esci" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {playerEvents.length === 0 ? (
          <div style={{...styles.card, textAlign: 'center', padding: '48px'}}>
            <div style={{fontSize: '64px', marginBottom: '16px'}}>📭</div>
            <div style={{fontSize: '18px', color: colors.gray}}>Nessuna convocazione</div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {playerEvents.map(event => {
              const team = teams[event.teamId];
              const response = event.responses[demoPlayerId];
              const hasResponded = !!response;

              return (
                <div key={event.id} style={styles.card}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                        <div style={{fontSize: '32px'}}>
                          {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'}
                        </div>
                        <div>
                          <div style={{fontSize: '20px', fontWeight: '700'}}>{event.title}</div>
                          <div style={{fontSize: '14px', color: colors.gray}}>{team?.name}</div>
                        </div>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '44px'}}>
                        <div style={{fontSize: '14px', color: colors.gray}}>
                          📅 {formatDateTime(event.date, event.time)}
                        </div>
                        <div style={{fontSize: '14px', color: colors.gray}}>
                          📍 {event.location}
                        </div>
                        {event.opponent && (
                          <div style={{fontSize: '14px', color: colors.gray}}>
                            🆚 {event.opponent}
                          </div>
                        )}
                        {event.description && (
                          <div style={{fontSize: '14px', color: colors.gray, marginTop: '4px'}}>
                            📝 {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end'}}>
                      <Badge
                        text={event.type.toUpperCase()}
                        variant={event.type === 'partita' ? 'danger' : event.type === 'allenamento' ? 'success' : 'primary'}
                      />
                      {isToday(event.date) && <Badge text="OGGI" variant="warning" />}
                      {isFuture(event.date) && !isToday(event.date) && <Badge text="FUTURO" variant="success" />}
                    </div>
                  </div>

                  {hasResponded ? (
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: response.status === 'presente' ? `${colors.success}20` : `${colors.danger}20`,
                      border: `2px solid ${response.status === 'presente' ? colors.success : colors.danger}`,
                    }}>
                      <div style={{fontWeight: '700', marginBottom: '8px'}}>
                        {response.status === 'presente' ? '✅ Confermato Presente' : '❌ Confermato Assente'}
                      </div>
                      {response.note && (
                        <div style={{fontSize: '14px', color: colors.gray}}>
                          💬 {response.note}
                        </div>
                      )}
                      <div style={{fontSize: '12px', color: colors.gray, marginTop: '8px'}}>
                        Risposto il {formatDateTime(response.respondedAt, new Date(response.respondedAt).toTimeString())}
                      </div>
                    </div>
                  ) : (
                    <div style={{display: 'flex', gap: '12px'}}>
                      <Button
                        title="✅ Sarò Presente"
                        onPress={() => handleResponse(event.id, 'presente')}
                        variant="success"
                        style={{flex: 1, padding: '16px'}}
                      />
                      <Button
                        title="❌ Sarò Assente"
                        onPress={() => handleResponse(event.id, 'assente')}
                        variant="danger"
                        style={{flex: 1, padding: '16px'}}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== MAIN APP =====
const App = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [currentRole, setCurrentRole] = useState('');
  const [screenData, setScreenData] = useState(null);

  const handleLogin = (role) => {
    setCurrentRole(role);
    if (role === 'player') {
      setCurrentScreen('my-events');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentRole('');
    setCurrentScreen('login');
    setScreenData(null);
  };

  const handleNavigate = (screen, data = null) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const handleBack = () => {
    if (currentRole === 'player') {
      setCurrentScreen('my-events');
    } else {
      setCurrentScreen('dashboard');
    }
    setScreenData(null);
  };

  return (
    <>
      {currentScreen === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      {currentScreen === 'dashboard' && (
        <Dashboard role={currentRole} onNavigate={handleNavigate} onLogout={handleLogout} />
      )}
      {currentScreen === 'events' && (
        <EventsList role={currentRole} onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {currentScreen === 'create-event' && (
        <CreateEditEvent role={currentRole} onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {currentScreen === 'edit-event' && (
        <CreateEditEvent role={currentRole} onNavigate={handleNavigate} onBack={handleBack} eventId={screenData} />
      )}
      {currentScreen === 'event-detail' && (
        <EventDetail role={currentRole} onNavigate={handleNavigate} onBack={handleBack} eventId={screenData} />
      )}
      {currentScreen === 'calendar' && (
        <CalendarView onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {currentScreen === 'statistics' && (
        <StatisticsView onBack={handleBack} />
      )}
      {currentScreen === 'teams' && (
        <TeamsList onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {currentScreen === 'players' && (
        <PlayersList onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {currentScreen === 'my-events' && (
        <PlayerEvents playerId={screenData} onBack={handleLogout} />
      )}
    </>
  );
};

export default () => (
  <NotificationProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </NotificationProvider>
);
