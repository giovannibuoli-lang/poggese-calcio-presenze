// API Endpoint per Cloudflare D1
// File: /api/db.js

const DATABASE_ID = 'eb8fd3dd-9f2a-48cd-bd3d-4420210a322b';
const ACCOUNT_ID = '51c82fdc55475c4d6b5eb5d46f40ec7b';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function queryD1(sql, params = []) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  );

  if (!response.ok) {
    throw new Error(`D1 query failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result[0].results;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, table, data, id } = req.body || {};

    if (req.method === 'GET') {
      const { table } = req.query;
      
      if (table === 'teams') {
        const teams = await queryD1('SELECT * FROM teams');
        return res.json({ teams });
      }
      
      if (table === 'players') {
        const players = await queryD1('SELECT * FROM players');
        return res.json({ players });
      }
      
if (table === 'events') {
  const events = await queryD1('SELECT * FROM events');
  const parsedEvents = events.map(e => ({
    ...e,
    teamId: e.team_id, 
    convocati: JSON.parse(e.convocati),
    responses: JSON.parse(e.responses),
  }));
  return res.json({ events: parsedEvents });
}
if (table === 'user_roles') {
  const { email } = req.query;
  if (email) {
    // Cerca utente specifico per email
    const user = await queryD1('SELECT * FROM user_roles WHERE email = ?', [email]);
    return res.json({ user_roles: user });
  } else {
    // Ritorna tutti gli utenti
    const users = await queryD1('SELECT * FROM user_roles ORDER BY created_at DESC');
    return res.json({ user_roles: users });
  }
}
      return res.json({ teams: [], players: [], events: [] });
    }

    if (req.method === 'POST') {
      if (action === 'add_team') {
        await queryD1(
          'INSERT INTO teams (id, name, category, color, icon) VALUES (?, ?, ?, ?, ?)',
          [data.id, data.name, data.category, data.color, data.icon]
        );
        return res.json({ success: true });
      }

      if (action === 'update_team') {
        await queryD1(
          'UPDATE teams SET name = ?, category = ?, color = ?, icon = ? WHERE id = ?',
          [data.name, data.category, data.color, data.icon, id]
        );
        return res.json({ success: true });
      }

      if (action === 'delete_team') {
        await queryD1('DELETE FROM teams WHERE id = ?', [id]);
        await queryD1('DELETE FROM players WHERE team_id = ?', [id]);
        await queryD1('DELETE FROM events WHERE team_id = ?', [id]);
        return res.json({ success: true });
      }

      if (action === 'add_player') {
        await queryD1(
          'INSERT INTO players (id, team_id, name, role, number, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [data.id, data.teamId, data.name, data.role, data.number, data.phone || '', data.email || '']
        );
        return res.json({ success: true });
      }

      if (action === 'update_player') {
        await queryD1(
          'UPDATE players SET name = ?, role = ?, number = ?, phone = ?, email = ? WHERE id = ?',
          [data.name, data.role, data.number, data.phone || '', data.email || '', id]
        );
        return res.json({ success: true });
      }

      if (action === 'delete_player') {
        await queryD1('DELETE FROM players WHERE id = ?', [id]);
        return res.json({ success: true });
      }

      if (action === 'add_event') {
        await queryD1(
          'INSERT INTO events (id, team_id, type, title, date, time, location, opponent, description, convocati, responses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            data.id,
            data.teamId,
            data.type,
            data.title,
            data.date,
            data.time,
            data.location,
            data.opponent || '',
            data.description || '',
            JSON.stringify(data.convocati),
            JSON.stringify(data.responses),
            data.createdBy,
            data.createdAt,
          ]
        );
        return res.json({ success: true });
      }

      if (action === 'update_event') {
        await queryD1(
          'UPDATE events SET team_id = ?, type = ?, title = ?, date = ?, time = ?, location = ?, opponent = ?, description = ?, convocati = ?, responses = ?, updated_at = ? WHERE id = ?',
          [
            data.teamId,
            data.type,
            data.title,
            data.date,
            data.time,
            data.location,
            data.opponent || '',
            data.description || '',
            JSON.stringify(data.convocati),
            JSON.stringify(data.responses),
            new Date().toISOString(),
            id,
          ]
        );
        return res.json({ success: true });
      }

      if (action === 'delete_event') {
        await queryD1('DELETE FROM events WHERE id = ?', [id]);
        return res.json({ success: true });
      }
    }
if (action === 'update_user_role') {
  await queryD1(
    'UPDATE user_roles SET role = ?, approved_by = ?, updated_at = ? WHERE id = ?',
    [data.role, data.approved_by, data.updated_at, id]
  );
  return res.json({ success: true });
}

if (action === 'delete_user_role') {
  await queryD1('DELETE FROM user_roles WHERE id = ?', [id]);
  return res.json({ success: true });
}
    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}