import React, { useState, useContext, createContext, useMemo, useCallback, useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';
import * as NotificationManager from './notificationManager';
import InstallPrompt from './InstallPrompt';
import { register as registerServiceWorker } from './serviceWorkerRegistration';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import CookiePolicy from './CookiePolicy';
import CookieBanner from './CookieBanner';
import DataManagement from './DataManagement';
import AgeVerification from './AgeVerification';
import ParentalConsentForm from './ParentalConsentForm';

// ===== API CLIENT =====
const API_URL = '/api/db';

const apiCall = async (method, body = null, query = '') => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${query}`, options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }
    
    return response.json();
  } catch (error) {
    console.error('API call failed:', error.message);
    throw error;
  }
};

const api = {
  loadAll: async () => {
    const [teamsRes, playersRes, eventsRes] = await Promise.all([
      apiCall('GET', null, '?table=teams'),
      apiCall('GET', null, '?table=players'),
      apiCall('GET', null, '?table=events'),
    ]);
    
    const teams = {};
    teamsRes.teams.forEach(t => teams[t.id] = t);
    
    const players = {};
    playersRes.players.forEach(p => {
      if (!players[p.team_id]) players[p.team_id] = [];
      players[p.team_id].push(p);
    });
    
    return { teams, players, events: eventsRes.events };
  },

  addTeam: (team) => apiCall('POST', { action: 'add_team', data: team }),
  updateTeam: (id, updates) => apiCall('POST', { action: 'update_team', id, data: updates }),
  deleteTeam: (id) => apiCall('POST', { action: 'delete_team', id }),

  addPlayer: (teamId, player) => apiCall('POST', { action: 'add_player', data: { ...player, teamId } }),
  updatePlayer: (id, updates) => apiCall('POST', { action: 'update_player', id, data: updates }),
  deletePlayer: (id) => apiCall('POST', { action: 'delete_player', id }),

  addEvent: (event) => apiCall('POST', { action: 'add_event', data: event }),
  updateEvent: (id, updates) => apiCall('POST', { action: 'update_event', id, data: updates }),
  deleteEvent: (id) => apiCall('POST', { action: 'delete_event', id }),
};

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
    /* RESPONSIVE CALENDARIO MOBILE */
  @media (max-width: 768px) {
    .calendar-cell {
      padding: 4px !important;
      min-height: 60px !important;
      font-size: 12px !important;
    }
    .calendar-event {
      font-size: 9px !important;
      padding: 2px 4px !important;
    }
    .calendar-header {
      font-size: 12px !important;
      padding: 4px !important;
    }
    .calendar-nav-button {
      padding: 8px 12px !important;
      font-size: 12px !important;
    }
    .calendar-month-title {
      font-size: 18px !important;
    }
  }

  @media (max-width: 480px) {
    .calendar-day-name {
      font-size: 10px !important;
    }
    .calendar-cell {
      min-height: 50px !important;
    }
    .calendar-event {
      font-size: 8px !important;
    }
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
    const response = event.responses?.[player.id];
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
  const [teams, setTeams] = useState({});
  const [players, setPlayers] = useState({});
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carica dati all'avvio
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await api.loadAll();
        setTeams(data.teams);
        setPlayers(data.players);
        setEvents(data.events);
      } catch (error) {
        console.error('Errore caricamento:', error);
        console.log('🔧 Impostazione dati demo...');
        // Fallback a dati iniziali
        const initialTeams = {
          team1: { id: 'team1', name: 'Prima Squadra', category: 'Seniores', color: colors.primary, icon: '⚽' },
          team2: { id: 'team2', name: 'Juniores', category: 'Under 19', color: colors.secondary, icon: '🏆' },
        };
        const initialPlayers = {
          team1: [
            { id: 'p1', name: 'Marco Rossi', role: 'Portiere', number: 1, phone: '333-1234567', email: 'marco@test.it' },
            { id: 'p2', name: 'Luca Bianchi', role: 'Difensore', number: 4, phone: '333-2345678', email: 'luca@test.it' },
          ],
          team2: []
        };
        const initialEvents = [];
        setTeams(initialTeams);
        setPlayers(initialPlayers);
        setEvents(initialEvents);
        console.log('✅ Dati demo impostati:', { teams: initialTeams, players: initialPlayers, events: initialEvents });
      } finally {
        console.log('🏁 setIsLoading(false)');
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const addTeam = useCallback(async (team) => {
    await api.addTeam(team);
    setTeams(prev => ({ ...prev, [team.id]: team }));
    setPlayers(prev => ({ ...prev, [team.id]: [] }));
  }, []);

  const updateTeam = useCallback(async (teamId, updates) => {
    await api.updateTeam(teamId, updates);
    setTeams(prev => ({ ...prev, [teamId]: { ...prev[teamId], ...updates } }));
  }, []);

  const deleteTeam = useCallback(async (teamId) => {
    await api.deleteTeam(teamId);
    setTeams(prev => { const n = { ...prev }; delete n[teamId]; return n; });
    setPlayers(prev => { const n = { ...prev }; delete n[teamId]; return n; });
    setEvents(prev => prev.filter(e => e.teamId !== teamId));
  }, []);

  const addPlayer = useCallback(async (teamId, player) => {
    await api.addPlayer(teamId, player);
    setPlayers(prev => ({ ...prev, [teamId]: [...(prev[teamId] || []), player] }));
  }, []);

  const updatePlayer = useCallback(async (teamId, playerId, updates) => {
    await api.updatePlayer(playerId, updates);
    setPlayers(prev => ({
      ...prev,
      [teamId]: prev[teamId].map(p => p.id === playerId ? { ...p, ...updates } : p)
    }));
  }, []);

  const deletePlayer = useCallback(async (teamId, playerId) => {
    await api.deletePlayer(playerId);
    setPlayers(prev => ({ ...prev, [teamId]: prev[teamId].filter(p => p.id !== playerId) }));
  }, []);

  const addEvent = useCallback(async (event) => {
    await api.addEvent(event);
    setEvents(prev => [...prev, event]);
    
    // 🔔 NOTIFICHE: Notifica istantanea ai giocatori convocati
    if (event.convocati && event.convocati.length > 0) {
      const teamPlayers = players[event.teamId] || [];
      const convocatedPlayers = teamPlayers.filter(p => event.convocati.includes(p.id));
      
      // Invia notifica istantanea
      NotificationManager.notifyNewEvent(event, convocatedPlayers);
      
      // Schedula notifiche future (24h prima)
      NotificationManager.scheduleEventNotifications(event, convocatedPlayers);
      
      console.log(`📬 Notifiche inviate a ${convocatedPlayers.length} giocatori`);
    }
  }, [players]);

  const updateEvent = useCallback(async (eventId, updates) => {
    await api.updateEvent(eventId, updates);
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
  }, []);

  const deleteEvent = useCallback(async (eventId) => {
    await api.deleteEvent(eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

const addEventResponse = useCallback(async (eventId, playerId, response) => {
  const event = events.find(e => e.id === eventId);
  if (!event) return;

  const updatedResponses = {
    ...(event.responses || {}),
    [playerId]: {
      status: response.status,
      note: response.note || '',
      respondedAt: new Date().toISOString(),
    }
  };

  const updates = {
    teamId: event.teamId,
    type: event.type,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    opponent: event.opponent || '',
    description: event.description || '',
    convocati: event.convocati,
    responses: updatedResponses,
  };

  await api.updateEvent(eventId, updates);
  
  const updatedEvent = { ...event, responses: updatedResponses };
  setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
  
  // Notifica rimossa - L'allenatore vedrà le risposte nell'interfaccia
}, [events, players]);

  const resetAllData = useCallback(async () => {
    const teamIds = Object.keys(teams);
    for (const teamId of teamIds) {
      await api.deleteTeam(teamId);
    }
    window.location.reload();
  }, [teams]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚽</div>
          <div style={{ fontSize: '18px', color: colors.primary }}>Caricamento...</div>
        </div>
      </div>
    );
  }

  console.log('🎯 isLoading è false, rendering AppContext.Provider...');
  console.log('📊 Dati disponibili:', { teamsCount: Object.keys(teams).length, playersCount: Object.keys(players).length, eventsCount: events.length });

  return <AppContext.Provider value={{
    teams,
    players,
    events,
    isLoading,
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
  }}>{children}</AppContext.Provider>;
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
        <div style={styles.headerTitle}>Academy Hub</div>
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
  const { teams, players, events, resetAllData } = useAppContext();
  const { addNotification } = useNotification();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
            <div style={styles.headerSubtitle}>Academy Hub</div>
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
         <Button
  title="👤 Gestisci Utenti"
  onPress={() => onNavigate('users')}
  variant="secondary"
  style={{ padding: '20px', fontSize: '16px' }}
/> 
        </div>
        
        {/* Pulsante Reset Dati (solo Admin) */}
        {role === 'admin' && (
          <div style={{ 
            marginTop: '48px', 
            padding: '24px', 
            backgroundColor: `${colors.danger}10`, 
            borderRadius: '12px',
            border: `2px solid ${colors.danger}`,
          }}>
            <h4 style={{ marginBottom: '12px', color: colors.danger }}>⚠️ Zona Pericolosa</h4>
            <p style={{ marginBottom: '16px', color: colors.gray, fontSize: '14px' }}>
              Resetta tutti i dati dell'app (squadre, giocatori, eventi) e riporta ai valori iniziali.
            </p>
            <Button
              title="🔄 Reset Dati App"
              onPress={() => setShowResetConfirm(true)}
              variant="danger"
            />
          </div>
        )}

        {/* Modal Conferma Reset */}
        {showResetConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '500px',
              margin: '20px',
            }}>
              <h3 style={{ marginBottom: '16px', color: colors.danger }}>⚠️ Conferma Reset</h3>
              <p style={{ marginBottom: '24px', color: colors.gray }}>
                Sei sicuro di voler <strong>resettare tutti i dati</strong>?<br/><br/>
                Verranno cancellati:
              </p>
              <ul style={{ marginBottom: '24px', color: colors.gray, paddingLeft: '20px' }}>
                <li>Tutte le squadre create</li>
                <li>Tutti i giocatori</li>
                <li>Tutti gli eventi</li>
                <li>Tutte le risposte</li>
              </ul>
              <p style={{ marginBottom: '24px', color: colors.danger, fontWeight: '600' }}>
                Questa azione NON può essere annullata!
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  title="Sì, Resetta Tutto"
                  onPress={() => {
                    resetAllData();
                    addNotification('Dati resettati', 'success');
                  }}
                  variant="danger"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Annulla"
                  onPress={() => setShowResetConfirm(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== EVENTS LIST =====
const EventsList = ({ onNavigate, onBack }) => {
  const { events, teams } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (filter === 'future') {
      filtered = filtered.filter(e => isFuture(e.date));
    } else if (filter === 'past') {
      filtered = filtered.filter(e => !isFuture(e.date));
    }

    if (teamFilter !== 'all') {
      filtered = filtered.filter(e => e.teamId === teamFilter);
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events, filter, teamFilter]);

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>📅 Gestione Eventi</div>
            <div style={styles.headerSubtitle}>Tutti gli allenamenti, partite e riunioni</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {/* Filtri */}
        <div style={{ ...styles.card, marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Select
              label="Periodo"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Tutti gli eventi' },
                { value: 'future', label: 'Prossimi eventi' },
                { value: 'past', label: 'Eventi passati' },
              ]}
            />
            <Select
              label="Squadra"
              value={teamFilter}
              onChange={setTeamFilter}
              options={[
                { value: 'all', label: 'Tutte le squadre' },
                ...Object.values(teams).map(t => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
        </div>

        <Button
          title="➕ Crea Nuovo Evento"
          onPress={() => onNavigate('create-event')}
          variant="success"
          style={{ marginBottom: '24px', width: '100%', padding: '16px' }}
        />

        {/* Lista Eventi */}
        {filteredEvents.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px', color: colors.gray }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
              <div style={{ fontSize: '18px' }}>Nessun evento trovato</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredEvents.map(event => {
              const team = teams[event.teamId];
              const responseCount = Object.keys(event.responses).length;
              const presentCount = Object.values(event.responses).filter(r => r.status === 'presente').length;
              const convocatiCount = event.convocati?.length || 0;

              return (
                <div
                  key={event.id}
                  style={styles.card}
                  onClick={() => onNavigate('event-detail', event.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.cursor = 'pointer';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = colors.shadowHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = colors.shadow;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                        <Badge
                          text={event.type.toUpperCase()}
                          variant={event.type === 'partita' ? 'danger' : event.type === 'allenamento' ? 'success' : 'primary'}
                        />
                        {isFuture(event.date) && <Badge text="FUTURO" variant="warning" />}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                        {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'} {event.title}
                      </div>
                      <div style={{ color: colors.gray, fontSize: '14px' }}>
                        🏆 {team?.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: colors.gray, marginBottom: '4px' }}>
                      📅 {formatDateTime(event.date, event.time)} • {getDayName(event.date)}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.gray }}>
                      📍 {event.location}
                    </div>
                    {event.opponent && (
                      <div style={{ fontSize: '14px', color: colors.gray }}>
                        🆚 {event.opponent}
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: colors.background,
                    borderRadius: '8px',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: colors.gray }}>Convocati</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                        {convocatiCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: colors.gray }}>Hanno Risposto</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.secondary }}>
                        {responseCount}/{convocatiCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: colors.gray }}>Presenti</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.success }}>
                        {presentCount}
                      </div>
                    </div>
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
const CreateEditEvent = ({ onNavigate, onBack, eventId = null }) => {
  const { teams, players, addEvent, updateEvent, events } = useAppContext();
  const { addNotification } = useNotification();

  const existingEvent = eventId ? events.find(e => e.id === eventId) : null;

  const [formData, setFormData] = useState({
    teamId: existingEvent?.teamId || '',
    type: existingEvent?.type || 'allenamento',
    title: existingEvent?.title || '',
    date: existingEvent?.date ? new Date(existingEvent.date).toISOString().split('T')[0] : '',
    time: existingEvent?.time || '',
    location: existingEvent?.location || '',
    opponent: existingEvent?.opponent || '',
    description: existingEvent?.description || '',
    convocati: existingEvent?.convocati || [],
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.teamId) newErrors.teamId = 'Seleziona una squadra';
    if (!formData.title) newErrors.title = 'Inserisci un titolo';
    if (!formData.date) newErrors.date = 'Inserisci una data';
    if (!formData.time) newErrors.time = 'Inserisci un orario';
    if (!formData.location) newErrors.location = 'Inserisci un luogo';
    if (formData.convocati.length === 0) newErrors.convocati = 'Seleziona almeno un giocatore';

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
      id: eventId || `e${Date.now()}`,
      responses: existingEvent?.responses || {},
      createdBy: 'admin',
      createdAt: existingEvent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (eventId) {
      updateEvent(eventId, eventData);
      addNotification('Evento aggiornato con successo', 'success');
    } else {
      addEvent(eventData);
      addNotification('Evento creato con successo', 'success');
    }

    onBack();
  };

  const togglePlayer = (playerId) => {
    setFormData(prev => ({
      ...prev,
      convocati: prev.convocati.includes(playerId)
        ? prev.convocati.filter(id => id !== playerId)
        : [...prev.convocati, playerId]
    }));
  };

  const selectAllPlayers = () => {
    if (formData.teamId) {
      const allPlayerIds = (players[formData.teamId] || []).map(p => p.id);
      setFormData(prev => ({ ...prev, convocati: allPlayerIds }));
    }
  };

  const deselectAllPlayers = () => {
    setFormData(prev => ({ ...prev, convocati: [] }));
  };

  const teamPlayers = formData.teamId ? players[formData.teamId] || [] : [];

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>
              {eventId ? '✏️ Modifica Evento' : '➕ Crea Evento'}
            </div>
            <div style={styles.headerSubtitle}>
              Allenamento, Partita o Riunione
            </div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.card}>
          <h3 style={{ marginBottom: '24px', color: colors.primary }}>📋 Informazioni Evento</h3>

          <Select
            label="Squadra"
            value={formData.teamId}
            onChange={(val) => setFormData(prev => ({ ...prev, teamId: val, convocati: [] }))}
            options={Object.values(teams).map(t => ({ value: t.id, label: t.name }))}
            required
            error={errors.teamId}
          />

          <Select
            label="Tipo Evento"
            value={formData.type}
            onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
            options={[
              { value: 'allenamento', label: '🏃 Allenamento' },
              { value: 'partita', label: '⚽ Partita' },
              { value: 'riunione', label: '📋 Riunione' },
            ]}
            required
          />

          <Input
            label="Titolo Evento"
            value={formData.title}
            onChange={(val) => setFormData(prev => ({ ...prev, title: val }))}
            placeholder="Es: Allenamento Tattico"
            required
            error={errors.title}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Data"
              type="date"
              value={formData.date}
              onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
              required
              error={errors.date}
            />
            <Input
              label="Orario"
              type="time"
              value={formData.time}
              onChange={(val) => setFormData(prev => ({ ...prev, time: val }))}
              required
              error={errors.time}
            />
          </div>

          <Input
            label="Luogo"
            value={formData.location}
            onChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
            placeholder="Es: Campo Principale"
            required
            error={errors.location}
          />

          {formData.type === 'partita' && (
            <Input
              label="Avversario"
              value={formData.opponent}
              onChange={(val) => setFormData(prev => ({ ...prev, opponent: val }))}
              placeholder="Es: Juventus FC"
            />
          )}

          <Textarea
            label="Descrizione"
            value={formData.description}
            onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
            placeholder="Note aggiuntive sull'evento..."
          />
        </div>

        {/* Selezione Convocati */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: colors.primary }}>
              👥 Convocati ({formData.convocati.length}/{teamPlayers.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                title="Tutti"
                onPress={selectAllPlayers}
                variant="outline"
                disabled={!formData.teamId}
                style={{ padding: '8px 16px' }}
              />
              <Button
                title="Nessuno"
                onPress={deselectAllPlayers}
                variant="outline"
                disabled={!formData.teamId}
                style={{ padding: '8px 16px' }}
              />
            </div>
          </div>

          {errors.convocati && (
            <div style={{ color: colors.danger, marginBottom: '16px' }}>
              {errors.convocati}
            </div>
          )}

          {!formData.teamId ? (
            <div style={{ textAlign: 'center', padding: '32px', color: colors.gray }}>
              Seleziona prima una squadra
            </div>
          ) : teamPlayers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: colors.gray }}>
              Nessun giocatore in questa squadra
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}>
              {teamPlayers.map(player => {
                const isSelected = formData.convocati.includes(player.id);
                return (
                  <div
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    style={{
                      padding: '16px',
                      border: `2px solid ${isSelected ? colors.primary : colors.lightGray}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      backgroundColor: isSelected ? `${colors.primary}10` : colors.white,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = colors.shadow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                      {player.name}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.gray }}>
                      #{player.number} • {player.role}
                    </div>
                    {isSelected && (
                      <div style={{ marginTop: '8px', color: colors.primary, fontSize: '12px', fontWeight: '600' }}>
                        ✓ CONVOCATO
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Button
            title={eventId ? '💾 Salva Modifiche' : '➕ Crea Evento'}
            onPress={handleSubmit}
            variant="success"
            style={{ flex: 1, padding: '16px', fontSize: '16px' }}
          />
          <Button
            title="Annulla"
            onPress={onBack}
            variant="outline"
            style={{ padding: '16px' }}
          />
        </div>
      </div>
    </div>
  );
};

// ===== EVENT DETAIL =====
const EventDetail = ({ onNavigate, onBack, eventId, currentRole }) => {
  const { events, teams, players, deleteEvent, addEventResponse } = useAppContext();
  const { addNotification } = useNotification();

  const event = events.find(e => e.id === eventId);
  const team = event ? teams[event.teamId] : null;
  const teamPlayers = event ? players[event.teamId] || [] : [];

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Verifica se l'appello è stato fatto
  const attendanceTaken = NotificationManager.isAttendanceTaken(eventId);
  
  // Verifica se l'evento è oggi o nel passato (può fare appello)
  const eventDate = event ? new Date(event.date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const canTakeAttendance = eventDate && eventDate <= today;

  if (!event) {
    return (
      <div style={styles.container}>
        <style>{animations}</style>
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
              <div style={{ fontSize: '18px', marginBottom: '24px' }}>Evento non trovato</div>
              <Button title="← Indietro" onPress={onBack} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteEvent(eventId);
    addNotification('Evento eliminato', 'success');
    onBack();
  };

  const handleSendWhatsApp = () => {
    const message = generateWhatsAppMessage(event, team, teamPlayers, convocatiList);
    openWhatsApp(message);
    addNotification('Apertura WhatsApp...', 'success');
  };

  const convocatiList = teamPlayers.filter(p => event.convocati?.includes(p.id));
  const responseStats = {
    presenti: Object.values(event.responses).filter(r => r.status === 'presente').length,
    assenti: Object.values(event.responses).filter(r => r.status === 'assente').length,
    forse: Object.values(event.responses).filter(r => r.status === 'forse').length,
    noRisposta: convocatiList.length - Object.keys(event.responses).length,
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
            <div style={styles.headerSubtitle}>Dettagli Evento</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {/* Info Evento */}
        <div style={styles.card}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <Badge
              text={event.type.toUpperCase()}
              variant={event.type === 'partita' ? 'danger' : event.type === 'allenamento' ? 'success' : 'primary'}
            />
            {isFuture(event.date) && <Badge text="FUTURO" variant="warning" />}
          </div>

          <h2 style={{ marginBottom: '16px', color: colors.primary }}>{event.title}</h2>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>🏆 Squadra:</strong> {team?.name}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>📅 Data e Ora:</strong> {formatDateTime(event.date, event.time)} • {getDayName(event.date)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>📍 Luogo:</strong> {event.location}
            </div>
            {event.opponent && (
              <div style={{ marginBottom: '8px' }}>
                <strong>🆚 Avversario:</strong> {event.opponent}
              </div>
            )}
            {event.description && (
              <div style={{ marginTop: '16px' }}>
                <strong>📝 Descrizione:</strong>
                <div style={{ marginTop: '8px', color: colors.gray }}>{event.description}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Bottone Fai Appello - Solo per Admin/Coach e solo se evento è oggi o passato */}
            {(currentRole === 'admin' || currentRole === 'coach') && canTakeAttendance && (
              <Button
                title={attendanceTaken ? "📋 Vedi Appello" : "📋 Fai Appello"}
                onPress={() => onNavigate('attendance', eventId)}
                variant={attendanceTaken ? "success" : "primary"}
                style={{ flex: 1 }}
              />
            )}
            
            <Button
              title="📱 Invia su WhatsApp"
              onPress={handleSendWhatsApp}
              variant="success"
              style={{ flex: 1 }}
            />
            <Button
              title="✏️ Modifica"
              onPress={() => onNavigate('edit-event', eventId)}
              variant="secondary"
            />
            <Button
              title="🗑️ Elimina"
              onPress={() => setShowDeleteConfirm(true)}
              variant="danger"
            />
          </div>
        </div>

        {/* Statistiche Risposte */}
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', color: colors.primary }}>📊 Statistiche Risposte</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
          }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
                {responseStats.presenti}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Presenti</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.danger }}>
                {responseStats.assenti}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Assenti</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
                {responseStats.forse}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Forse</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.gray }}>
                {responseStats.noRisposta}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Nessuna Risposta</div>
            </div>
          </div>
        </div>

        {/* Lista Convocati con Risposte */}
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', color: colors.primary }}>
            👥 Convocati ({convocatiList.length})
          </h3>
          
          {responseStats.noRisposta > 0 && (
            <div style={{
              padding: '12px',
              backgroundColor: `${colors.warning}20`,
              borderLeft: `4px solid ${colors.warning}`,
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <strong>⚠️ Attenzione:</strong> {responseStats.noRisposta} {responseStats.noRisposta === 1 ? 'giocatore non ha' : 'giocatori non hanno'} ancora risposto
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {convocatiList.map(player => {
              const response = event.responses[player.id];
              const statusConfig = {
                presente: { color: colors.success, icon: '✓', text: 'PRESENTE', bg: `${colors.success}20` },
                assente: { color: colors.danger, icon: '✗', text: 'ASSENTE', bg: `${colors.danger}20` },
                forse: { color: colors.warning, icon: '?', text: 'FORSE', bg: `${colors.warning}20` },
              };
              const config = response ? statusConfig[response.status] : null;

              return (
                <div
                  key={player.id}
                  style={{
                    padding: '16px',
                    border: `2px solid ${config ? config.color : colors.lightGray}`,
                    borderRadius: '8px',
                    backgroundColor: config ? config.bg : `${colors.gray}10`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: config ? config.color : colors.gray,
                          color: colors.white,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: '700',
                        }}>
                          {player.number}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '16px' }}>
                            {player.name}
                          </div>
                          <div style={{ fontSize: '14px', color: colors.gray }}>
                            {player.role}
                          </div>
                        </div>
                      </div>
                      
                      {response?.note && (
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '8px 12px',
                          backgroundColor: colors.white,
                          borderRadius: '6px',
                          fontSize: '14px', 
                          fontStyle: 'italic', 
                          color: colors.gray,
                          borderLeft: `3px solid ${config.color}`,
                        }}>
                          💬 <strong>Nota:</strong> {response.note}
                        </div>
                      )
                      }
                      {response && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: colors.gray }}>
                          🕐 Risposto il {formatDate(response.respondedAt)} alle {new Date(response.respondedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginLeft: '16px' }}>
                      {config ? (
                        <Badge
                          text={`${config.icon} ${config.text}`}
                          variant={response.status === 'presente' ? 'success' : response.status === 'assente' ? 'danger' : 'warning'}
                        />
                      ) : (
                        <Badge text="⏳ IN ATTESA" variant="default" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conferma Eliminazione */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '500px',
              margin: '20px',
            }}>
              <h3 style={{ marginBottom: '16px', color: colors.danger }}>⚠️ Conferma Eliminazione</h3>
              <p style={{ marginBottom: '24px', color: colors.gray }}>
                Sei sicuro di voler eliminare questo evento? Questa azione non può essere annullata.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  title="Elimina"
                  onPress={handleDelete}
                  variant="danger"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Annulla"
                  onPress={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== ATTENDANCE VIEW (APPELLO DAL VIVO) =====
const AttendanceView = ({ onBack, eventId }) => {
  const { events, teams, players } = useAppContext();
  const { addNotification } = useNotification();
  
  const event = events.find(e => e.id === eventId);
  const team = event ? teams[event.teamId] : null;
  const teamPlayers = event ? players[event.teamId] || [] : [];
  const convocatiList = teamPlayers.filter(p => event.convocati?.includes(p.id));
  
  // Carica appello esistente se presente
  const existingAttendance = NotificationManager.getRealAttendance(eventId);
  const [attendance, setAttendance] = useState(
    existingAttendance?.attendanceData || {}
  );
  const [isCompleted, setIsCompleted] = useState(!!existingAttendance);

  if (!event) {
    return (
      <div style={styles.container}>
        <style>{animations}</style>
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
              <div style={{ fontSize: '18px', marginBottom: '24px' }}>Evento non trovato</div>
              <Button title="← Indietro" onPress={onBack} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAttendanceChange = (playerId, status) => {
    setAttendance(prev => ({
      ...prev,
      [playerId]: status
    }));
  };

  const handleSaveAttendance = () => {
    // Salva l'appello
    const savedData = NotificationManager.saveRealAttendance(eventId, attendance);
    
    // Calcola statistiche
    const stats = {
      present: Object.values(attendance).filter(s => s === 'presente').length,
      absent: Object.values(attendance).filter(s => s === 'assente').length,
      injured: Object.values(attendance).filter(s => s === 'infortunato').length,
    };
    
    // Notifica completamento
    NotificationManager.notifyAttendanceCompleted(event, stats);
    
    setIsCompleted(true);
    addNotification('✅ Appello salvato con successo!', 'success');
  };

  const getPlayerStatus = (playerId) => {
    return attendance[playerId] || null;
  };

  const stats = {
    present: Object.values(attendance).filter(s => s === 'presente').length,
    absent: Object.values(attendance).filter(s => s === 'assente').length,
    injured: Object.values(attendance).filter(s => s === 'infortunato').length,
    total: convocatiList.length,
  };

  // Confronto con presenze confermate
  const comparison = NotificationManager.compareAttendance(eventId, convocatiList);

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>
              📋 Appello: {event.title}
            </div>
            <div style={styles.headerSubtitle}>
              {formatDateTime(event.date, event.time)}
            </div>
          </div>
          <Button 
            title="← Indietro" 
            onPress={onBack} 
            variant="outline" 
            style={{ color: colors.white, borderColor: colors.white }} 
          />
        </div>
      </div>

      <div style={styles.content}>
        {/* Statistiche Appello */}
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', color: colors.primary }}>
            📊 Statistiche Appello
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
          }}>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px', 
              backgroundColor: colors.background, 
              borderRadius: '8px' 
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
                {stats.present}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Presenti</div>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px', 
              backgroundColor: colors.background, 
              borderRadius: '8px' 
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.danger }}>
                {stats.absent}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Assenti</div>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px', 
              backgroundColor: colors.background, 
              borderRadius: '8px' 
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
                {stats.injured}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Infortunati</div>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px', 
              backgroundColor: colors.background, 
              borderRadius: '8px' 
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Totale</div>
            </div>
          </div>
        </div>

        {/* Confronto con Conferme (se appello completato) */}
        {isCompleted && comparison && (
          <div style={styles.card}>
            <h3 style={{ marginBottom: '16px', color: colors.primary }}>
              🎯 Confronto Conferme vs Presenze Reali
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontSize: '48px', 
                fontWeight: '700', 
                color: comparison.accuracy >= 80 ? colors.success : 
                       comparison.accuracy >= 60 ? colors.warning : colors.danger,
                textAlign: 'center',
                marginBottom: '8px',
              }}>
                {comparison.accuracy}%
              </div>
              <div style={{ textAlign: 'center', color: colors.gray }}>
                Precisione Conferme
              </div>
            </div>
            
            {comparison.confirmedButAbsent.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: colors.danger }}>❌ Hanno confermato ma erano assenti:</strong>
                <div style={{ marginTop: '8px', color: colors.gray }}>
                  {comparison.confirmedButAbsent.join(', ')}
                </div>
              </div>
            )}
            
            {comparison.notConfirmedButPresent.length > 0 && (
              <div>
                <strong style={{ color: colors.success }}>✅ Non hanno confermato ma erano presenti:</strong>
                <div style={{ marginTop: '8px', color: colors.gray }}>
                  {comparison.notConfirmedButPresent.join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista Giocatori */}
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', color: colors.primary }}>
            👥 Lista Convocati ({convocatiList.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {convocatiList.map((player) => {
              const playerStatus = getPlayerStatus(player.id);
              const confirmedStatus = event.responses?.[player.id]?.status;
              
              return (
                <div 
                  key={player.id}
                  style={{
                    padding: '16px',
                    backgroundColor: colors.background,
                    borderRadius: '8px',
                    border: `2px solid ${
                      playerStatus === 'presente' ? colors.success :
                      playerStatus === 'assente' ? colors.danger :
                      playerStatus === 'infortunato' ? colors.warning :
                      colors.lightGray
                    }`,
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>
                        {player.name}
                      </div>
                      {confirmedStatus && (
                        <div style={{ fontSize: '12px', color: colors.gray, marginTop: '4px' }}>
                          Confermato: {
                            confirmedStatus === 'presente' ? '✅ Presente' :
                            confirmedStatus === 'assente' ? '❌ Assente' :
                            '❓ Forse'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      title="✅ Presente"
                      onPress={() => handleAttendanceChange(player.id, 'presente')}
                      variant={playerStatus === 'presente' ? 'success' : 'outline'}
                      style={{ flex: 1 }}
                      disabled={isCompleted}
                    />
                    <Button
                      title="❌ Assente"
                      onPress={() => handleAttendanceChange(player.id, 'assente')}
                      variant={playerStatus === 'assente' ? 'danger' : 'outline'}
                      style={{ flex: 1 }}
                      disabled={isCompleted}
                    />
                    <Button
                      title="🤕 Infortunato"
                      onPress={() => handleAttendanceChange(player.id, 'infortunato')}
                      variant={playerStatus === 'infortunato' ? 'warning' : 'outline'}
                      style={{ flex: 1 }}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {!isCompleted && (
            <div style={{ marginTop: '24px' }}>
              <Button
                title="💾 Salva Appello"
                onPress={handleSaveAttendance}
                variant="primary"
                disabled={Object.keys(attendance).length === 0}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {isCompleted && (
            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              backgroundColor: colors.success + '20',
              borderRadius: '8px',
              textAlign: 'center',
              color: colors.success,
              fontWeight: '600',
            }}>
              ✅ Appello completato e salvato
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== CALENDAR VIEW =====
const CalendarView = ({ onNavigate, onBack }) => {
  const { events, teams } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = (day) => {
    return events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === month &&
             eventDate.getFullYear() === year;
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '8px' }} />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === month && 
                     new Date().getFullYear() === year;

      days.push(
        <div
          key={day}
          className="calendar-cell"
          style={{
            padding: '8px',
            border: `2px solid ${isToday ? colors.primary : colors.lightGray}`,
            borderRadius: '8px',
            minHeight: '100px',
            backgroundColor: isToday ? `${colors.primary}10` : colors.white,
            cursor: dayEvents.length > 0 ? 'pointer' : 'default',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            if (dayEvents.length > 0) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = colors.shadow;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ 
            fontWeight: isToday ? '700' : '600', 
            marginBottom: '8px',
            color: isToday ? colors.primary : colors.black,
          }}>
            {day}
          </div>
          {dayEvents.map(event => {
            const team = teams[event.teamId];
            const eventColor = event.type === 'partita' ? colors.danger : 
                             event.type === 'allenamento' ? colors.success : colors.primary;
            return (
              <div
                key={event.id}
                className="calendar-event"
                onClick={() => onNavigate('event-detail', event.id)}
                style={{
                  padding: '4px 6px',
                  backgroundColor: eventColor,
                  color: colors.white,
                  borderRadius: '4px',
                  fontSize: '11px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                }}
              >
                {event.time.substring(0, 5)} {event.title}
              </div>
            );
          })}
        </div>
      );
    }

    return days;
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>📅 Calendario Eventi</div>
            <div style={styles.headerSubtitle}>Vista mensile completa</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        {/* Navigation */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button title="← Mese Precedente" onPress={previousMonth} variant="outline" className="calendar-nav-button" />
            <div className="calendar-month-title" style={{ fontSize: '24px', fontWeight: '700', textAlign: 'center' }}>
  {monthNames[month]} {year}
</div>
            <Button title="Mese Successivo →" onPress={nextMonth} variant="outline" className="calendar-nav-button" />
            
          </div>
        </div>

        {/* Legend */}
        <div style={styles.card}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: colors.success, borderRadius: '4px' }} />
              <span>Allenamento</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: colors.danger, borderRadius: '4px' }} />
              <span>Partita</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', backgroundColor: colors.primary, borderRadius: '4px' }} />
              <span>Riunione</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={styles.card}>
          {/* Day Names */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginBottom: '8px',
          }}>
           {dayNames.map(day => (
  <div key={day} className="calendar-header calendar-day-name" style={{ 
    fontWeight: '700', 
    textAlign: 'center',
    padding: '8px',
    color: colors.primary,
  }}>
    {day}
  </div>
))}
          </div>

          {/* Days Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
          }}>
            {renderCalendarDays()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== STATISTICS VIEW =====
const StatisticsView = ({ onBack }) => {
  const { teams, players, events } = useAppContext();
  const [selectedTeam, setSelectedTeam] = useState('');

  const teamPlayers = selectedTeam ? players[selectedTeam] || [] : [];

  const playersWithStats = useMemo(() => {
    return teamPlayers.map(player => ({
      ...player,
      stats: calculatePlayerStats(player, events.filter(e => e.teamId === selectedTeam))
    })).sort((a, b) => b.stats.percentage - a.stats.percentage);
  }, [teamPlayers, events, selectedTeam]);

  const teamStats = useMemo(() => {
    if (!selectedTeam) return null;
    
    const teamEvents = events.filter(e => e.teamId === selectedTeam);
    const totalEvents = teamEvents.length;
    
    let totalResponses = 0;
    let totalPresenti = 0;
    
    teamEvents.forEach(event => {
      totalResponses += Object.keys(event.responses).length;
      totalPresenti += Object.values(event.responses).filter(r => r.status === 'presente').length;
    });
    
    const avgResponseRate = totalEvents > 0 ? Math.round((totalResponses / (totalEvents * teamPlayers.length)) * 100) : 0;
    const avgPresenceRate = totalResponses > 0 ? Math.round((totalPresenti / totalResponses) * 100) : 0;
    
    return { totalEvents, avgResponseRate, avgPresenceRate };
  }, [selectedTeam, events, teamPlayers]);

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>📊 Statistiche Presenze</div>
            <div style={styles.headerSubtitle}>Analisi dettagliate e grafici</div>
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
            options={Object.values(teams).map(t => ({ value: t.id, label: t.name }))}
          />
        </div>

        {!selectedTeam ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px', color: colors.gray }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
              <div style={{ fontSize: '18px' }}>Seleziona una squadra per visualizzare le statistiche</div>
            </div>
          </div>
        ) : (
          <>
            {/* Team Overview Stats */}
            {teamStats && (
              <div style={styles.card}>
                <h3 style={{ marginBottom: '16px', color: colors.primary }}>📈 Statistiche Squadra</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}>
                  <div style={{ textAlign: 'center', padding: '20px', backgroundColor: colors.background, borderRadius: '8px' }}>
                    <div style={{ fontSize: '36px', fontWeight: '700', color: colors.primary }}>
                      {teamStats.totalEvents}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.gray }}>Eventi Totali</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '20px', backgroundColor: colors.background, borderRadius: '8px' }}>
                    <div style={{ fontSize: '36px', fontWeight: '700', color: colors.secondary }}>
                      {teamStats.avgResponseRate}%
                    </div>
                    <div style={{ fontSize: '14px', color: colors.gray }}>Tasso Risposta Medio</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '20px', backgroundColor: colors.background, borderRadius: '8px' }}>
                    <div style={{ fontSize: '36px', fontWeight: '700', color: colors.success }}>
                      {teamStats.avgPresenceRate}%
                    </div>
                    <div style={{ fontSize: '14px', color: colors.gray }}>Tasso Presenza Medio</div>
                  </div>
                </div>
              </div>
            )}

            {/* Players Stats Table */}
            <div style={styles.card}>
              <h3 style={{ marginBottom: '16px', color: colors.primary }}>
                🏆 Classifica Presenze Giocatori
              </h3>

              {playersWithStats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: colors.gray }}>
                  Nessun giocatore in questa squadra
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${colors.lightGray}` }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Giocatore</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Eventi</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Presenze</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Assenze</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>% Presenza</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Grafico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playersWithStats.map((player, index) => (
                        <tr key={player.id} style={{ 
                          borderBottom: `1px solid ${colors.lightGray}`,
                          backgroundColor: index % 2 === 0 ? colors.white : colors.background,
                        }}>
                          <td style={{ padding: '12px', fontWeight: '700' }}>{index + 1}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: '600' }}>{player.name}</div>
                            <div style={{ fontSize: '12px', color: colors.gray }}>
                              #{player.number} • {player.role}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                            {player.stats.total}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: colors.success, fontWeight: '600' }}>
                            {player.stats.presenti}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: colors.danger, fontWeight: '600' }}>
                            {player.stats.assenti}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <Badge 
                              text={`${player.stats.percentage}%`}
                              variant={
                                player.stats.percentage >= 80 ? 'success' :
                                player.stats.percentage >= 60 ? 'warning' : 'danger'
                              }
                            />
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ 
                              width: '100%', 
                              height: '20px', 
                              backgroundColor: colors.lightGray,
                              borderRadius: '10px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                width: `${player.stats.percentage}%`,
                                height: '100%',
                                backgroundColor: 
                                  player.stats.percentage >= 80 ? colors.success :
                                  player.stats.percentage >= 60 ? colors.warning : colors.danger,
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top 3 Players */}
            {playersWithStats.length >= 3 && (
              <div style={styles.card}>
                <h3 style={{ marginBottom: '16px', color: colors.primary }}>🥇 Top 3 Giocatori</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  {playersWithStats.slice(0, 3).map((player, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={player.id} style={{
                        padding: '20px',
                        backgroundColor: colors.background,
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: `3px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}`,
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{medals[index]}</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                          {player.name}
                        </div>
                        <div style={{ fontSize: '14px', color: colors.gray, marginBottom: '12px' }}>
                          #{player.number} • {player.role}
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
                          {player.stats.percentage}%
                        </div>
                        <div style={{ fontSize: '12px', color: colors.gray }}>
                          {player.stats.presenti}/{player.stats.total} presenze
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ===== TEAMS MANAGEMENT =====
const TeamsList = ({ onNavigate, onBack }) => {
  const { teams, addTeam, updateTeam, deleteTeam, players } = useAppContext();
  const { addNotification } = useNotification();

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: '', color: colors.primary, icon: '⚽' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Icone disponibili a tema calcio
  const availableIcons = [
    '⚽', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '💫', 
    '🎯', '🔥', '⚡', '👕', '🛡️', '🏃', '🦅', '🦁',
    '🐺', '🐯', '🐉', '🚀', '⚔️', '🎖️', '🏅', '👑'
  ];

  const handleOpenModal = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({ name: team.name, category: team.category, color: team.color, icon: team.icon || '⚽' });
    } else {
      setEditingTeam(null);
      setFormData({ name: '', category: '', color: colors.primary, icon: '⚽' });
    }
    setShowModal(true);
  };

  const handleSave = () => {
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
        ...formData,
      };
      addTeam(newTeam);
      addNotification('Squadra creata', 'success');
    }

    setShowModal(false);
    setEditingTeam(null);
    setFormData({ name: '', category: '', color: colors.primary, icon: '⚽' });
  };

  const handleDelete = (teamId) => {
    deleteTeam(teamId);
    addNotification('Squadra eliminata', 'success');
    setShowDeleteConfirm(null);
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>🏆 Gestione Squadre</div>
            <div style={styles.headerSubtitle}>Crea e gestisci le tue squadre</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>
      <div style={styles.content}>
        <Button
          title="➕ Aggiungi Squadra"
          onPress={() => handleOpenModal()}
          variant="success"
          style={{ marginBottom: '24px', width: '100%', padding: '16px' }}
        />

        {Object.values(teams).length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px', color: colors.gray }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
              <div style={{ fontSize: '18px' }}>Nessuna squadra creata</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.values(teams).map(team => {
              const teamPlayersCount = players[team.id]?.length || 0;
              return (
                <div key={team.id} style={{
                  ...styles.card,
                  border: `3px solid ${team.color}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Background decorativo con colore squadra */}
                  <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: '120px',
                    height: '120px',
                    backgroundColor: team.color,
                    opacity: 0.1,
                    borderRadius: '50%',
                  }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', position: 'relative' }}>
                    {/* Icona grande e bella */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      backgroundColor: `${team.color}20`,
                      border: `3px solid ${team.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      boxShadow: colors.shadow,
                    }}>
                      {team.icon || '⚽'}
                    </div>
                    <Badge text={team.category} variant="primary" />
                  </div>

                  <h3 style={{ marginBottom: '8px', color: team.color, fontSize: '22px', fontWeight: '700' }}>
                    {team.name}
                  </h3>
                  <div style={{ 
                    color: colors.gray, 
                    fontSize: '14px', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '20px' }}>👥</span>
                    <span style={{ fontWeight: '600' }}>{teamPlayersCount} giocatori</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      title="✏️ Modifica"
                      onPress={() => handleOpenModal(team)}
                      variant="secondary"
                      style={{ flex: 1, padding: '10px' }}
                    />
                    <Button
                      title="🗑️"
                      onPress={() => setShowDeleteConfirm(team.id)}
                      variant="danger"
                      style={{ padding: '10px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Crea/Modifica */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '600px',
              margin: '20px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <h3 style={{ marginBottom: '24px', color: colors.primary }}>
                {editingTeam ? '✏️ Modifica Squadra' : '➕ Nuova Squadra'}
              </h3>

              <Input
                label="Nome Squadra"
                value={formData.name}
                onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                placeholder="Es: Prima Squadra"
                required
              />

              <Input
                label="Categoria"
                value={formData.category}
                onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                placeholder="Es: Seniores, Under 19..."
                required
              />

              {/* Selezione Icona */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '12px',
                  fontWeight: '600',
                  color: colors.black,
                  fontSize: '14px',
                }}>
                  Icona Squadra <span style={{ color: colors.danger }}>*</span>
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '8px',
                  padding: '16px',
                  backgroundColor: colors.background,
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {availableIcons.map(icon => (
                    <div
                      key={icon}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      style={{
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        border: `3px solid ${formData.icon === icon ? colors.primary : colors.lightGray}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: formData.icon === icon ? `${colors.primary}20` : colors.white,
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = colors.shadow;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {icon}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Icona Selezionata */}
              <div style={{
                padding: '16px',
                backgroundColor: colors.background,
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '14px', color: colors.gray, marginBottom: '8px' }}>
                  Anteprima:
                </div>
                <div style={{
                  display: 'inline-block',
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  backgroundColor: `${formData.color}20`,
                  border: `3px solid ${formData.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                }}>
                  {formData.icon}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: colors.black,
                  fontSize: '14px',
                }}>
                  Colore Squadra
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '50px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  title="Salva"
                  onPress={handleSave}
                  variant="success"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Annulla"
                  onPress={() => {
                    setShowModal(false);
                    setEditingTeam(null);
                  }}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Conferma Eliminazione */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '500px',
              margin: '20px',
            }}>
              <h3 style={{ marginBottom: '16px', color: colors.danger }}>⚠️ Conferma Eliminazione</h3>
              <p style={{ marginBottom: '24px', color: colors.gray }}>
                Sei sicuro di voler eliminare questa squadra? Verranno eliminati anche tutti i giocatori e gli eventi associati.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  title="Elimina"
                  onPress={() => handleDelete(showDeleteConfirm)}
                  variant="danger"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Annulla"
                  onPress={() => setShowDeleteConfirm(null)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== PLAYERS MANAGEMENT =====
const PlayersList = ({ onNavigate, onBack }) => {
  const { teams, players, addPlayer, updatePlayer, deletePlayer } = useAppContext();
  const { addNotification } = useNotification();

  const [selectedTeam, setSelectedTeam] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    number: '',
    phone: '',
    email: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleOpenModal = (player = null, teamId = null) => {
    if (player) {
      setEditingPlayer({ ...player, teamId });
      setFormData({
        name: player.name,
        role: player.role,
        number: player.number,
        phone: player.phone || '',
        email: player.email || '',
      });
    } else {
      setEditingPlayer(null);
      setFormData({
        name: '',
        role: '',
        number: '',
        phone: '',
        email: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    const teamId = editingPlayer?.teamId || selectedTeam;

    if (!teamId) {
      addNotification('Seleziona una squadra', 'error');
      return;
    }

    if (!formData.name || !formData.role || !formData.number) {
      addNotification('Compila tutti i campi obbligatori', 'error');
      return;
    }

    if (editingPlayer) {
      updatePlayer(teamId, editingPlayer.id, formData);
      addNotification('Giocatore aggiornato', 'success');
    } else {
      const newPlayer = {
        id: `p${Date.now()}`,
        ...formData,
        number: parseInt(formData.number),
      };
      addPlayer(teamId, newPlayer);
      addNotification('Giocatore aggiunto', 'success');
    }

    setShowModal(false);
    setEditingPlayer(null);
    setFormData({
      name: '',
      role: '',
      number: '',
      phone: '',
      email: '',
    });
  };

  const handleDelete = (teamId, playerId) => {
    deletePlayer(teamId, playerId);
    addNotification('Giocatore eliminato', 'success');
    setShowDeleteConfirm(null);
  };

  const teamsList = Object.values(teams);
  const currentTeamPlayers = selectedTeam ? players[selectedTeam] || [] : [];

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>👥 Gestione Giocatori</div>
            <div style={styles.headerSubtitle}>Gestisci i giocatori delle tue squadre</div>
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
            options={teamsList.map(t => ({ value: t.id, label: t.name }))}
          />
        </div>

        {selectedTeam && (
          <Button
            title="➕ Aggiungi Giocatore"
            onPress={() => handleOpenModal()}
            variant="success"
            style={{ marginBottom: '24px', width: '100%', padding: '16px' }}
          />
        )}

        {!selectedTeam ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px', color: colors.gray }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
              <div style={{ fontSize: '18px' }}>Seleziona una squadra per visualizzare i giocatori</div>
            </div>
          </div>
        ) : currentTeamPlayers.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px', color: colors.gray }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
              <div style={{ fontSize: '18px' }}>Nessun giocatore in questa squadra</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {currentTeamPlayers.map(player => (
              <div key={player.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
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
                  <Badge text={player.role} variant="primary" />
                </div>

                <h3 style={{ marginBottom: '8px', color: colors.primary }}>{player.name}</h3>
                
                {player.phone && (
                  <div style={{ fontSize: '14px', color: colors.gray, marginBottom: '4px' }}>
                    📱 {player.phone}
                  </div>
                )}
                {player.email && (
                  <div style={{ fontSize: '14px', color: colors.gray, marginBottom: '16px' }}>
                    ✉️ {player.email}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button
                    title="✏️ Modifica"
                    onPress={() => handleOpenModal(player, selectedTeam)}
                    variant="secondary"
                    style={{ flex: 1, padding: '10px' }}
                  />
                  <Button
                    title="🗑️"
                    onPress={() => setShowDeleteConfirm({ teamId: selectedTeam, playerId: player.id })}
                    variant="danger"
                    style={{ padding: '10px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Crea/Modifica */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '500px',
              margin: '20px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <h3 style={{ marginBottom: '24px', color: colors.primary }}>
                {editingPlayer ? '✏️ Modifica Giocatore' : '➕ Nuovo Giocatore'}
              </h3>

              <Input
                label="Nome Completo"
                value={formData.name}
                onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                placeholder="Es: Marco Rossi"
                required
              />

              <Select
                label="Ruolo"
                value={formData.role}
                onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
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
                onChange={(val) => setFormData(prev => ({ ...prev, number: val }))}
                placeholder="Es: 10"
                required
              />

              <Input
                label="Telefono"
                value={formData.phone}
                onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
                placeholder="Es: 333-1234567"
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
                placeholder="Es: giocatore@email.com"
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  title="Salva"
                  onPress={handleSave}
                  variant="success"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Annulla"
                  onPress={() => {
                    setShowModal(false);
                    setEditingPlayer(null);
                  }}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Conferma Eliminazione */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '500px',
              margin: '20px',
            }}>
              <h3 style={{ marginBottom: '16px', color: colors.danger }}>⚠️ Conferma Eliminazione</h3>
              <p style={{ marginBottom: '24px', color: colors.gray }}>
                Sei sicuro di voler eliminare questo giocatore?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  title="Elimina"
                  onPress={() => handleDelete(showDeleteConfirm.teamId, showDeleteConfirm.playerId)}
                  variant="danger"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Annulla"
                  onPress={() => setShowDeleteConfirm(null)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// ===== USERS MANAGEMENT (ADMIN ONLY) =====
const UsersList = ({ onBack }) => {
  const { addNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  // Carica utenti dal database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/db?table=user_roles');
        const data = await response.json();
        setUsers(data.user_roles || []);
      } catch (error) {
        console.error('Errore caricamento utenti:', error);
        addNotification('Errore caricamento utenti', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Approva/Modifica ruolo utente
  const handleUpdateRole = async (userId, role) => {
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_role',
          id: userId,
          data: { role, approved_by: 'admin', updated_at: new Date().toISOString() }
        })
      });

      if (response.ok) {
        // Aggiorna la lista locale
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role, approved_by: 'admin' } : u
        ));
        addNotification('Ruolo aggiornato con successo', 'success');
        setSelectedUser(null);
        setNewRole('');
      } else {
        addNotification('Errore aggiornamento ruolo', 'error');
      }
    } catch (error) {
      console.error('Errore:', error);
      addNotification('Errore aggiornamento ruolo', 'error');
    }
  };

  // Elimina utente
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) return;

    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_user_role',
          id: userId
        })
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        addNotification('Utente eliminato', 'success');
      } else {
        addNotification('Errore eliminazione utente', 'error');
      }
    } catch (error) {
      console.error('Errore:', error);
      addNotification('Errore eliminazione utente', 'error');
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return { text: '👔 Admin', variant: 'danger' };
      case 'coach': return { text: '🎽 Allenatore', variant: 'primary' };
      case 'player': return { text: '⚽ Giocatore', variant: 'success' };
      default: return { text: '⏳ In Attesa', variant: 'warning' };
    }
  };

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>👤 Gestione Utenti</div>
            <div style={styles.headerSubtitle}>Approva e gestisci gli accessi</div>
          </div>
          <Button title="← Indietro" onPress={onBack} variant="outline" style={{ color: colors.white, borderColor: colors.white }} />
        </div>
      </div>

      <div style={styles.content}>
        {isLoading ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
              <div style={{ fontSize: '18px' }}>Caricamento utenti...</div>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px', color: colors.gray }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👤</div>
              <div style={{ fontSize: '18px' }}>Nessun utente registrato</div>
            </div>
          </div>
        ) : (
          <>
            {/* Statistiche */}
            <div style={styles.card}>
              <h3 style={{ marginBottom: '16px', color: colors.primary }}>📊 Riepilogo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: colors.danger }}>
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.gray }}>Admin</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
                    {users.filter(u => u.role === 'coach').length}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.gray }}>Allenatori</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
                    {users.filter(u => u.role === 'player').length}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.gray }}>Giocatori</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
                    {users.filter(u => u.role === 'pending').length}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.gray }}>In Attesa</div>
                </div>
              </div>
            </div>

            {/* Lista Utenti */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {users.map(user => {
                const badge = getRoleBadge(user.role);
                return (
                  <div key={user.id} style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', wordBreak: 'break-all' }}>
                          {user.email}
                        </div>
                        <Badge text={badge.text} variant={badge.variant} />
                      </div>
                    </div>

                    {user.approved_by && (
                      <div style={{ fontSize: '12px', color: colors.gray, marginBottom: '16px' }}>
                        ✅ Approvato da: {user.approved_by}
                      </div>
                    )}

                   <div style={{ display: 'flex', gap: '8px' }}>
  {user.email !== 'giovannibuoli@gmail.com' ? (
    <>
      <Button
        title="✏️ Modifica"
        onPress={() => {
          setSelectedUser(user);
          setNewRole(user.role);
        }}
        variant="secondary"
        style={{ flex: 1, padding: '10px' }}
      />
      <Button
        title="🗑️"
        onPress={() => handleDeleteUser(user.id)}
        variant="danger"
        style={{ padding: '10px' }}
      />
    </>
  ) : (
    <div style={{
      padding: '10px',
      backgroundColor: `${colors.primary}20`,
      borderRadius: '8px',
      textAlign: 'center',
      color: colors.primary,
      fontWeight: '600',
      fontSize: '14px',
    }}>
      👑 Super Admin - Protetto
    </div>
  )}
</div> 
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Modal Modifica Ruolo */}
        {selectedUser && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '500px',
              margin: '20px',
            }}>
              <h3 style={{ marginBottom: '16px', color: colors.primary }}>
                ✏️ Modifica Ruolo Utente
              </h3>
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: colors.background, borderRadius: '8px' }}>
                <strong>Email:</strong><br/>
                <span style={{ fontSize: '14px', wordBreak: 'break-all' }}>{selectedUser.email}</span>
              </div>

              <Select
                label="Ruolo"
                value={newRole}
                onChange={setNewRole}
                options={[
                  { value: 'admin', label: '👔 Amministratore' },
                  { value: 'coach', label: '🎽 Allenatore' },
                  { value: 'player', label: '⚽ Giocatore' },
                  { value: 'pending', label: '⏳ In Attesa' },
                ]}
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button
                  title="💾 Salva"
                  onPress={() => handleUpdateRole(selectedUser.id, newRole)}
                  variant="success"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Annulla"
                  onPress={() => {
                    setSelectedUser(null);
                    setNewRole('');
                  }}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// ===== PLAYER EVENTS (convocazioni per giocatore) =====
const PlayerEvents = ({ onLogout }) => {
  const { events, teams, players, addEventResponse } = useAppContext();
  const { addNotification } = useNotification();
  
  // Per demo, usiamo il primo giocatore della prima squadra
  const firstTeamId = Object.keys(players)[0];
  const currentPlayer = players[firstTeamId]?.[0];

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [responseData, setResponseData] = useState({ status: '', note: '' });

  const myEvents = useMemo(() => {
    if (!currentPlayer) return [];
    return events
      .filter(e => e.convocati?.includes(currentPlayer.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events, currentPlayer]);

  const handleResponse = (eventId, status) => {
    setSelectedEventId(eventId);
    setResponseData({ status, note: '' });
  };

  const submitResponse = () => {
    if (!selectedEventId || !responseData.status) return;

    addEventResponse(selectedEventId, currentPlayer.id, responseData);
    addNotification('Risposta inviata con successo! ✅', 'success');
    setSelectedEventId(null);
    setResponseData({ status: '', note: '' });
  };

  if (!currentPlayer) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px' }}>
              Nessun giocatore configurato
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  // Calcola statistiche personali
  const totalEvents = myEvents.length;
  const respondedEvents = myEvents.filter(e => e.responses[currentPlayer.id]).length;
  const presentCount = myEvents.filter(e => e.responses[currentPlayer.id]?.status === 'presente').length;
  const percentage = totalEvents > 0 ? Math.round((presentCount / totalEvents) * 100) : 0;

  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>⚽ Le Mie Convocazioni</div>
            <div style={styles.headerSubtitle}>{currentPlayer.name} • #{currentPlayer.number}</div>
          </div>
        <UserButton />
        </div>
      </div>
      <div style={styles.content}>
        {/* Statistiche Personali */}
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', color: colors.primary }}>📊 Le Mie Statistiche</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
          }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
                {totalEvents}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Convocazioni</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.secondary }}>
                {respondedEvents}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Risposte Date</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
                {presentCount}
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Presenze</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: percentage >= 80 ? colors.success : percentage >= 60 ? colors.warning : colors.danger }}>
                {percentage}%
              </div>
              <div style={{ fontSize: '14px', color: colors.gray }}>Presenza</div>
            </div>
          </div>
        </div>
        {myEvents.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '48px', color: colors.gray }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
              <div style={{ fontSize: '18px' }}>Nessuna convocazione al momento</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {myEvents.map(event => {
              const team = teams[event.teamId];
              const myResponse = event.responses[currentPlayer.id];
              const needsResponse = !myResponse && isFuture(event.date);

              return (
                <div key={event.id} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                        <Badge
                          text={event.type.toUpperCase()}
                          variant={event.type === 'partita' ? 'danger' : event.type === 'allenamento' ? 'success' : 'primary'}
                        />
                        {needsResponse && <Badge text="⚠️ RICHIEDE RISPOSTA" variant="warning" />}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                        {event.type === 'allenamento' ? '🏃' : event.type === 'partita' ? '⚽' : '📋'} {event.title}
                      </div>
                      <div style={{ color: colors.gray, fontSize: '14px' }}>
                        🏆 {team?.name}
                      </div>
                    </div>
                    {myResponse && (
                      <Badge
                        text={myResponse.status === 'presente' ? '✓ PRESENTE' : myResponse.status === 'assente' ? '✗ ASSENTE' : '? FORSE'}
                        variant={myResponse.status === 'presente' ? 'success' : myResponse.status === 'assente' ? 'danger' : 'warning'}
                      />
                    )}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: colors.gray, marginBottom: '4px' }}>
                      📅 {formatDateTime(event.date, event.time)} • {getDayName(event.date)}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.gray }}>
                      📍 {event.location}
                    </div>
                    {event.opponent && (
                      <div style={{ fontSize: '14px', color: colors.gray }}>
                        🆚 {event.opponent}
                      </div>
                    )}
                    {event.description && (
                      <div style={{ fontSize: '14px', color: colors.gray, marginTop: '8px' }}>
                        📝 {event.description}
                      </div>
                    )}
                  </div>

                  {myResponse ? (
                    <div style={{
                      padding: '16px',
                      backgroundColor: colors.background,
                      borderRadius: '8px',
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✅ La tua risposta:
                        <Badge
                          text={myResponse.status === 'presente' ? '✓ PRESENTE' : myResponse.status === 'assente' ? '✗ ASSENTE' : '? FORSE'}
                          variant={myResponse.status === 'presente' ? 'success' : myResponse.status === 'assente' ? 'danger' : 'warning'}
                        />
                      </div>
                      {myResponse.note && (
                        <div style={{ 
                          fontSize: '14px', 
                          color: colors.gray, 
                          marginBottom: '8px',
                          padding: '8px',
                          backgroundColor: colors.white,
                          borderRadius: '6px',
                        }}>
                          💬 <strong>Nota:</strong> {myResponse.note}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: colors.gray, marginBottom: '16px' }}>
                        🕐 Risposto il {formatDate(myResponse.respondedAt)} alle {new Date(myResponse.respondedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {isFuture(event.date) && (
                        <Button
                          title="✏️ Modifica Risposta"
                          onPress={() => handleResponse(event.id, myResponse.status)}
                          variant="secondary"
                          style={{ width: '100%' }}
                        />
                      )}
                    </div>
                  ) : isFuture(event.date) ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button
                        title="✓ Presente"
                        onPress={() => handleResponse(event.id, 'presente')}
                        variant="success"
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="? Forse"
                        onPress={() => handleResponse(event.id, 'forse')}
                        variant="secondary"
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="✗ Assente"
                        onPress={() => handleResponse(event.id, 'assente')}
                        variant="danger"
                        style={{ flex: 1 }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      padding: '16px',
                      backgroundColor: colors.background,
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: colors.gray,
                    }}>
                      Evento passato - Nessuna risposta registrata
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Risposta */}
        {selectedEventId && selectedEvent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              ...styles.card,
              maxWidth: '500px',
              margin: '20px',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <h3 style={{ marginBottom: '16px', color: colors.primary }}>
                {selectedEvent.responses[currentPlayer.id] ? '✏️ Modifica la tua risposta' : '📝 Conferma la tua presenza'}
              </h3>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: '700', marginBottom: '8px', fontSize: '16px' }}>
                  {selectedEvent.type === 'allenamento' ? '🏃' : selectedEvent.type === 'partita' ? '⚽' : '📋'} {selectedEvent.title}
                </div>
                <div style={{ fontSize: '14px', color: colors.gray, marginBottom: '4px' }}>
                  📅 {formatDateTime(selectedEvent.date, selectedEvent.time)}
                </div>
                <div style={{ fontSize: '14px', color: colors.gray }}>
                  📍 {selectedEvent.location}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '12px', fontWeight: '600' }}>Seleziona la tua disponibilità:</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div
                    onClick={() => setResponseData(prev => ({ ...prev, status: 'presente' }))}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '16px',
                      border: `3px solid ${responseData.status === 'presente' ? colors.success : colors.lightGray}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: responseData.status === 'presente' ? `${colors.success}20` : colors.white,
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = colors.shadow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
                    <div style={{ fontWeight: '700', color: colors.success }}>PRESENTE</div>
                  </div>
                  <div
                    onClick={() => setResponseData(prev => ({ ...prev, status: 'forse' }))}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '16px',
                      border: `3px solid ${responseData.status === 'forse' ? colors.warning : colors.lightGray}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: responseData.status === 'forse' ? `${colors.warning}20` : colors.white,
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = colors.shadow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>?</div>
                    <div style={{ fontWeight: '700', color: colors.warning }}>FORSE</div>
                  </div>
                  <div
                    onClick={() => setResponseData(prev => ({ ...prev, status: 'assente' }))}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '16px',
                      border: `3px solid ${responseData.status === 'assente' ? colors.danger : colors.lightGray}`,
                      borderRadius: '8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: responseData.status === 'assente' ? `${colors.danger}20` : colors.white,
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = colors.shadow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✗</div>
                    <div style={{ fontWeight: '700', color: colors.danger }}>ASSENTE</div>
                  </div>
                </div>
              </div>

              <Textarea
                label="Note (opzionale)"
                value={responseData.note}
                onChange={(val) => setResponseData(prev => ({ ...prev, note: val }))}
                placeholder="Es: Arrivo 10 minuti prima, Problemi fisici, ecc..."
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  title={selectedEvent.responses[currentPlayer.id] ? "💾 Aggiorna Risposta" : "📤 Invia Risposta"}
                  onPress={submitResponse}
                  variant="success"
                  style={{ flex: 1 }}
                  disabled={!responseData.status}
                />
                <Button
                  title="Annulla"
                  onPress={() => {
                    setSelectedEventId(null);
                    setResponseData({ status: '', note: '' });
                  }}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== MAIN APP =====
const MainApp = () => {
  console.log('⚽ Componente MainApp renderizzato!');
  
  const [currentScreen, setCurrentScreen] = useState('role-selection');  
  const [currentRole, setCurrentRole] = useState('');
  const [screenData, setScreenData] = useState(null);
// Nuovi stati per controllo ruoli
const [userRoleStatus, setUserRoleStatus] = useState('checking'); 
const [isCheckingAuth, setIsCheckingAuth] = useState(true);
const [userRoleData, setUserRoleData] = useState(null);
const { user } = useUser(); // Hook Clerk per ottenere dati utente
// Controllo ruolo utente al login
useEffect(() => {
  const checkUserRole = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setIsCheckingAuth(false);
      return;
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    console.log('🔍 Controllo ruolo per:', userEmail);

    try {
      // Query al database user_roles
      const response = await fetch('/api/db?table=user_roles&email=' + encodeURIComponent(userEmail));
      const data = await response.json();

      if (data.user_roles && data.user_roles.length > 0) {
        const roleData = data.user_roles[0];
        
        // Controlla il ruolo
        if (['admin', 'coach', 'player'].includes(roleData.role)) {
          console.log('✅ Utente autorizzato:', roleData.role);
          setUserRoleData(roleData);
          setUserRoleStatus('authorized');
          setCurrentRole(roleData.role);
        } else {
          console.log('⏳ Utente in attesa di approvazione');
          setUserRoleStatus('pending');
        }
      } else {
        console.log('❌ Utente non trovato nel database');
        setUserRoleStatus('pending');
      }
    } catch (error) {
      console.error('❌ Errore controllo ruolo:', error);
      setUserRoleStatus('unauthorized');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (user) {
    checkUserRole();
  }
}, [user]);

const [pwaInstalled, setPwaInstalled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

// ===== PWA SERVICE WORKER =====
  useEffect(() => {
    // Controlla se l'app è già installata
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setPwaInstalled(isStandalone);

    // Registra Service Worker con callbacks
    const onSuccess = (registration) => {
      console.log('✅ Service Worker registrato con successo:', registration.scope);
      setServiceWorkerReady(true);
    };

    const onUpdate = (registration) => {
      console.log('🔄 Service Worker aggiornato!');
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    const onRegistered = (registration) => {
      console.log('📝 Service Worker in fase di registrazione...');
    };

    registerServiceWorker({
      onSuccess,
      onUpdate,
      onRegistered
    });

    // Richiedi permessi notifiche dopo 3 secondi
    const notificationTimer = setTimeout(() => {
      NotificationManager.requestNotificationPermission().then(granted => {
        setNotificationsEnabled(granted);
        if (granted) {
          // Invia notifica di test
          NotificationManager.sendTestNotification();
        }
      });
    }, 3000);

    // Listener per quando l'app viene installata
    const handleAppInstalled = () => {
      console.log('🎉 App installata con successo!');
      setPwaInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(notificationTimer);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  // Loading screen durante controllo autorizzazione
if (isCheckingAuth) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔐</div>
        <div style={{ fontSize: '18px', color: colors.primary }}>Verifica autorizzazione...</div>
      </div>
    </div>
  );
}

// Schermata "In attesa di approvazione"
if (userRoleStatus === 'pending') {
  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={{
        ...styles.header,
        background: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.accent} 100%)`,
      }}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>⏳ Account in Attesa</div>
            <div style={styles.headerSubtitle}>Academy Hub</div>
          </div>
          <UserButton />
        </div>
      </div>
      <div style={styles.content}>
        <div style={{
          ...styles.card,
          maxWidth: '600px',
          margin: '40px auto',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>⏳</div>
          <h2 style={{ marginBottom: '16px', color: colors.warning }}>
            Account in Attesa di Approvazione
          </h2>
          <p style={{ fontSize: '16px', color: colors.gray, marginBottom: '24px' }}>
            Il tuo account è stato creato con successo, ma è in attesa di approvazione 
            da parte di un amministratore.
          </p>
          <div style={{
            padding: '20px',
            backgroundColor: colors.background,
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '14px', color: colors.gray }}>
              <strong>Email registrata:</strong><br/>
              {user?.primaryEmailAddress?.emailAddress}
            </div>
          </div>
          <p style={{ fontSize: '14px', color: colors.gray }}>
            Riceverai una notifica via email quando il tuo account verrà attivato.
            <br/><br/>
            Per informazioni, contatta gli amministratori.
          </p>
        </div>
      </div>
    </div>
  );
}

// Schermata errore autorizzazione
if (userRoleStatus === 'unauthorized') {
  return (
    <div style={styles.container}>
      <style>{animations}</style>
      <div style={styles.content}>
        <div style={{
          ...styles.card,
          maxWidth: '600px',
          margin: '40px auto',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '80px', marginBottom: '24px' }}>❌</div>
          <h2 style={{ marginBottom: '16px', color: colors.danger }}>
            Errore di Autenticazione
          </h2>
          <p style={{ fontSize: '16px', color: colors.gray, marginBottom: '24px' }}>
            Si è verificato un errore durante la verifica delle tue credenziali.
          </p>
          <Button
            title="Riprova"
            onPress={() => window.location.reload()}
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
}
const handleLogin = () => {
  // Usa il ruolo dal database (già impostato da useEffect)
  if (currentRole === 'player') {
    setCurrentScreen('my-events');
  } else {
    setCurrentScreen('dashboard');
  }
};

  const handleLogout = () => {
    setCurrentRole('');
    setCurrentScreen('role-selection');
    setScreenData(null);
  };

  const handleNavigate = (screen, data = null) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const handleBack = () => {
    setCurrentScreen('dashboard');
    setScreenData(null);
  };

  return (
    <>
{currentScreen === 'role-selection' && userRoleStatus === 'authorized' && (
  <div>
    {/* Auto-redirect quando autorizzato */}
    {(() => {
      // Redirect automatico basato sul ruolo
      if (currentRole === 'player') {
        setCurrentScreen('my-events');
      } else {
        setCurrentScreen('dashboard');
      }
      return null;
    })()}
  </div>
)}
      {currentScreen === 'dashboard' && (
        <Dashboard role={currentRole} onNavigate={handleNavigate} onLogout={handleLogout} />
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
      {currentScreen === 'users' && (
  <UsersList onBack={handleBack} />
)}
      {currentScreen === 'events' && (
        <EventsList onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {currentScreen === 'create-event' && (
        <CreateEditEvent onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {currentScreen === 'edit-event' && (
        <CreateEditEvent onNavigate={handleNavigate} onBack={handleBack} eventId={screenData} />
      )}
      {currentScreen === 'event-detail' && (
        <EventDetail onNavigate={handleNavigate} onBack={handleBack} eventId={screenData} currentRole={currentRole} />
      )}
      {currentScreen === 'attendance' && (
        <AttendanceView onBack={handleBack} eventId={screenData} />
      )}
      {currentScreen === 'my-events' && (
        <PlayerEvents onLogout={handleLogout} />
      )}
      {!pwaInstalled && <InstallPrompt />}
    </>
  );
};

// Componente Root che deregistra il Service Worker vecchio
const App = () => {
  console.log('🚀 Componente App principale renderizzato!');
  
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showCookiePolicy, setShowCookiePolicy] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);

  // Deregistra Service Worker all'avvio per evitare problemi di cache
  useEffect(() => {
    console.log('🔧 useEffect di pulizia Service Worker attivato');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister().then(function(success) {
            if (success) {
              console.log('✅ Service Worker vecchio deregistrato');
            }
          });
        }
      });
      
      // Pulisci anche la cache
      if ('caches' in window) {
        caches.keys().then(function(names) {
          for (let name of names) {
            caches.delete(name);
            console.log('🗑️ Cache pulita:', name);
          }
        });
      }
    }
  }, []);

  // Loading screen mentre Clerk carica
  if (!clerkLoaded) {
    console.log('⏳ Clerk sta caricando...');
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      }}>
        <div style={{ textAlign: 'center', color: colors.white }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚽</div>
          <div style={{ fontSize: '18px' }}>Caricamento autenticazione...</div>
        </div>
      </div>
    );
  }

  console.log('✅ Clerk caricato! isSignedIn:', isSignedIn);

  return (
    <>
      {console.log('📍 Rendering return dell\'App principale...')}
      <NotificationProvider>
        <AppProvider>
          {!isSignedIn ? (
            // Utente NON loggato - mostra schermata login
            <>
              {console.log('🔓 Mostrando schermata login - Utente NON loggato')}
              <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              }}>
               <div style={{
        backgroundColor: colors.white,
        padding: '60px 50px',
        borderRadius: '24px',
        boxShadow: '0 25px 70px rgba(0,0,0,0.25)',
        textAlign: 'center',
        maxWidth: '480px',
        width: '92%',
        margin: '0 auto',
      }}>
                  <div style={{ fontSize: '80px', marginBottom: '24px' }}>⚽</div>
                  <h1 style={{ 
                    marginBottom: '12px', 
                    color: colors.primary,
                    fontSize: '32px',
                    fontWeight: 'bold',
                  }}>Academy Hub</h1>
                  <p style={{ 
                    marginBottom: '40px', 
                    color: colors.gray,
                    fontSize: '16px',
                  }}>
                    Sistema di Gestione Presenze Sportive
                  </p>
                  <SignIn 
                    routing="hash"
                    appearance={{
                      elements: {
                        rootBox: {
                          width: '100%',
                        },
                        card: {
                          boxShadow: 'none',
                          padding: 0,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            // Utente loggato - mostra app principale
            <>
              {console.log('🔐 Mostrando app principale - Utente loggato')}
              <MainApp />
            </>
          )}
        </AppProvider>
      </NotificationProvider>

      {/* GDPR Footer */}
      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#999',
        padding: '20px',
        textAlign: 'center',
        fontSize: '13px',
        borderTop: '1px solid #333',
        marginTop: '40px'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <button onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: '#64b5f6', cursor: 'pointer', textDecoration: 'underline', margin: '0 12px', fontSize: '13px' }}>
            Privacy Policy
          </button>
          <button onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: '#64b5f6', cursor: 'pointer', textDecoration: 'underline', margin: '0 12px', fontSize: '13px' }}>
            Termini e Condizioni
          </button>
          <button onClick={() => setShowCookiePolicy(true)} style={{ background: 'none', border: 'none', color: '#64b5f6', cursor: 'pointer', textDecoration: 'underline', margin: '0 12px', fontSize: '13px' }}>
            Cookie Policy
          </button>
          <button onClick={() => setShowDataManagement(true)} style={{ background: 'none', border: 'none', color: '#64b5f6', cursor: 'pointer', textDecoration: 'underline', margin: '0 12px', fontSize: '13px' }}>
            Gestisci i miei dati
          </button>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          © 2025 Academy Hub - Conforme GDPR (UE 2016/679)
        </div>
      </div>

      {/* Cookie Banner */}
      <CookieBanner />

      {/* GDPR Modals */}
      {showPrivacy && <PrivacyPolicy onBack={() => setShowPrivacy(false)} />}
      {showTerms && <TermsOfService onBack={() => setShowTerms(false)} />}
      {showCookiePolicy && <CookiePolicy onBack={() => setShowCookiePolicy(false)} />}
      {showDataManagement && <DataManagement onBack={() => setShowDataManagement(false)} />}
    </>
  );
};

export default App;
