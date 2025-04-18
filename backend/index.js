import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDraftTables,
  createDraft,
  getDraft,
  generateDraftLinks,
  setPlayerSession,
  setPlayerReady,
  getDraftSessions,
  addDraftHistory,
  getDraftHistory,
  db // Import the db instance from models.js
} from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection is now handled by models.js
// const db = new Database(path.join(__dirname, 'database.sqlite'));

initDraftTables(); // Initialize tables using the imported db instance

app.use(cors());
app.use(express.json());

// Статическая раздача изображений
app.use('/images', express.static(path.join(__dirname, 'images')));

// Получить карты с фильтрацией по типу и тегу 
app.get('/api/cards', (req, res) => {
  console.log('GET /api/cards called with', req.query);
  const { type, tag } = req.query;
  let sql = 'SELECT DISTINCT c.* FROM cards c';
  const params = [];
  // Join tags only if filtering by tag
  if (tag) {
    sql += ' JOIN card_tags t ON c.id = t.card_id';
  }
  sql += ' WHERE c.is_released = 1';
  if (type) {
    sql += ' AND c.type = ?';
    params.push(type);
  }
  if (tag) {
    // normalize hyphens to spaces and match case-insensitive
    const norm = tag.replace(/-/g, ' ');
    sql += ' AND LOWER(t.tag) = LOWER(?)';
    params.push(norm);
  }
  console.log('Executing SQL:', sql, 'Params:', params);
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Получить карту по id
app.get('/api/cards/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
  if (row) res.json(row);
  else res.status(404).json({ error: 'Card not found' });
});

// Создать драфт
app.post('/api/drafts', (req, res) => {
  const { rules } = req.body;
  if (!rules) return res.status(400).json({ error: 'Rules required' });
  const draftId = createDraft(rules);
  res.json({ draftId, links: generateDraftLinks(draftId) });
});

// Получить драфт по id
app.get('/api/drafts/:id', (req, res) => {
  const draft = getDraft(req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft not found' });
  res.json(draft);
});

// Получить сессии игроков по драфту
app.get('/api/drafts/:id/sessions', (req, res) => {
  res.json(getDraftSessions(req.params.id));
});

// Установить имя игрока/сессию
app.post('/api/drafts/:id/session', (req, res) => {
  const { playerNum, name } = req.body;
  if (!playerNum || !name) return res.status(400).json({ error: 'playerNum and name required' });
  setPlayerSession(req.params.id, playerNum, name);
  // Broadcast WS update for session change
  if (draftSubscribers.has(req.params.id)) {
    for (const client of draftSubscribers.get(req.params.id)) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'draft_update' }));
      }
    }
  }
  res.json({ ok: true });
});

// Установить готовность игрока
app.post('/api/drafts/:id/ready', (req, res) => {
  const { playerNum, ready } = req.body;
  if (typeof playerNum !== 'number' || typeof ready !== 'boolean') return res.status(400).json({ error: 'playerNum (number) and ready (boolean) required' });
  setPlayerReady(req.params.id, playerNum, ready);
  // Broadcast WS update for ready state change
  if (draftSubscribers.has(req.params.id)) {
    for (const client of draftSubscribers.get(req.params.id)) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'draft_update' }));
      }
    }
  }
  res.json({ ok: true });
});

// Получить историю драфта
app.get('/api/drafts/:id/history', (req, res) => {
  res.json(getDraftHistory(req.params.id));
});

// Добавить шаг в историю драфта
app.post('/api/drafts/:id/history', (req, res) => {
  const { step, data } = req.body;
  if (typeof step !== 'number' || !data) return res.status(400).json({ error: 'step (number) and data required' });
  addDraftHistory(req.params.id, step, data);
  res.json({ ok: true });
});

// Reset endpoint to clear draft_history and notify via WebSocket
app.post('/api/drafts/:id/reset', (req, res) => {
  // Reset draft history
  db.prepare('DELETE FROM draft_history WHERE draft_id = ?').run(req.params.id);
  // Broadcast update to subscribers
  if (draftSubscribers.has(req.params.id)) {
    for (const client of draftSubscribers.get(req.params.id)) {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'draft_update' }));
      }
    }
  }
  res.json({ ok: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- WebSocket (ws) базовая структура ---
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 3002 });

// draftId -> Set<ws>
const draftSubscribers = new Map();

wss.on('connection', (ws) => {
  let subscribedDraft = null;
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'subscribe' && data.draftId) {
        subscribedDraft = data.draftId;
        if (!draftSubscribers.has(subscribedDraft)) draftSubscribers.set(subscribedDraft, new Set());
        draftSubscribers.get(subscribedDraft).add(ws);
      }
      if ((data.type === 'pick' || data.type === 'ban') && data.draftId && typeof data.step === 'number') {
        // Save draft step with full data
        const entry = {
          cardId: data.cardId,
          playerNum: data.playerNum,
          cardName: data.cardName || undefined,
          cardType: data.cardType || undefined,
          action: data.action,
          time: data.time
        };
        addDraftHistory(data.draftId, data.step, entry);
        // Broadcast update to subscribers
        if (draftSubscribers.has(data.draftId)) {
          for (const client of draftSubscribers.get(data.draftId)) {
            if (client.readyState === 1) {
              client.send(JSON.stringify({ type: 'draft_update' }));
            }
          }
        }
      }
    } catch (e) {
      ws.send(JSON.stringify({ error: e.message }));
    }
  });
  ws.on('close', () => {
    if (subscribedDraft && draftSubscribers.has(subscribedDraft)) {
      draftSubscribers.get(subscribedDraft).delete(ws);
    }
  });
  ws.send(JSON.stringify({ hello: 'draft-ws' }));
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log('WebSocket on ws://localhost:3002');
});
