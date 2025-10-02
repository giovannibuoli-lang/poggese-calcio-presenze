import React, { useState, useContext, createContext, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';

// ===== NOTIFICATION SYSTEM =====
const NotificationContext = createContext();

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => (
  <div style={{
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }}>
    {notifications.map(notification => (
      <NotificationItem 
        key={notification.id} 
        notification={notification} 
        onRemove={onRemove} 
      />
    ))}
  </div>
);

const NotificationItem = ({ notification, onRemove }) => {
  const getNotificationStyle = () => {
    const baseStyle = {
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      color: colors.secondary,
      fontWeight: '500',
      cursor: 'pointer',
      animation: 'slideInUp 0.3s ease-out',
      minWidth: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    };

    switch (notification.type) {
      case 'success':
        return { ...baseStyle, backgroundColor: colors.success };
      case 'error':
        return { ...baseStyle, backgroundColor: colors.danger };
      case 'warning':
        return { ...baseStyle, backgroundColor: colors.warning };
      default:
        return { ...baseStyle, backgroundColor: colors.primary };
    }
  };

  return (
    <div 
      style={getNotificationStyle()}
      onClick={() => onRemove(notification.id)}
    >
      <span>{notification.message}</span>
      <span style={{ marginLeft: '12px', cursor: 'pointer' }}>✕</span>
    </div>
  );
};

const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// ===== VALIDATION UTILITIES =====
const validators = {
  required: (value, fieldName) => {
    if (!value || value.trim() === '') {
      return `${fieldName} è obbligatorio`;
    }
    return null;
  },
  
  minLength: (value, min, fieldName) => {
    if (value && value.length < min) {
      return `${fieldName} deve contenere almeno ${min} caratteri`;
    }
    return null;
  },
  
  futureDate: (dateString, fieldName) => {
    const inputDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (inputDate < today) {
      return `${fieldName} deve essere oggi o nel futuro`;
    }
    return null;
  },
  
  validTime: (time, fieldName) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return `${fieldName} deve essere in formato HH:MM`;
    }
    return null;
  }
};

// ===== WHATSAPP UTILITIES =====
const whatsappUtils = {
  generateConvocationMessage: (event, team) => {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    const emoji = event.type === 'allenamento' ? '🏃‍♂️' : 
                  event.type === 'partita' ? '⚽' : '🎯';
    
    let message = `${emoji} *CONVOCAZIONE ${team.name.toUpperCase()}*\n\n`;
    message += `📋 *${event.title}*\n`;
    message += `📅 ${formattedDate}\n`;
    message += `🕐 ${event.startTime} - ${event.endTime}\n`;
    message += `📍 ${event.location.name}\n`;
    
    if (event.notes) {
      message += `\n💬 *Note del Mister:*\n${event.notes}\n`;
    }
    
    message += `\n✅ *CONFERMATE LA PRESENZA* rispondendo a questo messaggio o nell'app della squadra\n`;
    message += `⏰ Rispondere entro: ${new Date(eventDate.getTime() - 24*60*60*1000).toLocaleDateString('it-IT')}\n\n`;
    message += `Grazie! - ${team.coach.name}`;
    
    return message;
  },

  generateGroupLink: (message) => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/?text=${encodedMessage}`;
  },

  generatePlayerLink: (phone, message) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  },

  generateReminderMessage: (event, team, responses, players) => {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    const teamPlayers = players[team.id] || [];
    const eventResponses = responses.filter(r => r.eventId === event.id);
    const pendingPlayers = teamPlayers.filter(p => 
      !eventResponses.find(r => r.playerId === p.id)
    );
    
    let message = `⏰ *PROMEMORIA CONVOCAZIONE*\n\n`;
    message += `📋 *${event.title}*\n`;
    message += `📅 ${formattedDate}\n`;
    message += `🕐 ${event.startTime} - ${event.endTime}\n`;
    message += `📍 ${event.location.name}\n\n`;
    
    if (pendingPlayers.length > 0) {
      message += `⚠️ *Mancano ancora ${pendingPlayers.length} conferme:*\n`;
      pendingPlayers.forEach(player => {
        message += `• ${player.firstName} ${player.lastName}\n`;
      });
      message += `\nPer favore confermate al più presto!\n\n`;
    }
    
    message += `Grazie! - ${team.coach.name}`;
    
    return message;
  }
};

// ===== LOCALSTORAGE UTILITIES =====
const saveToStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error('Errore salvataggio localStorage:', error);
  }
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored, (key, value) => {
      if (value && value.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    });
    return parsed;
  } catch (error) {
    console.error('Errore caricamento localStorage:', error);
    return defaultValue;
  }
};

// ===== MOCK DATA & CONTEXT =====
const AppContext = createContext();

const mockTeams = {
  'team1': {
    id: 'team1',
    name: 'Juventus Youth U19',
    category: 'juniores',
    coach: { id: 'coach1', name: 'Mister Giuseppe' }
  }
};

const mockPlayers = {
  'team1': [
    { id: 'p1', firstName: 'Marco', lastName: 'Rossi', phone: '+393331234567', position: 'attaccante', jerseyNumber: 10, isActive: true },
    { id: 'p2', firstName: 'Luca', lastName: 'Bianchi', phone: '+393337654321', position: 'centrocampista', jerseyNumber: 8, isActive: true },
    { id: 'p3', firstName: 'Andrea', lastName: 'Verdi', phone: '+393339876543', position: 'difensore', jerseyNumber: 4, isActive: true },
    { id: 'p4', firstName: 'Matteo', lastName: 'Ferrari', phone: '+393331111111', position: 'portiere', jerseyNumber: 1, isActive: true },
    { id: 'p5', firstName: 'Davide', lastName: 'Romano', phone: '+393332222222', position: 'attaccante', jerseyNumber: 9, isActive: true },
    { id: 'p6', firstName: 'Lorenzo', lastName: 'Marino', phone: '+393333333333', position: 'centrocampista', jerseyNumber: 6, isActive: true },
    { id: 'p7', firstName: 'Francesco', lastName: 'Costa', phone: '+393334444444', position: 'difensore', jerseyNumber: 3, isActive: true },
    { id: 'p8', firstName: 'Alessandro', lastName: 'Ricci', phone: '+393335555555', position: 'centrocampista', jerseyNumber: 7, isActive: true }
  ]
};

// Dati iniziali per gli eventi
const initialEvents = [
  {
    id: 'event1',
    teamId: 'team1',
    type: 'allenamento',
    title: 'Allenamento Settimanale',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    startTime: '20:30',
    endTime: '22:00',
    location: { name: 'Campo Comunale' },
    notes: 'Portate i parastinchi e una bottiglietta d\'acqua',
    isPublished: true,
    responses: [],
    createdAt: new Date()
  },
  {
    id: 'event2',
    teamId: 'team1',
    type: 'partita',
    title: 'Partita vs Real Torino',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startTime: '15:00',
    endTime: '17:00',
    location: { name: 'Stadio Comunale' },
    notes: 'Ritrovo ore 14:00 negli spogliatoi',
    isPublished: true,
    responses: [],
    createdAt: new Date()
  }
];

// Risposte iniziali
const initialResponses = [
  { id: 'r1', eventId: 'event1', playerId: 'p1', status: 'presente', respondedAt: new Date() },
  { id: 'r2', eventId: 'event1', playerId: 'p2', status: 'assente', respondedAt: new Date() },
  { id: 'r3', eventId: 'event1', playerId: 'p3', status: 'incerto', respondedAt: new Date() },
  { id: 'r4', eventId: 'event2', playerId: 'p1', status: 'presente', respondedAt: new Date() }
];

// ===== DESIGN SYSTEM =====
const colors = {
  primary: '#1E88E5',
  primaryDark: '#1565C0',
  secondary: '#FFFFFF',
  accent: '#FF6B35',
  success: '#4CAF50',
  successLight: '#C8E6C9',
  warning: '#FF9800',
  warningLight: '#FFE0B2',
  danger: '#F44336',
  dangerLight: '#FFCDD2',
  text: '#212121',
  textSecondary: '#757575',
  background: '#F8FAFC',
  backgroundCard: '#FFFFFF',
  lightGray: '#E0E0E0',
  lightBlue: '#E3F2FD',
  gradient: 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
  shadow: '0 4px 20px rgba(30, 136, 229, 0.15)',
  shadowCard: '0 2px 12px rgba(0, 0, 0, 0.08)'
};

// Animazioni CSS
const animations = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
    minHeight: '100vh',
  },
  header: {
    background: colors.gradient,
    padding: '20px',
    paddingTop: '50px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: colors.shadow,
    position: 'relative',
    overflow: 'hidden'
  },
  headerContent: {
    zIndex: 2,
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
    pointerEvents: 'none'
  },
  headerTitle: {
    color: colors.secondary,
    fontSize: '24px',
    fontWeight: '700',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  headerSubtitle: {
    color: colors.secondary,
    fontSize: '14px',
    opacity: 0.9
  },
  content: {
    flex: 1,
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: colors.shadowCard,
    border: '1px solid rgba(0,0,0,0.04)',
    animation: 'slideInUp 0.5s ease-out',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default'
  },
  button: {
    background: colors.gradient,
    padding: '16px 24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: colors.shadowCard,
    minHeight: '48px'
  },
  buttonText: {
    color: colors.secondary,
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center'
  },
  secondaryButton: {
    background: 'transparent',
    border: `2px solid ${colors.primary}`,
    boxShadow: 'none'
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  dangerButton: {
    background: `linear-gradient(135deg, ${colors.danger} 0%, #D32F2F 100%)`,
  },
  successButton: {
    background: `linear-gradient(135deg, ${colors.success} 0%, #388E3C 100%)`,
  },
  warningButton: {
    background: `linear-gradient(135deg, ${colors.warning} 0%, #F57C00 100%)`,
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: colors.text,
    marginBottom: '8px',
    lineHeight: '1.2'
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '20px',
    lineHeight: '1.3'
  },
  text: {
    fontSize: '16px',
    color: colors.text,
    marginBottom: '8px',
    lineHeight: '1.5'
  },
  smallText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: '1.4'
  },
  input: {
    border: `2px solid ${colors.lightGray}`,
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    marginBottom: '16px',
    backgroundColor: colors.backgroundCard,
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box'
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  playerCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(0,0,0,0.04)',
    transition: 'all 0.2s ease',
    animation: 'slideInUp 0.3s ease-out'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '24px',
    minWidth: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease'
  },
  presentBadge: {
    backgroundColor: colors.successLight,
    color: colors.success
  },
  absentBadge: {
    backgroundColor: colors.dangerLight,
    color: colors.danger
  },
  uncertainBadge: {
    backgroundColor: colors.warningLight,
    color: colors.warning
  },
  pendingBadge: {
    backgroundColor: colors.lightBlue,
    color: colors.primary
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statItem: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: 'rgba(30, 136, 229, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(30, 136, 229, 0.1)'
  }
};

// ===== COMPONENTS =====
const StyleInjector = () => {
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = animations + `
      .button-hover:hover {
        transform: translateY(-2px);
        box-shadow: ${colors.shadow};
      }
      .input-focus:focus {
        border-color: ${colors.primary};
        box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
      }
      .card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.12);
      }
    `;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);
  return null;
};

const Button = ({ title, onPress, style, textStyle, disabled, variant = 'primary' }) => {
  const getButtonStyle = () => {
    const baseStyle = { ...styles.button, ...style };
    switch (variant) {
      case 'secondary': return { ...baseStyle, ...styles.secondaryButton };
      case 'success': return { ...baseStyle, ...styles.successButton };
      case 'warning': return { ...baseStyle, ...styles.warningButton };
      case 'danger': return { ...baseStyle, ...styles.dangerButton };
      default: return baseStyle;
    }
  };
  
  const getTextStyle = () => {
    const baseStyle = { ...styles.buttonText, ...textStyle };
    if (variant === 'secondary') return { ...baseStyle, ...styles.secondaryButtonText };
    return baseStyle;
  };

  return (
    <button 
      onClick={disabled ? null : onPress}
      className="button-hover"
      style={{
        ...getButtonStyle(),
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: variant === 'secondary' ? `2px solid ${colors.primary}` : 'none',
        outline: 'none'
      }}
      disabled={disabled}
    >
      <span style={getTextStyle()}>{title}</span>
    </button>
  );
};

const PlayerCard = ({ player, response, onStatusChange, isCoach = false }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'presente': return colors.success;
      case 'assente': return colors.danger;
      case 'incerto': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'presente': return '✅ Presente';
      case 'assente': return '❌ Assente';
      case 'incerto': return '❓ Incerto';
      default: return '⏳ In attesa';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'presente': return styles.presentBadge;
      case 'assente': return styles.absentBadge;
      case 'incerto': return styles.uncertainBadge;
      default: return styles.pendingBadge;
    }
  };

  const handleStatusChange = async (status) => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onStatusChange(status);
    setIsUpdating(false);
  };

  return (
    <div style={{
      ...styles.playerCard,
      opacity: isUpdating ? 0.7 : 1,
      transform: isUpdating ? 'scale(0.98)' : 'scale(1)'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: colors.text,
          marginBottom: '4px'
        }}>
          <span style={{ 
            display: 'inline-block',
            backgroundColor: colors.primary,
            color: colors.secondary,
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            marginRight: '8px',
            minWidth: '24px',
            textAlign: 'center'
          }}>
            {player.jerseyNumber}
          </span>
          {player.firstName} {player.lastName}
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: colors.textSecondary, 
          textTransform: 'capitalize',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{player.position}</span>
          {player.phone && (
            <span style={{ 
              fontSize: '12px', 
              color: colors.primary,
              backgroundColor: `${colors.primary}10`,
              padding: '2px 6px',
              borderRadius: '6px'
            }}>
              📱
            </span>
          )}
        </div>
      </div>
      
      {isCoach ? (
        <div style={{
          ...styles.statusBadge,
          ...getStatusBadgeStyle(response?.status),
        }}>
          <span style={{ color: getStatusColor(response?.status) }}>
            {getStatusText(response?.status)}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['presente', 'assente', 'incerto'].map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isUpdating}
              style={{
                ...styles.statusBadge,
                backgroundColor: response?.status === status ? getStatusColor(status) : colors.lightGray,
                border: 'none',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                minWidth: '44px',
                padding: '8px 12px',
                transition: 'all 0.2s ease',
                transform: response?.status === status ? 'scale(1.05)' : 'scale(1)'
              }}
              className={!isUpdating ? 'button-hover' : ''}
            >
              <span style={{ 
                color: response?.status === status ? colors.secondary : colors.text,
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {status === 'presente' ? '✅' : status === 'assente' ? '❌' : '❓'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== SCREENS =====
const AuthScreen = ({ onLogin }) => {
  const [userType, setUserType] = useState('coach');
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  
  const handleLogin = async (type) => {
  try {
    await signInAnonymously(auth);
    if (type === 'coach') {
      setCurrentUser({ type: 'coach', teamId: 'team1' });
      setCurrentScreen('coach-dashboard');
    } else {
      setCurrentUser({ type: 'player', teamId: 'team1', ...mockPlayers['team1'][0] });
      setCurrentScreen('player-dashboard');
    }
  } catch (error) {
    console.error('Errore login:', error);
    alert('Errore durante il login');
  }
};
  
  return (
    <div style={styles.container}>
      <StyleInjector />
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
        background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.lightBlue} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: `${colors.primary}15`,
          animation: 'pulse 3s infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: `${colors.success}10`,
          animation: 'pulse 4s infinite'
        }} />
        
        <div style={{
          ...styles.card,
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '20px',
              background: colors.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ⚽
            </div>
            <div style={{
              ...styles.title,
              background: colors.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px'
            }}>
              Convocazioni Calcio
            </div>
            <div style={{
              ...styles.text,
              color: colors.textSecondary,
              fontSize: '18px'
            }}>
              Gestione presenze semplice e veloce
            </div>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{...styles.subtitle, fontSize: '18px', marginBottom: '24px'}}>
              Seleziona il tuo ruolo:
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div
                onClick={() => setUserType('coach')}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${userType === 'coach' ? colors.primary : colors.lightGray}`,
                  backgroundColor: userType === 'coach' ? `${colors.primary}10` : colors.backgroundCard,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
                className="button-hover"
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: userType === 'coach' ? colors.gradient : colors.lightGray,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  👨‍🏫
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '16px',
                    color: userType === 'coach' ? colors.primary : colors.text,
                    marginBottom: '4px'
                  }}>
                    Allenatore / Dirigente
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: colors.textSecondary
                  }}>
                    Crea eventi e gestisci presenze
                  </div>
                </div>
                {userType === 'coach' && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: colors.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.secondary,
                    fontSize: '12px'
                  }}>
                    ✓
                  </div>
                )}
              </div>
              
              <div
                onClick={() => setUserType('player')}
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: `2px solid ${userType === 'player' ? colors.primary : colors.lightGray}`,
                  backgroundColor: userType === 'player' ? `${colors.primary}10` : colors.backgroundCard,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
                className="button-hover"
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: userType === 'player' ? colors.gradient : colors.lightGray,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  👦
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '16px',
                    color: userType === 'player' ? colors.primary : colors.text,
                    marginBottom: '4px'
                  }}>
                    Giocatore
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: colors.textSecondary
                  }}>
                    Rispondi alle convocazioni
                  </div>
                </div>
                {userType === 'player' && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: colors.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.secondary,
                    fontSize: '12px'
                  }}>
                    ✓
                  </div>
                )}
              </div>
            </div>
            
            <Button
              title={isLoading ? "ACCESSO IN CORSO..." : "ENTRA"}
              onPress={() => handleLogin(userType)}
              disabled={isLoading}
              style={{ 
                width: '100%',
                fontSize: '18px',
                fontWeight: '700'
              }}
            />
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: `${colors.lightBlue}30`,
            borderRadius: '8px',
            fontSize: '14px',
            color: colors.textSecondary
          }}>
            💡 <strong>Demo:</strong> Prova entrambe le modalità per esplorare tutte le funzionalità
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateEventScreen = ({ team, onSave, onCancel }) => {
  const { addNotification } = useNotification();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [eventData, setEventData] = useState({
    type: 'allenamento',
    title: '',
    date: tomorrow.toISOString().split('T')[0],
    startTime: '20:30',
    endTime: '22:00',
    location: 'Campo Comunale',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickActions = [
    { title: 'Allenamento Standard', time: '20:30', endTime: '22:00', type: 'allenamento' },
    { title: 'Partita Casa', time: '15:00', endTime: '17:00', type: 'partita' },
    { title: 'Allenamento Mattina', time: '10:00', endTime: '11:30', type: 'allenamento' }
  ];

  const validateForm = () => {
    const newErrors = {};

    const titleError = validators.required(eventData.title, 'Titolo') ||
                      validators.minLength(eventData.title, 3, 'Titolo');
    if (titleError) newErrors.title = titleError;

    const dateError = validators.required(eventData.date, 'Data') ||
                     validators.futureDate(eventData.date, 'Data');
    if (dateError) newErrors.date = dateError;

    const startTimeError = validators.validTime(eventData.startTime, 'Ora inizio');
    if (startTimeError) newErrors.startTime = startTimeError;

    const endTimeError = validators.validTime(eventData.endTime, 'Ora fine');
    if (endTimeError) newErrors.endTime = endTimeError;

    if (!startTimeError && !endTimeError) {
      const [startHour, startMin] = eventData.startTime.split(':');
      const [endHour, endMin] = eventData.endTime.split(':');
      const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
      const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
      
      if (startMinutes >= endMinutes) {
        newErrors.endTime = 'Ora fine deve essere dopo ora inizio';
      }
    }

    const locationError = validators.required(eventData.location, 'Luogo') ||
                         validators.minLength(eventData.location, 3, 'Luogo');
    if (locationError) newErrors.location = locationError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const setQuickEvent = (action) => {
    setEventData(prev => ({
      ...prev,
      title: action.title,
      startTime: action.time,
      endTime: action.endTime,
      type: action.type
    }));
    setErrors({});
    addNotification(`Impostato "${action.title}"`, 'success', 2000);
  };

  const handleSave = async () => {
    console.log('🎯 Inizio salvataggio evento...');
    console.log('📋 Dati evento:', eventData);
    
    if (!validateForm()) {
      addNotification('Controlla i campi evidenziati in rosso', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const [year, month, day] = eventData.date.split('-');
      const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const newEvent = {
        id: 'event_' + Date.now(),
        teamId: team.id,
        ...eventData,
        date: eventDate,
        location: { name: eventData.location },
        isPublished: true,
        responses: [],
        createdAt: new Date()
      };
      
      console.log('🆕 Nuovo evento creato:', newEvent);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('💾 Chiamando onSave...');
      onSave(newEvent);
      addNotification('Evento creato con successo!', 'success');
      
    } catch (error) {
      console.error('❌ Errore nella creazione:', error);
      addNotification('Errore nella creazione dell\'evento', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Input semplificato senza useCallback
  const handleInputChange = (field, value) => {
    console.log(`📝 Campo ${field} cambiato:`, value);
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.container}>
      <StyleInjector />
      <div style={styles.header}>
        <div style={styles.headerBackground} />
        <div style={styles.headerContent}>
          <div style={styles.headerTitle}>Nuovo Evento</div>
          <div style={styles.headerSubtitle}>{team.name}</div>
        </div>
        <button onClick={onCancel} style={{ 
          background: 'none', 
          border: 'none', 
          color: colors.secondary, 
          fontSize: '18px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          transition: 'background-color 0.2s ease'
        }}>
          ✕
        </button>
      </div>
      
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.subtitle}>Azioni Rapide</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                title={action.title}
                onPress={() => setQuickEvent(action)}
                variant="secondary"
                style={{ padding: '12px 16px' }}
              />
            ))}
          </div>
        </div>
        
        <div style={styles.card}>
          <div style={styles.subtitle}>Dettagli Evento</div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={styles.text}>Tipo evento:</div>
            <select 
              value={eventData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              style={{
                ...styles.input,
                cursor: 'pointer'
              }}
            >
              <option value="allenamento">Allenamento</option>
              <option value="partita">Partita</option>
              <option value="raduno">Raduno</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={styles.text}>Titolo:</div>
            <input
              type="text"
              value={eventData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="es: Allenamento settimanale"
              className="input-focus"
              style={{
                ...styles.input,
                borderColor: errors.title ? colors.danger : colors.lightGray,
                backgroundColor: errors.title ? `${colors.danger}08` : colors.backgroundCard
              }}
            />
            {errors.title && (
              <div style={{ 
                color: colors.danger, 
                fontSize: '14px', 
                marginTop: '4px',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                {errors.title}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={styles.text}>Data:</div>
            <input
              type="date"
              value={eventData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="input-focus"
              style={{
                ...styles.input,
                borderColor: errors.date ? colors.danger : colors.lightGray,
                backgroundColor: errors.date ? `${colors.danger}08` : colors.backgroundCard
              }}
            />
            {errors.date && (
              <div style={{ 
                color: colors.danger, 
                fontSize: '14px', 
                marginTop: '4px',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                {errors.date}
              </div>
            )}
          </div>
          
          <div style={styles.row}>
            <div style={{ flex: 1, marginRight: '8px' }}>
              <div style={styles.text}>Ora inizio:</div>
              <input
                type="time"
                value={eventData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="input-focus"
                style={{
                  ...styles.input,
                  borderColor: errors.startTime ? colors.danger : colors.lightGray,
                  backgroundColor: errors.startTime ? `${colors.danger}08` : colors.backgroundCard
                }}
              />
              {errors.startTime && (
                <div style={{ 
                  color: colors.danger, 
                  fontSize: '14px', 
                  marginTop: '4px',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  {errors.startTime}
                </div>
              )}
            </div>
            <div style={{ flex: 1, marginLeft: '8px' }}>
              <div style={styles.text}>Ora fine:</div>
              <input
                type="time"
                value={eventData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="input-focus"
                style={{
                  ...styles.input,
                  borderColor: errors.endTime ? colors.danger : colors.lightGray,
                  backgroundColor: errors.endTime ? `${colors.danger}08` : colors.backgroundCard
                }}
              />
              {errors.endTime && (
                <div style={{ 
                  color: colors.danger, 
                  fontSize: '14px', 
                  marginTop: '4px',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  {errors.endTime}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={styles.text}>Luogo:</div>
            <input
              type="text"
              value={eventData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="es: Campo Comunale Via Roma"
              className="input-focus"
              style={{
                ...styles.input,
                borderColor: errors.location ? colors.danger : colors.lightGray,
                backgroundColor: errors.location ? `${colors.danger}08` : colors.backgroundCard
              }}
            />
            {errors.location && (
              <div style={{ 
                color: colors.danger, 
                fontSize: '14px', 
                marginTop: '4px',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                {errors.location}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={styles.text}>Note per i giocatori:</div>
            <textarea
              value={eventData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="es: Portate i parastinchi"
              style={{
                ...styles.input,
                minHeight: '80px', 
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>
        
        <Button
          title={isSubmitting ? "CREAZIONE IN CORSO..." : "CREA E INVIA CONVOCAZIONE"}
          onPress={handleSave}
          disabled={isSubmitting}
          variant="success"
          style={{ marginBottom: '16px' }}
        />

        <Button
          title="📱 CREA E INVIA SU WHATSAPP"
          onPress={async () => {
            console.log('🎯 Creazione evento con WhatsApp...');
            
            if (!validateForm()) {
              addNotification('Controlla i campi evidenziati in rosso', 'error');
              return;
            }

            setIsSubmitting(true);
            
            try {
              const [year, month, day] = eventData.date.split('-');
              const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              
              const newEvent = {
                id: 'event_' + Date.now(),
                teamId: team.id,
                ...eventData,
                date: eventDate,
                location: { name: eventData.location },
                isPublished: true,
                responses: [],
                createdAt: new Date()
              };
              
              // Salva l'evento
              await new Promise(resolve => setTimeout(resolve, 500));
              onSave(newEvent);
              
              // Genera messaggio WhatsApp
              const message = whatsappUtils.generateConvocationMessage(newEvent, team);
              const whatsappLink = whatsappUtils.generateGroupLink(message);
              
              // Apre WhatsApp
              window.open(whatsappLink, '_blank');
              
              addNotification('Evento creato! WhatsApp aperto per l\'invio', 'success');
              
            } catch (error) {
              console.error('❌ Errore:', error);
              addNotification('Errore nella creazione dell\'evento', 'error');
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
          variant="primary"
          style={{ 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
          }}
        />
        
        <Button
          title="Annulla"
          onPress={onCancel}
          variant="secondary"
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
};

const CoachDashboard = ({ team, events, responses, onCreateEvent, onViewEvent, onLogout }) => {
  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const now = new Date();
    return eventDate >= now;
  }).slice(0, 3);
  
  const nextEvent = upcomingEvents[0];
  
  const getEventStats = (eventId) => {
    const eventResponses = responses.filter(r => r.eventId === eventId);
    const presente = eventResponses.filter(r => r.status === 'presente').length;
    const assente = eventResponses.filter(r => r.status === 'assente').length;
    const incerto = eventResponses.filter(r => r.status === 'incerto').length;
    const pending = mockPlayers[team.id].length - eventResponses.length;
    
    return { presente, assente, incerto, pending };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerBackground} />
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>{team.name}</div>
            <div style={styles.headerSubtitle}>Benvenuto, {team.coach.name}</div>
          </div>
          <button onClick={onLogout} style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: colors.secondary, 
            fontSize: '16px',
            cursor: 'pointer',
            padding: '12px 16px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}>
            Esci
          </button>
        </div>
      </div>
      
      <div style={styles.content}>
        {nextEvent && (
          <div style={styles.card} className="card-hover">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '32px', marginRight: '12px' }}>🏃‍♂️</div>
              <div>
                <div style={styles.subtitle}>PROSSIMO EVENTO</div>
                <div style={styles.text}>
                  {new Date(nextEvent.date).toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'short' 
                  })} - {nextEvent.startTime}
                </div>
                <div style={styles.smallText}>{nextEvent.location.name}</div>
              </div>
            </div>
            
            <div style={styles.statsGrid}>
              {(() => {
                const stats = getEventStats(nextEvent.id);
                return (
                  <>
                    <div style={{...styles.statItem, borderColor: colors.success}}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.success }}>
                        {stats.presente}
                      </div>
                      <div style={styles.smallText}>Presenti</div>
                    </div>
                    <div style={{...styles.statItem, borderColor: colors.danger}}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.danger }}>
                        {stats.assente}
                      </div>
                      <div style={styles.smallText}>Assenti</div>
                    </div>
                    <div style={{...styles.statItem, borderColor: colors.warning}}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.warning }}>
                        {stats.incerto}
                      </div>
                      <div style={styles.smallText}>In Dubbio</div>
                    </div>
                    <div style={{...styles.statItem, borderColor: colors.primary}}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                        {stats.pending}
                      </div>
                      <div style={styles.smallText}>In Attesa</div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <Button
              title="VEDI DETTAGLI"
              onPress={() => onViewEvent(nextEvent.id)}
              variant="warning"
              style={{ marginTop: '16px' }}
            />
          </div>
        )}
        
        <div style={styles.card} className="card-hover">
          <div style={styles.subtitle}>GESTIONE EVENTI</div>
          
          <Button
            title="NUOVO EVENTO"
            onPress={onCreateEvent}
            variant="primary"
            style={{ marginTop: '16px' }}
          />
        </div>

        <div style={styles.card}>
          <div style={styles.subtitle}>TUTTI GLI EVENTI ({events.length})</div>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={styles.text}>Nessun evento creato ancora</div>
              <div style={styles.smallText}>Clicca "NUOVO EVENTO" per iniziare</div>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} style={{
                ...styles.card,
                margin: '12px 0',
                cursor: 'pointer',
                padding: '16px'
              }}
              onClick={() => onViewEvent(event.id)}
              className="card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{...styles.text, fontWeight: '600', marginBottom: '4px'}}>
                      {event.title}
                    </div>
                    <div style={styles.smallText}>
                      {new Date(event.date).toLocaleDateString('it-IT')} - {event.startTime}
                    </div>
                  </div>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: `${colors.primary}10`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: colors.primary,
                    textTransform: 'capitalize'
                  }}>
                    {event.type}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const PlayerDashboard = ({ player, events, responses, onViewEvent, onLogout }) => {
  const myResponses = responses.filter(r => r.playerId === player.id);
  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).slice(0, 10);
  
  const getMyResponse = (eventId) => {
    return myResponses.find(r => r.eventId === eventId);
  };

  const getEventPriority = (event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const myResponse = getMyResponse(event.id);
    
    if (hoursUntilEvent < 0) return 'past';
    if (!myResponse && hoursUntilEvent < 24) return 'urgent';
    if (!myResponse && hoursUntilEvent < 48) return 'important';
    if (!myResponse) return 'pending';
    return 'responded';
  };

  return (
    <div style={styles.container}>
      <StyleInjector />
      <div style={styles.header}>
        <div style={styles.headerBackground} />
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>Ciao {player.firstName}!</div>
            <div style={styles.headerSubtitle}>Le tue convocazioni</div>
          </div>
          <button onClick={onLogout} style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: colors.secondary, 
            fontSize: '16px',
            cursor: 'pointer',
            padding: '12px 16px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}>
            Esci
          </button>
        </div>
      </div>
      
      <div style={styles.content}>
        <div style={styles.card} className="card-hover">
          <div style={styles.subtitle}>
            Prossimi Eventi ({upcomingEvents.length})
          </div>
          
          {upcomingEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>📅</div>
              <div style={styles.text}>Nessun evento programmato</div>
              <div style={styles.smallText}>Ti avviseremo quando ci saranno nuove convocazioni</div>
            </div>
          ) : (
            upcomingEvents.map(event => {
              const myResponse = getMyResponse(event.id);
              const priority = getEventPriority(event);
              const isUrgent = priority === 'urgent';
              const isImportant = priority === 'important';
              
              return (
                <div 
                  key={event.id} 
                  style={{
                    ...styles.card,
                    backgroundColor: isUrgent ? `${colors.danger}08` : 
                                   isImportant ? `${colors.warning}08` : colors.backgroundCard,
                    borderLeft: isUrgent ? `4px solid ${colors.danger}` : 
                               isImportant ? `4px solid ${colors.warning}` : 'none',
                    marginBottom: '16px',
                    cursor: 'pointer',
                    animation: isUrgent ? 'pulse 2s infinite' : 'none'
                  }}
                  onClick={() => onViewEvent(event.id)}
                  className="card-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '20px' }}>
                          {event.type === 'allenamento' ? '🏃‍♂️' : 
                           event.type === 'partita' ? '⚽' : '🎯'}
                        </span>
                        <div style={{...styles.text, fontWeight: '600'}}>{event.title}</div>
                      </div>
                      
                      <div style={styles.smallText}>
                        {new Date(event.date).toLocaleDateString('it-IT', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short'
                        })} alle {event.startTime} • {event.location.name}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {myResponse ? (
                        <div style={{
                          ...styles.statusBadge,
                          backgroundColor: myResponse.status === 'presente' ? colors.successLight : 
                                         myResponse.status === 'assente' ? colors.dangerLight : 
                                         colors.warningLight,
                          color: myResponse.status === 'presente' ? colors.success : 
                                 myResponse.status === 'assente' ? colors.danger : 
                                 colors.warning
                        }}>
                          {myResponse.status === 'presente' ? 'CONFERMATO' :
                           myResponse.status === 'assente' ? 'ASSENTE' : 
                           'IN DUBBIO'}
                        </div>
                      ) : (
                        <div style={{
                          ...styles.statusBadge,
                          backgroundColor: isUrgent ? colors.dangerLight : 
                                          isImportant ? colors.warningLight : colors.lightGray,
                          color: isUrgent ? colors.danger : 
                                 isImportant ? colors.warning : colors.textSecondary
                        }}>
                          {isUrgent ? 'URGENTE' : 
                           isImportant ? 'IMPORTANTE' : 
                           'DA RISPONDERE'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const PlayerResponseScreen = ({ event, team, player, currentResponse, onRespond, onBack }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentResponse?.status || null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { addNotification } = useNotification();

  const handleResponse = async (status) => {
    setIsAnimating(true);
    setSelectedStatus(status);
    
    addNotification(`Risposta "${status}" registrata!`, 'success', 2000);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    onRespond(event.id, player.id, status);
    
    setIsAnimating(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onBack();
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div style={styles.container}>
        <StyleInjector />
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '40px',
          background: `linear-gradient(135deg, ${colors.success}10 0%, ${colors.success}05 100%)`
        }}>
          <div style={{
            animation: 'scaleIn 0.6s ease-out',
            maxWidth: '400px'
          }}>
            <div style={{ 
              fontSize: '96px', 
              marginBottom: '24px',
              animation: 'pulse 2s infinite'
            }}>
              ✅
            </div>
            <div style={{...styles.title, color: colors.success, marginBottom: '16px'}}>
              Risposta inviata!
            </div>
            <div style={{...styles.text, fontSize: '18px', marginBottom: '8px'}}>
              Perfetto! Il mister riceverà la notifica
            </div>
            <Button
              title="← Torna al Dashboard"
              onPress={() => {
                setShowSuccess(false);
                onBack();
              }}
              variant="success"
              style={{ maxWidth: '250px', margin: '0 auto' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <StyleInjector />
      <div style={styles.header}>
        <div style={styles.headerBackground} />
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>Convocazione</div>
            <div style={styles.headerSubtitle}>Ciao {player.firstName}!</div>
          </div>
          <button onClick={onBack} style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: colors.secondary, 
            fontSize: '18px',
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            ← Indietro
          </button>
        </div>
      </div>
      
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '16px',
              background: colors.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ⚽
            </div>
            <div style={{...styles.subtitle, marginBottom: '8px'}}>
              {team.name}
            </div>
            <div style={{
              ...styles.text,
              fontSize: '18px',
              fontWeight: '600',
              color: colors.primary
            }}>
              {event.title}
            </div>
          </div>
          
          <div style={{ 
            marginBottom: '32px',
            background: `${colors.lightBlue}20`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{...styles.text, fontSize: '24px'}}>📅</div>
              <div>
                <div style={{...styles.text, fontWeight: '600', marginBottom: '4px'}}>
                  {new Date(event.date).toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </div>
              </div>
              
              <div style={{...styles.text, fontSize: '24px'}}>🕗</div>
              <div>
                <div style={{...styles.text, fontWeight: '600'}}>
                  {event.startTime} - {event.endTime}
                </div>
              </div>
              
              <div style={{...styles.text, fontSize: '24px'}}>📍</div>
              <div>
                <div style={{...styles.text, fontWeight: '600'}}>
                  {event.location.name}
                </div>
              </div>
            </div>
          </div>
          
          {event.notes && (
            <div style={{
              backgroundColor: colors.lightBlue,
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '32px',
              borderLeft: `4px solid ${colors.primary}`
            }}>
              <div style={{...styles.text, fontWeight: '600', marginBottom: '8px'}}>
                💬 Messaggio dal Mister:
              </div>
              <div style={{...styles.text, fontStyle: 'italic'}}>
                "{event.notes}"
              </div>
              <div style={{...styles.smallText, marginTop: '8px', textAlign: 'right'}}>
                - {team.coach.name}
              </div>
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{...styles.title, fontSize: '24px', marginBottom: '8px'}}>
              TU PARTECIPI?
            </div>
            <div style={styles.smallText}>
              Scegli la tua risposta cliccando uno dei pulsanti
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { status: 'presente', text: '✅ SÌ, CI SONO', color: 'success', message: 'Confermo la mia presenza' },
              { status: 'assente', text: '❌ NO, NON POSSO', color: 'danger', message: 'Non riesco a partecipare' },
              { status: 'incerto', text: '❓ FORSE, VI FACCIO SAPERE', color: 'warning', message: 'Devo ancora decidere' }
            ].map(({ status, text, color, message }) => (
              <div key={status}>
                <button
                  onClick={() => handleResponse(status)}
                  disabled={isAnimating}
                  className="button-hover"
                  style={{
                    ...styles.button,
                    ...styles[`${color}Button`],
                    opacity: selectedStatus === status ? 1 : (selectedStatus && !isAnimating ? 0.5 : 1),
                    transform: selectedStatus === status && !isAnimating ? 'scale(1.05)' : 'scale(1)',
                    cursor: isAnimating ? 'not-allowed' : 'pointer',
                    width: '100%',
                    padding: '20px'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{...styles.buttonText, fontSize: '18px', fontWeight: '700'}}>
                      {text}
                    </div>
                    <div style={{...styles.buttonText, fontSize: '14px', opacity: 0.9, marginTop: '4px'}}>
                      {message}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EventDetailScreen = ({ event, team, responses, players, onBack, onDeleteEvent }) => {
  const { addNotification } = useNotification();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const eventResponses = responses.filter(r => r.eventId === event.id);
  const teamPlayers = players[team.id] || [];
  
  const getStats = () => {
    const presente = eventResponses.filter(r => r.status === 'presente').length;
    const assente = eventResponses.filter(r => r.status === 'assente').length;
    const incerto = eventResponses.filter(r => r.status === 'incerto').length;
    const pending = teamPlayers.length - eventResponses.length;
    return { presente, assente, incerto, pending };
  };
  
  const stats = getStats();
  const responseRate = Math.round((eventResponses.length / teamPlayers.length) * 100);
  
  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    addNotification('Eliminazione evento...', 'warning', 2000);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onDeleteEvent(event.id);
    addNotification('Evento eliminato con successo', 'success');
    setIsDeleting(false);
    onBack();
  };
  
  const getPlayerResponse = (playerId) => {
    return eventResponses.find(r => r.playerId === playerId);
  };

  return (
    <div style={styles.container}>
      <StyleInjector />
      <div style={styles.header}>
        <div style={styles.headerBackground} />
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerTitle}>{event.title}</div>
            <div style={styles.headerSubtitle}>
              {new Date(event.date).toLocaleDateString('it-IT', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
          </div>
          <button onClick={onBack} style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: colors.secondary, 
            fontSize: '18px',
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            ← Indietro
          </button>
        </div>
      </div>
      
      <div style={styles.content}>
        {/* Statistiche Evento */}
        <div style={styles.card}>
          <div style={styles.subtitle}>Statistiche Presenze</div>
          <div style={styles.statsGrid}>
            <div style={{...styles.statItem, borderColor: colors.success}}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
                {stats.presente}
              </div>
              <div style={styles.smallText}>Presenti</div>
            </div>
            <div style={{...styles.statItem, borderColor: colors.danger}}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.danger }}>
                {stats.assente}
              </div>
              <div style={styles.smallText}>Assenti</div>
            </div>
            <div style={{...styles.statItem, borderColor: colors.warning}}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
                {stats.incerto}
              </div>
              <div style={styles.smallText}>In Dubbio</div>
            </div>
            <div style={{...styles.statItem, borderColor: colors.primary}}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
                {stats.pending}
              </div>
              <div style={styles.smallText}>Da Rispondere</div>
            </div>
          </div>
          
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: responseRate > 80 ? colors.successLight : responseRate > 60 ? colors.warningLight : colors.dangerLight,
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: responseRate > 80 ? colors.success : responseRate > 60 ? colors.warning : colors.danger,
              marginBottom: '4px'
            }}>
              {responseRate}% di risposte
            </div>
            <div style={styles.smallText}>
              {eventResponses.length} su {teamPlayers.length} giocatori hanno risposto
            </div>
          </div>
        </div>

        {/* Dettagli Evento */}
        <div style={styles.card}>
          <div style={styles.subtitle}>Dettagli Evento</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{fontSize: '20px'}}>📅</div>
            <div>
              <div style={{...styles.text, fontWeight: '600'}}>
                {new Date(event.date).toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric' 
                })}
              </div>
            </div>
            
            <div style={{fontSize: '20px'}}>🕐</div>
            <div>
              <div style={{...styles.text, fontWeight: '600'}}>
                {event.startTime} - {event.endTime}
              </div>
            </div>
            
            <div style={{fontSize: '20px'}}>📍</div>
            <div>
              <div style={{...styles.text, fontWeight: '600'}}>
                {event.location.name}
              </div>
            </div>
            
            <div style={{fontSize: '20px'}}>⚽</div>
            <div>
              <div style={{...styles.text, fontWeight: '600', textTransform: 'capitalize'}}>
                {event.type}
              </div>
            </div>
          </div>
          
          {event.notes && (
            <div style={{
              backgroundColor: colors.lightBlue,
              padding: '16px',
              borderRadius: '8px',
              borderLeft: `4px solid ${colors.primary}`
            }}>
              <div style={{...styles.text, fontWeight: '600', marginBottom: '8px'}}>
                💬 Note:
              </div>
              <div style={styles.text}>
                {event.notes}
              </div>
            </div>
          )}
        </div>

        {/* Lista Giocatori */}
        <div style={styles.card}>
          <div style={styles.subtitle}>Risposte Giocatori ({teamPlayers.length})</div>
          
          {teamPlayers.map(player => {
            const response = getPlayerResponse(player.id);
            return (
              <PlayerCard
                key={player.id}
                player={player}
                response={response}
                isCoach={true}
                onStatusChange={() => {}} // Non modificabile dalla vista coach
              />
            );
          })}
        </div>

        {/* Azioni Evento */}
        <div style={styles.card}>
          <div style={styles.subtitle}>Azioni</div>
          
          <Button
            title="📤 INVIA PROMEMORIA SU WHATSAPP"
            onPress={() => {
              const message = whatsappUtils.generateReminderMessage(event, team, responses, players);
              const whatsappLink = whatsappUtils.generateGroupLink(message);
              window.open(whatsappLink, '_blank');
              addNotification('WhatsApp aperto per inviare promemoria!', 'success');
            }}
            variant="primary"
            style={{ 
              marginBottom: '12px',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
            }}
          />

          <Button
            title="📱 CONVOCAZIONE WHATSAPP"
            onPress={() => {
              const message = whatsappUtils.generateConvocationMessage(event, team);
              const whatsappLink = whatsappUtils.generateGroupLink(message);
              window.open(whatsappLink, '_blank');
              addNotification('WhatsApp aperto per inviare convocazione!', 'success');
            }}
            variant="warning"
            style={{ marginBottom: '12px' }}
          />
          
          <Button
            title="📋 ESPORTA PRESENZE"
            onPress={() => {
              const eventResponses = responses.filter(r => r.eventId === event.id);
              const teamPlayers = players[team.id] || [];
              
              let exportText = `📊 PRESENZE - ${event.title}\n`;
              exportText += `📅 ${new Date(event.date).toLocaleDateString('it-IT')}\n\n`;
              
              const presenti = teamPlayers.filter(p => 
                eventResponses.find(r => r.playerId === p.id && r.status === 'presente')
              );
              const assenti = teamPlayers.filter(p => 
                eventResponses.find(r => r.playerId === p.id && r.status === 'assente')
              );
              const incerti = teamPlayers.filter(p => 
                eventResponses.find(r => r.playerId === p.id && r.status === 'incerto')
              );
              const pending = teamPlayers.filter(p => 
                !eventResponses.find(r => r.playerId === p.id)
              );
              
              if (presenti.length > 0) {
                exportText += `✅ PRESENTI (${presenti.length}):\n`;
                presenti.forEach(p => exportText += `• ${p.firstName} ${p.lastName}\n`);
                exportText += `\n`;
              }
              
              if (assenti.length > 0) {
                exportText += `❌ ASSENTI (${assenti.length}):\n`;
                assenti.forEach(p => exportText += `• ${p.firstName} ${p.lastName}\n`);
                exportText += `\n`;
              }
              
              if (incerti.length > 0) {
                exportText += `❓ IN DUBBIO (${incerti.length}):\n`;
                incerti.forEach(p => exportText += `• ${p.firstName} ${p.lastName}\n`);
                exportText += `\n`;
              }
              
              if (pending.length > 0) {
                exportText += `⏳ NON HANNO RISPOSTO (${pending.length}):\n`;
                pending.forEach(p => exportText += `• ${p.firstName} ${p.lastName}\n`);
              }
              
              navigator.clipboard.writeText(exportText).then(() => {
                addNotification('Lista presenze copiata negli appunti!', 'success');
              }).catch(() => {
                addNotification('Lista presenze pronta (copia manualmente)', 'info');
                console.log('EXPORT PRESENZE:\n', exportText);
              });
            }}
            variant="secondary"
            style={{ marginBottom: '12px' }}
          />
          
          <Button
            title="🗑️ ELIMINA EVENTO"
            onPress={() => setShowDeleteConfirm(true)}
            variant="danger"
          />
        </div>

        {/* Modal Conferma Eliminazione */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              ...styles.card,
              width: '90%',
              maxWidth: '400px',
              animation: 'scaleIn 0.3s ease-out'
            }}>
              <div style={{...styles.subtitle, textAlign: 'center', marginBottom: '16px'}}>
                ⚠️ Conferma Eliminazione
              </div>
              <div style={{...styles.text, textAlign: 'center', marginBottom: '24px'}}>
                Sei sicuro di voler eliminare l'evento "{event.title}"?
                <br /><br />
                <strong>Questa azione non può essere annullata.</strong>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  title="Annulla"
                  onPress={() => setShowDeleteConfirm(false)}
                  variant="secondary"
                  disabled={isDeleting}
                  style={{ flex: 1 }}
                />
                <Button
                  title={isDeleting ? "Eliminazione..." : "Elimina"}
                  onPress={handleDeleteEvent}
                  variant="danger"
                  disabled={isDeleting}
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
const App = () => {
  // ===== LOCALSTORAGE HOOKS =====
  const [events, setEvents] = useState(() => loadFromStorage('presenze_events', initialEvents));
  const [responses, setResponses] = useState(() => loadFromStorage('presenze_responses', initialResponses));
  
  // Salvataggio automatico quando cambiano gli stati
  useEffect(() => {
  if (!currentUser) return;
  
  const unsubscribe = onSnapshot(
    collection(db, 'events'),
    (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
    },
    (error) => {
      console.error('Errore caricamento eventi:', error);
    }
  );
  
  return () => unsubscribe();
}, [currentUser]);

  useEffect(() => {
    saveToStorage('presenze_responses', responses);
  }, [responses]);

  // ===== REGULAR STATE =====
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('auth');
  const [screenData, setScreenData] = useState({});

  const handleLogin = (userType) => {
    if (userType === 'coach') {
      setCurrentUser({
        id: 'coach1',
        type: 'coach',
        name: 'Mister Giuseppe',
        teamId: 'team1'
      });
      setCurrentScreen('coach-dashboard');
    } else {
      setCurrentUser({
        id: 'p1',
        type: 'player',
        ...mockPlayers['team1'][0],
        teamId: 'team1'
      });
      setCurrentScreen('player-dashboard');
    }
  };

  const handleCreateEvent = async (eventData) => {
  try {
    const eventDate = new Date(eventData.date);
    await addDoc(collection(db, 'events'), {
      ...eventData,
      date: Timestamp.fromDate(eventDate),
      teamId: 'team1',
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Errore creazione evento:', error);
    alert('Errore nel salvare l\'evento');
  }
};

  const handleSaveEvent = (newEvent) => {
    console.log('🎯 APP: Ricevuto nuovo evento da salvare:', newEvent);
    console.log('📋 APP: Eventi attuali prima del salvataggio:', events);
    
    setEvents(prev => {
      const updated = [...prev, newEvent];
      console.log('✅ APP: Eventi aggiornati:', updated);
      return updated;
    });
    
    // Ritardo per assicurare che lo stato si aggiorni prima di cambiare schermata
    setTimeout(() => {
      console.log('🔄 APP: Cambiando schermata...');
      setCurrentScreen(currentUser.type === 'coach' ? 'coach-dashboard' : 'player-dashboard');
    }, 100);
  };

  const handleViewEvent = (eventId) => {
    if (currentUser.type === 'coach') {
      setScreenData({ eventId });
      setCurrentScreen('event-detail');
    } else {
      setScreenData({ eventId });
      setCurrentScreen('player-response');
    }
  };

  const handlePlayerRespond = (eventId, playerId, status) => {
    setResponses(prev => {
      const existing = prev.find(r => r.eventId === eventId && r.playerId === playerId);
      if (existing) {
        return prev.map(r => 
          r.eventId === eventId && r.playerId === playerId 
            ? { ...r, status, respondedAt: new Date() }
            : r
        );
      } else {
        return [...prev, {
          id: 'r_' + Date.now(),
          eventId,
          playerId,
          status,
          respondedAt: new Date()
        }];
      }
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('auth');
    setScreenData({});
  };

  const handleBack = () => {
    if (currentUser?.type === 'coach') {
      setCurrentScreen('coach-dashboard');
    } else if (currentUser?.type === 'player') {
      setCurrentScreen('player-dashboard');
    } else {
      setCurrentScreen('auth');
    }
    setScreenData({});
  };

  const currentTeam = currentUser ? mockTeams[currentUser.teamId] : null;
  const currentEvent = screenData.eventId ? events.find(e => e.id === screenData.eventId) : null;
  const currentPlayer = currentUser?.type === 'player' ? currentUser : mockPlayers['team1'][0];
  const currentResponse = currentEvent && currentPlayer ? 
    responses.find(r => r.eventId === currentEvent.id && r.playerId === currentPlayer.id) : null;

  return (
    <NotificationProvider>
      <AppContext.Provider value={{ 
        currentUser, 
        events, 
        responses, 
        teams: mockTeams, 
        players: mockPlayers 
      }}>
        <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', backgroundColor: colors.background }}>
          <StyleInjector />
          
          {currentScreen === 'auth' && (
            <AuthScreen onLogin={handleLogin} />
          )}
          
          {currentScreen === 'coach-dashboard' && currentTeam && (
            <CoachDashboard 
              team={currentTeam}
              events={events.filter(e => e.teamId === currentTeam.id)}
              responses={responses}
              onCreateEvent={handleCreateEvent}
              onViewEvent={handleViewEvent}
              onLogout={handleLogout}
            />
          )}
          
          {currentScreen === 'create-event' && currentTeam && (
            <CreateEventScreen 
              team={currentTeam}
              onSave={handleSaveEvent}
              onCancel={handleBack}
            />
          )}

          {currentScreen === 'event-detail' && currentEvent && currentTeam && (
            <EventDetailScreen 
              event={currentEvent}
              team={currentTeam}
              responses={responses}
              players={mockPlayers}
              onBack={handleBack}
              onDeleteEvent={(eventId) => {
                setEvents(prev => prev.filter(event => event.id !== eventId));
                setResponses(prev => prev.filter(response => response.eventId !== eventId));
              }}
            />
          )}
          
          {currentScreen === 'player-dashboard' && currentUser && currentTeam && (
            <PlayerDashboard 
              player={currentUser}
              events={events.filter(e => e.teamId === currentTeam.id)}
              responses={responses}
              onViewEvent={handleViewEvent}
              onLogout={handleLogout}
            />
          )}
          
          {currentScreen === 'player-response' && currentEvent && currentTeam && currentPlayer && (
            <PlayerResponseScreen 
              event={currentEvent}
              team={currentTeam}
              player={currentPlayer}
              currentResponse={currentResponse}
              onRespond={handlePlayerRespond}
              onBack={handleBack}
            />
          )}
        </div>
      </AppContext.Provider>
    </NotificationProvider>
  );
};

export default App;
