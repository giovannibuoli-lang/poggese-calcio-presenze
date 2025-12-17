import React, { useState, useContext, createContext, useMemo, useCallback, useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';

// ===== PWA IMPORTS =====
import InstallPrompt from './InstallPrompt';
import { 
  register as registerServiceWorker,
  requestNotificationPermission,
  sendLocalNotification,
  scheduleEventNotification 
} from './serviceWorkerRegistration';

// ===== API CLIENT =====
const API_URL = '/api/db';

const apiCall = async (method, body = null, query = '') => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${query}`, options);
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
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
