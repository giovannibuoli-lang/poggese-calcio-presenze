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

// ===== STYLED COMPONENTS =====
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: colors.background,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: '20px',
    boxShadow: colors.shadow,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: colors.shadow,
    transition: 'all 0.3s ease',
  },
  cardHover: {
    boxShadow: colors.shadowHover,
    transform: 'translateY(-2px)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: colors.black,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    color: colors.white,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
    color: colors.white,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    color: colors.white,
  },
  buttonWarning: {
    backgroundColor: colors.warning,
    color: colors.white,
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${colors.lightGray}`,
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${colors.lightGray}`,
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    backgroundColor: colors.white,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${colors.lightGray}`,
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    minHeight: '100px',
    fontFamily: 'inherit',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    fontSize: '14px',
    color: colors.black,
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: colors.shadowHover,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
  },
  statCard: {
    backgroundColor: colors.cardBg,
    borderRadius: '12px',
    padding: '20px',
    boxShadow: colors.shadow,
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: colors.gray,
  },
};

// ===== BASIC UI COMPONENTS =====
const Button = ({ children, onClick, variant = 'primary', disabled = false, style = {} }) => {
  const variantStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    success: styles.buttonSuccess,
    danger: styles.buttonDanger,
    warning: styles.buttonWarning,
  };

  return (
    <button
      style={{ ...styles.button, ...variantStyles[variant], ...style, opacity: disabled ? 0.5 : 1 }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder = '', required = false, ...props }) => {
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={styles.label}>{label} {required && '*'}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={styles.input}
        required={required}
        {...props}
      />
    </div>
  );
};

const Select = ({ label, value, onChange, options, required = false, ...props }) => {
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={styles.label}>{label} {required && '*'}</label>}
      <select
        value={value}
        onChange={onChange}
        style={styles.select}
        required={required}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

const Textarea = ({ label, value, onChange, placeholder = '', required = false, rows = 4 }) => {
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && <label style={styles.label}>{label} {required && '*'}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={styles.textarea}
        rows={rows}
        required={required}
      />
    </div>
  );
};

const Badge = ({ children, color = colors.primary, style = {} }) => {
  return (
    <span style={{ ...styles.badge, backgroundColor: color, color: colors.white, ...style }}>
      {children}
    </span>
  );
};

// ===== LOGIN SCREEN =====
const LoginScreen = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleLogin = () => {
    if (selectedRole && (selectedRole !== 'player' || playerName)) {
      onLogin(selectedRole, playerName);
    }
  };

  return (
    <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...styles.card, maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>⚽ Presenze Calcio</h1>
        <p style={{ color: colors.gray, marginBottom: '32px' }}>Gestione convocazioni e presenze</p>

        <Select
          label="Seleziona il tuo ruolo"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          options={[
            { value: '', label: 'Seleziona...' },
            { value: 'admin', label: '👤 Amministratore' },
            { value: 'coach', label: '⚽ Allenatore' },
            { value: 'player', label: '🏃 Giocatore' },
          ]}
          required
        />

        {selectedRole === 'player' && (
          <Input
            label="Nome Giocatore"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Inserisci il tuo nome"
            required
          />
        )}

        <Button
          onClick={handleLogin}
          disabled={!selectedRole || (selectedRole === 'player' && !playerName)}
          style={{ width: '100%', marginTop: '16px' }}
        >
          Accedi
        </Button>
      </div>
    </div>
  );
};

// ===== DASHBOARD =====
const Dashboard = ({ userRole }) => {
  const { teams, players, events } = useAppContext();
  const [activeView, setActiveView] = useState('events');

  const totalTeams = Object.keys(teams).length;
  const totalPlayers = Object.values(players).reduce((acc, teamPlayers) => acc + teamPlayers.length, 0);
  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => isFuture(e.date)).length;

  const renderView = () => {
    switch (activeView) {
      case 'events':
        return <EventsList userRole={userRole} />;
      case 'calendar':
        return <CalendarView />;
      case 'statistics':
        return <StatisticsView />;
      case 'teams':
        return <TeamsList />;
      case 'players':
        return <PlayersList />;
      default:
        return <EventsList userRole={userRole} />;
    }
  };

  return (
    <>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          <span>⚽</span>
          <span>Presenze Calcio</span>
        </h1>
        <div style={styles.headerActions}>
          <Button onClick={() => setActiveView('events')} variant={activeView === 'events' ? 'primary' : 'secondary'}>
            📋 Eventi
          </Button>
          <Button onClick={() => setActiveView('calendar')} variant={activeView === 'calendar' ? 'primary' : 'secondary'}>
            📅 Calendario
          </Button>
          <Button onClick={() => setActiveView('statistics')} variant={activeView === 'statistics' ? 'primary' : 'secondary'}>
            📊 Statistiche
          </Button>
          {(userRole === 'admin' || userRole === 'coach') && (
            <>
              <Button onClick={() => setActiveView('teams')} variant={activeView === 'teams' ? 'primary' : 'secondary'}>
                🏆 Squadre
              </Button>
              <Button onClick={() => setActiveView('players')} variant={activeView === 'players' ? 'primary' : 'secondary'}>
                👥 Giocatori
              </Button>
            </>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.primary}` }}>
            <div style={{ ...styles.statValue, color: colors.primary }}>{totalTeams}</div>
            <div style={styles.statLabel}>Squadre</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.secondary}` }}>
            <div style={{ ...styles.statValue, color: colors.secondary }}>{totalPlayers}</div>
            <div style={styles.statLabel}>Giocatori</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.success}` }}>
            <div style={{ ...styles.statValue, color: colors.success }}>{totalEvents}</div>
            <div style={styles.statLabel}>Eventi Totali</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.accent}` }}>
            <div style={{ ...styles.statValue, color: colors.accent }}>{upcomingEvents}</div>
            <div style={styles.statLabel}>Prossimi Eventi</div>
          </div>
        </div>

        {/* Main Content */}
        {renderView()}
      </div>
    </>
  );
};

// ===== EVENTS LIST =====
const EventsList = ({ userRole }) => {
  const { events, teams } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, past

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (filter === 'upcoming') {
      filtered = filtered.filter(e => isFuture(e.date));
    } else if (filter === 'past') {
      filtered = filtered.filter(e => !isFuture(e.date));
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events, filter]);

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📋 Eventi</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'all', label: 'Tutti' },
              { value: 'upcoming', label: 'Prossimi' },
              { value: 'past', label: 'Passati' },
            ]}
            style={{ marginBottom: 0 }}
          />
          {(userRole === 'admin' || userRole === 'coach') && (
            <Button onClick={handleCreateEvent}>
              ➕ Nuovo Evento
            </Button>
          )}
        </div>
      </div>

      <div style={styles.grid}>
        {filteredEvents.map(event => {
          const team = teams[event.teamId];
          const convocatiCount = event.convocati?.length || 0;
          const responsesCount = Object.keys(event.responses || {}).length;
          const presentiCount = Object.values(event.responses || {}).filter(r => r.status === 'presente').length;

          return (
            <div
              key={event.id}
              style={styles.card}
              onClick={() => handleEditEvent(event)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                    {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{event.title}</h3>
                </div>
                <Badge color={isFuture(event.date) ? colors.success : colors.gray}>
                  {isFuture(event.date) ? 'Prossimo' : 'Passato'}
                </Badge>
              </div>

              {team && (
                <div style={{ marginBottom: '8px', color: colors.gray, fontSize: '14px' }}>
                  🏆 {team.name}
                </div>
              )}

              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                📅 {formatDate(event.date)} alle {formatTime(event.time)}
              </div>

              <div style={{ marginBottom: '8px', fontSize: '14px', color: colors.gray }}>
                📍 {event.location}
              </div>

              {event.opponent && (
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  🆚 {event.opponent}
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', fontSize: '14px' }}>
                <span>👥 Convocati: {convocatiCount}</span>
                <span>✅ Presenti: {presentiCount}</span>
                <span>💬 Risposte: {responsesCount}/{convocatiCount}</span>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div style={{ ...styles.card, textAlign: 'center', gridColumn: '1 / -1' }}>
            <p style={{ color: colors.gray }}>Nessun evento trovato</p>
          </div>
        )}
      </div>

      {showModal && (
        <CreateEditEvent
          event={selectedEvent}
          onClose={handleCloseModal}
          userRole={userRole}
        />
      )}
    </>
  );
};

// ===== CREATE/EDIT EVENT =====
const CreateEditEvent = ({ event, onClose, userRole }) => {
  const { teams, players, addEvent, updateEvent, deleteEvent } = useAppContext();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({
    teamId: event?.teamId || Object.keys(teams)[0] || '',
    type: event?.type || 'allenamento',
    title: event?.title || '',
    date: event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
    time: event?.time || '',
    location: event?.location || '',
    opponent: event?.opponent || '',
    description: event?.description || '',
    convocati: event?.convocati || [],
  });

  const teamPlayers = formData.teamId ? players[formData.teamId] || [] : [];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlayerToggle = (playerId) => {
    setFormData(prev => ({
      ...prev,
      convocati: prev.convocati.includes(playerId)
        ? prev.convocati.filter(id => id !== playerId)
        : [...prev.convocati, playerId]
    }));
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      convocati: teamPlayers.map(p => p.id)
    }));
  };

  const handleDeselectAll = () => {
    setFormData(prev => ({ ...prev, convocati: [] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.teamId || !formData.title || !formData.date || !formData.time || !formData.location) {
      addNotification('Compila tutti i campi obbligatori', 'error');
      return;
    }

    const eventData = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      id: event?.id || `e${Date.now()}`,
      responses: event?.responses || {},
      createdBy: event?.createdBy || 'admin',
      createdAt: event?.createdAt || new Date().toISOString(),
    };

    if (event) {
      updateEvent(event.id, eventData);
      addNotification('Evento aggiornato con successo', 'success');
    } else {
      addEvent(eventData);
      addNotification('Evento creato con successo', 'success');
    }

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      deleteEvent(event.id);
      addNotification('Evento eliminato', 'success');
      onClose();
    }
  };

  const handleSendWhatsApp = () => {
    const team = teams[formData.teamId];
    const convocatiList = teamPlayers.filter(p => formData.convocati.includes(p.id));
    const message = generateWhatsAppMessage({ ...formData, date: new Date(formData.date) }, team, teamPlayers, convocatiList);
    openWhatsApp(message);
    addNotification('Apertura WhatsApp...', 'info');
  };

  if (event && userRole === 'player') {
    return <EventDetail event={event} onClose={onClose} />;
  }

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{event ? 'Modifica Evento' : 'Nuovo Evento'}</h2>
          <Button onClick={onClose} variant="secondary" style={{ padding: '8px 16px' }}>
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Select
            label="Squadra"
            value={formData.teamId}
            onChange={(e) => handleChange('teamId', e.target.value)}
            options={[
              { value: '', label: 'Seleziona squadra...' },
              ...Object.values(teams).map(t => ({ value: t.id, label: `${t.icon} ${t.name}` }))
            ]}
            required
          />

          <Select
            label="Tipo"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            options={[
              { value: 'allenamento', label: '🏃 Allenamento' },
              { value: 'partita', label: '⚽ Partita' },
              { value: 'altro', label: '📋 Altro' },
            ]}
            required
          />

          <Input
            label="Titolo"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Es: Allenamento Tattico"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Data"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
            <Input
              label="Ora"
              type="time"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              required
            />
          </div>

          <Input
            label="Luogo"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Es: Campo Principale"
            required
          />

          {formData.type === 'partita' && (
            <Input
              label="Avversario"
              value={formData.opponent}
              onChange={(e) => handleChange('opponent', e.target.value)}
              placeholder="Es: Juventus FC"
            />
          )}

          <Textarea
            label="Descrizione"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Note aggiuntive..."
          />

          {/* Convocati */}
          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Convocati ({formData.convocati.length}/{teamPlayers.length})</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <Button type="button" onClick={handleSelectAll} variant="success" style={{ padding: '8px 16px' }}>
                Seleziona Tutti
              </Button>
              <Button type="button" onClick={handleDeselectAll} variant="secondary" style={{ padding: '8px 16px' }}>
                Deseleziona Tutti
              </Button>
            </div>
            <div style={{ maxHeight: '200px', overflow: 'auto', border: `1px solid ${colors.lightGray}`, borderRadius: '8px', padding: '12px' }}>
              {teamPlayers.map(player => (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.convocati.includes(player.id)}
                    onChange={() => handlePlayerToggle(player.id)}
                    style={{ marginRight: '8px' }}
                  />
                  <span>{player.name} (#{player.number}) - {player.role}</span>
                </div>
              ))}
              {teamPlayers.length === 0 && (
                <p style={{ color: colors.gray, margin: 0 }}>Nessun giocatore disponibile</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" style={{ flex: 1 }}>
              {event ? 'Aggiorna' : 'Crea'} Evento
            </Button>
            {event && formData.convocati.length > 0 && (
              <Button type="button" onClick={handleSendWhatsApp} variant="success">
                📱 WhatsApp
              </Button>
            )}
            {event && (
              <Button type="button" onClick={handleDelete} variant="danger">
                🗑️ Elimina
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== EVENT DETAIL (Player View) =====
const EventDetail = ({ event, onClose }) => {
  const { teams, players, addEventResponse } = useAppContext();
  const { addNotification } = useNotification();
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [response, setResponse] = useState('');
  const [note, setNote] = useState('');

  const team = teams[event.teamId];
  const teamPlayers = players[event.teamId] || [];
  const convocatiList = teamPlayers.filter(p => event.convocati?.includes(p.id));

  const handleSubmitResponse = (e) => {
    e.preventDefault();

    if (!selectedPlayer || !response) {
      addNotification('Seleziona un giocatore e una risposta', 'error');
      return;
    }

    addEventResponse(event.id, selectedPlayer, { status: response, note });
    addNotification('Risposta inviata con successo', 'success');
    setSelectedPlayer('');
    setResponse('');
    setNote('');
  };

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'} {event.title}
          </h2>
          <Button onClick={onClose} variant="secondary" style={{ padding: '8px 16px' }}>
            ✕
          </Button>
        </div>

        {/* Event Info */}
        <div style={{ marginBottom: '24px' }}>
          {team && <p><strong>🏆 Squadra:</strong> {team.name}</p>}
          <p><strong>📅 Data:</strong> {formatDate(event.date)} alle {formatTime(event.time)}</p>
          <p><strong>📍 Luogo:</strong> {event.location}</p>
          {event.opponent && <p><strong>🆚 Avversario:</strong> {event.opponent}</p>}
          {event.description && <p><strong>📝 Descrizione:</strong> {event.description}</p>}
        </div>

        {/* Convocati List */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '12px' }}>👥 Convocati ({convocatiList.length})</h3>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {convocatiList.map(player => {
              const playerResponse = event.responses?.[player.id];
              return (
                <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: `1px solid ${colors.lightGray}` }}>
                  <span>{player.name} (#{player.number})</span>
                  {playerResponse && (
                    <Badge color={
                      playerResponse.status === 'presente' ? colors.success :
                      playerResponse.status === 'assente' ? colors.danger :
                      colors.warning
                    }>
                      {playerResponse.status === 'presente' ? '✅ Presente' :
                       playerResponse.status === 'assente' ? '❌ Assente' :
                       '❓ Forse'}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Response Form */}
        <form onSubmit={handleSubmitResponse}>
          <h3 style={{ marginBottom: '12px' }}>💬 Rispondi alla Convocazione</h3>

          <Select
            label="Seleziona Giocatore"
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            options={[
              { value: '', label: 'Seleziona...' },
              ...convocatiList.map(p => ({ value: p.id, label: `${p.name} (#${p.number})` }))
            ]}
            required
          />

          <Select
            label="Risposta"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            options={[
              { value: '', label: 'Seleziona...' },
              { value: 'presente', label: '✅ Sarò presente' },
              { value: 'assente', label: '❌ Non posso partecipare' },
              { value: 'forse', label: '❓ Forse' },
            ]}
            required
          />

          <Textarea
            label="Note (opzionale)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Eventuali note..."
            rows={3}
          />

          <Button type="submit" style={{ width: '100%' }}>
            Invia Risposta
          </Button>
        </form>
      </div>
    </div>
  );
};

// ===== CALENDAR VIEW =====
const CalendarView = () => {
  const { events, teams } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthEvents = useMemo(() => {
    return events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  }, [events, month, year]);

  const getEventsForDay = (day) => {
    return monthEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getDate() === day;
    });
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📅 Calendario</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button onClick={previousMonth} variant="secondary">←</Button>
          <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '150px', textAlign: 'center' }}>
            {monthNames[month]} {year}
          </span>
          <Button onClick={nextMonth} variant="secondary">→</Button>
        </div>
      </div>

      <div style={styles.card}>
        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {dayNames.map(day => (
            <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '8px', color: colors.gray }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} style={{ minHeight: '80px', backgroundColor: colors.lightGray, borderRadius: '4px' }} />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = getEventsForDay(day);
            const isCurrentDay = isToday(new Date(year, month, day));

            return (
              <div
                key={day}
                style={{
                  minHeight: '80px',
                  padding: '4px',
                  backgroundColor: isCurrentDay ? colors.primaryLight : colors.white,
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: isCurrentDay ? colors.white : colors.black }}>
                  {day}
                </div>
                {dayEvents.map(event => {
                  const team = teams[event.teamId];
                  return (
                    <div
                      key={event.id}
                      style={{
                        fontSize: '10px',
                        padding: '2px 4px',
                        marginBottom: '2px',
                        backgroundColor: team?.color || colors.secondary,
                        color: colors.white,
                        borderRadius: '3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={`${event.title} - ${formatTime(event.time)}`}
                    >
                      {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'} {formatTime(event.time)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Events Legend */}
      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h3 style={{ marginBottom: '12px' }}>📋 Eventi del Mese ({monthEvents.length})</h3>
        {monthEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).map(event => {
              const team = teams[event.teamId];
              return (
                <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', backgroundColor: colors.background, borderRadius: '6px' }}>
                  <span style={{ fontSize: '20px' }}>
                    {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{event.title}</div>
                    <div style={{ fontSize: '14px', color: colors.gray }}>
                      {formatDate(event.date)} alle {formatTime(event.time)} - {event.location}
                    </div>
                  </div>
                  {team && (
                    <Badge color={team.color}>{team.icon} {team.name}</Badge>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: colors.gray }}>Nessun evento questo mese</p>
        )}
      </div>
    </div>
  );
};

// ===== STATISTICS VIEW =====
const StatisticsView = () => {
  const { teams, players, events } = useAppContext();
  const [selectedTeam, setSelectedTeam] = useState(Object.keys(teams)[0] || '');

  const teamPlayers = selectedTeam ? players[selectedTeam] || [] : [];

  const playerStats = useMemo(() => {
    return teamPlayers.map(player => ({
      ...player,
      stats: calculatePlayerStats(player, events.filter(e => e.teamId === selectedTeam))
    })).sort((a, b) => b.stats.percentage - a.stats.percentage);
  }, [teamPlayers, events, selectedTeam]);

  const team = teams[selectedTeam];
  const teamEvents = events.filter(e => e.teamId === selectedTeam);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📊 Statistiche</h2>
        <Select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          options={Object.values(teams).map(t => ({ value: t.id, label: `${t.icon} ${t.name}` }))}
          style={{ marginBottom: 0, width: '250px' }}
        />
      </div>

      {team && (
        <>
          {/* Team Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ ...styles.statCard, borderLeft: `4px solid ${team.color}` }}>
              <div style={{ ...styles.statValue, color: team.color }}>{teamPlayers.length}</div>
              <div style={styles.statLabel}>Giocatori</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.primary}` }}>
              <div style={{ ...styles.statValue, color: colors.primary }}>{teamEvents.length}</div>
              <div style={styles.statLabel}>Eventi Totali</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.success}` }}>
              <div style={{ ...styles.statValue, color: colors.success }}>
                {teamEvents.filter(e => isFuture(e.date)).length}
              </div>
              <div style={styles.statLabel}>Prossimi Eventi</div>
            </div>
          </div>

          {/* Player Statistics */}
          <div style={styles.card}>
            <h3 style={{ marginBottom: '16px' }}>👥 Statistiche Giocatori</h3>
            {playerStats.length > 0 ? (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.lightGray, textAlign: 'left' }}>
                      <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>#</th>
                      <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>Giocatore</th>
                      <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>Ruolo</th>
                      <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}`, textAlign: 'center' }}>Convocazioni</th>
                      <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}`, textAlign: 'center' }}>Presenze</th>
                      <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}`, textAlign: 'center' }}>Assenze</th>
                      <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}`, textAlign: 'center' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.map((player, index) => (
                      <tr key={player.id} style={{ borderBottom: `1px solid ${colors.lightGray}` }}>
                        <td style={{ padding: '12px' }}>{index + 1}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{player.name}</td>
                        <td style={{ padding: '12px' }}>{player.role}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{player.stats.total}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Badge color={colors.success}>{player.stats.presenti}</Badge>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Badge color={colors.danger}>{player.stats.assenti}</Badge>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Badge color={
                            player.stats.percentage >= 80 ? colors.success :
                            player.stats.percentage >= 60 ? colors.warning :
                            colors.danger
                          }>
                            {player.stats.percentage}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: colors.gray }}>Nessun dato disponibile</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ===== TEAMS LIST =====
const TeamsList = () => {
  const { teams, addTeam, updateTeam, deleteTeam } = useAppContext();
  const { addNotification } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', color: colors.primary, icon: '⚽' });

  const handleOpenModal = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({ name: team.name, category: team.category, color: team.color, icon: team.icon });
    } else {
      setEditingTeam(null);
      setFormData({ name: '', category: '', color: colors.primary, icon: '⚽' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeam(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      addNotification('Compila tutti i campi', 'error');
      return;
    }

    if (editingTeam) {
      updateTeam(editingTeam.id, formData);
      addNotification('Squadra aggiornata', 'success');
    } else {
      const newTeam = {
        id: `team${Date.now()}`,
        ...formData
      };
      addTeam(newTeam);
      addNotification('Squadra creata', 'success');
    }

    handleCloseModal();
  };

  const handleDelete = (teamId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa squadra? Verranno eliminati anche i giocatori e gli eventi associati.')) {
      deleteTeam(teamId);
      addNotification('Squadra eliminata', 'success');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>🏆 Squadre</h2>
        <Button onClick={() => handleOpenModal()}>➕ Nuova Squadra</Button>
      </div>

      <div style={styles.grid}>
        {Object.values(teams).map(team => (
          <div key={team.id} style={styles.card}>
            <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '12px' }}>
              {team.icon}
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: '8px' }}>{team.name}</h3>
            <p style={{ textAlign: 'center', color: colors.gray, marginBottom: '16px' }}>
              {team.category}
            </p>
            <div style={{ width: '100%', height: '4px', backgroundColor: team.color, borderRadius: '2px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={() => handleOpenModal(team)} variant="secondary" style={{ flex: 1 }}>
                ✏️ Modifica
              </Button>
              <Button onClick={() => handleDelete(team.id)} variant="danger" style={{ flex: 1 }}>
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={styles.modal} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingTeam ? 'Modifica Squadra' : 'Nuova Squadra'}</h2>
              <Button onClick={handleCloseModal} variant="secondary" style={{ padding: '8px 16px' }}>✕</Button>
            </div>

            <form onSubmit={handleSubmit}>
              <Input
                label="Nome Squadra"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es: Prima Squadra"
                required
              />

              <Input
                label="Categoria"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Es: Seniores"
                required
              />

              <div style={{ marginBottom: '12px' }}>
                <label style={styles.label}>Colore</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ width: '100%', height: '50px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                />
              </div>

              <Input
                label="Icona (emoji)"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="⚽"
                maxLength={2}
              />

              <Button type="submit" style={{ width: '100%', marginTop: '16px' }}>
                {editingTeam ? 'Aggiorna' : 'Crea'} Squadra
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ===== PLAYERS LIST =====
const PlayersList = () => {
  const { teams, players, addPlayer, updatePlayer, deletePlayer } = useAppContext();
  const { addNotification } = useNotification();
  const [selectedTeam, setSelectedTeam] = useState(Object.keys(teams)[0] || '');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Centrocampista',
    number: '',
    phone: '',
    email: ''
  });

  const teamPlayers = selectedTeam ? players[selectedTeam] || [] : [];

  const handleOpenModal = (player = null) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({
        name: player.name,
        role: player.role,
        number: player.number,
        phone: player.phone || '',
        email: player.email || ''
      });
    } else {
      setEditingPlayer(null);
      setFormData({
        name: '',
        role: 'Centrocampista',
        number: '',
        phone: '',
        email: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPlayer(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.role || !formData.number) {
      addNotification('Compila tutti i campi obbligatori', 'error');
      return;
    }

    if (editingPlayer) {
      updatePlayer(selectedTeam, editingPlayer.id, formData);
      addNotification('Giocatore aggiornato', 'success');
    } else {
      const newPlayer = {
        id: `p${Date.now()}`,
        ...formData,
        number: parseInt(formData.number)
      };
      addPlayer(selectedTeam, newPlayer);
      addNotification('Giocatore aggiunto', 'success');
    }

    handleCloseModal();
  };

  const handleDelete = (playerId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo giocatore?')) {
      deletePlayer(selectedTeam, playerId);
      addNotification('Giocatore eliminato', 'success');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>👥 Giocatori</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            options={Object.values(teams).map(t => ({ value: t.id, label: `${t.icon} ${t.name}` }))}
            style={{ marginBottom: 0, width: '250px' }}
          />
          <Button onClick={() => handleOpenModal()}>➕ Nuovo Giocatore</Button>
        </div>
      </div>

      <div style={styles.card}>
        {teamPlayers.length > 0 ? (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.lightGray, textAlign: 'left' }}>
                  <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>N°</th>
                  <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>Nome</th>
                  <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>Ruolo</th>
                  <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>Telefono</th>
                  <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>Email</th>
                  <th style={{ padding: '12px', borderBottom: `2px solid ${colors.gray}` }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {teamPlayers.sort((a, b) => a.number - b.number).map(player => (
                  <tr key={player.id} style={{ borderBottom: `1px solid ${colors.lightGray}` }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>#{player.number}</td>
                    <td style={{ padding: '12px' }}>{player.name}</td>
                    <td style={{ padding: '12px' }}>{player.role}</td>
                    <td style={{ padding: '12px' }}>{player.phone || '-'}</td>
                    <td style={{ padding: '12px' }}>{player.email || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button onClick={() => handleOpenModal(player)} variant="secondary" style={{ padding: '6px 12px' }}>
                          ✏️
                        </Button>
                        <Button onClick={() => handleDelete(player.id)} variant="danger" style={{ padding: '6px 12px' }}>
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: colors.gray }}>Nessun giocatore in questa squadra</p>
        )}
      </div>

      {showModal && (
        <div style={styles.modal} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingPlayer ? 'Modifica Giocatore' : 'Nuovo Giocatore'}</h2>
              <Button onClick={handleCloseModal} variant="secondary" style={{ padding: '8px 16px' }}>✕</Button>
            </div>

            <form onSubmit={handleSubmit}>
              <Input
                label="Nome Completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Es: Marco Rossi"
                required
              />

              <Select
                label="Ruolo"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'Portiere', label: 'Portiere' },
                  { value: 'Difensore', label: 'Difensore' },
                  { value: 'Centrocampista', label: 'Centrocampista' },
                  { value: 'Attaccante', label: 'Attaccante' },
                ]}
                required
              />

              <Input
                label="Numero Maglia"
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="Es: 10"
                min="1"
                max="99"
                required
              />

              <Input
                label="Telefono"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Es: 333-1234567"
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Es: giocatore@email.it"
              />

              <Button type="submit" style={{ width: '100%', marginTop: '16px' }}>
                {editingPlayer ? 'Aggiorna' : 'Aggiungi'} Giocatore
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ===== PLAYER EVENTS (Player specific view) =====
const PlayerEvents = ({ playerName }) => {
  const { events, teams, players } = useAppContext();

  // Find player across all teams
  const findPlayer = () => {
    for (const teamId in players) {
      const player = players[teamId].find(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (player) return { player, teamId };
    }
    return null;
  };

  const playerData = findPlayer();

  if (!playerData) {
    return (
      <div style={styles.content}>
        <div style={styles.card}>
          <p style={{ textAlign: 'center', color: colors.gray }}>Giocatore non trovato</p>
        </div>
      </div>
    );
  }

  const { player, teamId } = playerData;

  // Filter events where player is convocato
  const playerEvents = events
    .filter(e => e.teamId === teamId && e.convocati?.includes(player.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const upcomingEvents = playerEvents.filter(e => isFuture(e.date));
  const pastEvents = playerEvents.filter(e => !isFuture(e.date));

  return (
    <>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          <span>⚽</span>
          <span>I Miei Eventi</span>
        </h1>
        <div style={styles.headerActions}>
          <span style={{ color: colors.white, fontWeight: 'bold' }}>
            👤 {player.name} (#{player.number})
          </span>
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.primary}` }}>
            <div style={{ ...styles.statValue, color: colors.primary }}>{playerEvents.length}</div>
            <div style={styles.statLabel}>Convocazioni Totali</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: `4px solid ${colors.success}` }}>
            <div style={{ ...styles.statValue, color: colors.success }}>{upcomingEvents.length}</div>
            <div style={styles.statLabel}>Prossimi Eventi</div>
          </div>
        </div>

        {/* Upcoming Events */}
        <h2 style={{ marginBottom: '16px' }}>🔜 Prossimi Eventi</h2>
        {upcomingEvents.length > 0 ? (
          <div style={styles.grid}>
            {upcomingEvents.map(event => (
              <PlayerEventCard key={event.id} event={event} player={player} team={teams[teamId]} />
            ))}
          </div>
        ) : (
          <div style={styles.card}>
            <p style={{ textAlign: 'center', color: colors.gray }}>Nessun evento in programma</p>
          </div>
        )}

        {/* Past Events */}
        <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>📜 Eventi Passati</h2>
        {pastEvents.length > 0 ? (
          <div style={styles.grid}>
            {pastEvents.map(event => (
              <PlayerEventCard key={event.id} event={event} player={player} team={teams[teamId]} />
            ))}
          </div>
        ) : (
          <div style={styles.card}>
            <p style={{ textAlign: 'center', color: colors.gray }}>Nessun evento passato</p>
          </div>
        )}
      </div>
    </>
  );
};

const PlayerEventCard = ({ event, player, team }) => {
  const { addEventResponse } = useAppContext();
  const { addNotification } = useNotification();
  const [showDetail, setShowDetail] = useState(false);

  const playerResponse = event.responses?.[player.id];

  const handleQuickResponse = (status) => {
    addEventResponse(event.id, player.id, { status, note: '' });
    addNotification(`Risposta registrata: ${status}`, 'success');
  };

  return (
    <>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>
              {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'}
            </div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{event.title}</h3>
          </div>
          {playerResponse && (
            <Badge color={
              playerResponse.status === 'presente' ? colors.success :
              playerResponse.status === 'assente' ? colors.danger :
              colors.warning
            }>
              {playerResponse.status === 'presente' ? '✅ Confermato' :
               playerResponse.status === 'assente' ? '❌ Assente' :
               '❓ Forse'}
            </Badge>
          )}
        </div>

        {team && (
          <div style={{ marginBottom: '8px', color: colors.gray, fontSize: '14px' }}>
            🏆 {team.name}
          </div>
        )}

        <div style={{ marginBottom: '8px', fontSize: '14px' }}>
          📅 {formatDate(event.date)} alle {formatTime(event.time)}
        </div>

        <div style={{ marginBottom: '8px', fontSize: '14px', color: colors.gray }}>
          📍 {event.location}
        </div>

        {!playerResponse && isFuture(event.date) && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <Button onClick={() => handleQuickResponse('presente')} variant="success" style={{ flex: 1, padding: '8px' }}>
              ✅ Presente
            </Button>
            <Button onClick={() => handleQuickResponse('assente')} variant="danger" style={{ flex: 1, padding: '8px' }}>
              ❌ Assente
            </Button>
            <Button onClick={() => handleQuickResponse('forse')} variant="warning" style={{ flex: 1, padding: '8px' }}>
              ❓ Forse
            </Button>
          </div>
        )}

        <Button onClick={() => setShowDetail(true)} variant="secondary" style={{ width: '100%', marginTop: '12px', padding: '8px' }}>
          📋 Dettagli
        </Button>
      </div>

      {showDetail && (
        <EventDetail event={event} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
};

// ===== MAIN APP COMPONENT =====
const App = () => {
  const [userRole, setUserRole] = useState(null);
  const [playerName, setPlayerName] = useState('');

  const handleLogin = (role, name) => {
    setUserRole(role);
    setPlayerName(name);
  };

  const handleLogout = () => {
    setUserRole(null);
    setPlayerName('');
  };

  if (!userRole) {
    return (
      <NotificationProvider>
        <AppProvider>
          <LoginScreen onLogin={handleLogin} />
        </AppProvider>
      </NotificationProvider>
    );
  }

  if (userRole === 'player') {
    return (
      <NotificationProvider>
        <AppProvider>
          <div style={styles.container}>
            <PlayerEvents playerName={playerName} />
          </div>
        </AppProvider>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <AppProvider>
        <div style={styles.container}>
          <style>{animations}</style>
          <Dashboard userRole={userRole} />
        </div>
      </AppProvider>
    </NotificationProvider>
  );
};

export default App;
