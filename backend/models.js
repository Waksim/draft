import { fileURLToPath } from 'url';
import path from 'path';
import Database from 'better-sqlite3';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Вспомогательная функция для генерации уникальных ссылок
export function generateDraftLinks(draftId) {
  // Для простоты draftId — это uuid, а ссылки — draftId + role
  return {
    player1: `/draft/${draftId}/player/1`,
    player2: `/draft/${draftId}/player/2`,
    spectator: `/draft/${draftId}/spectator`,
  };
}

// Таблицы для драфтов, сессий, истории — создаем если нет
export function initDraftTables() {
  db.prepare(`CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    rules TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS draft_sessions (
    id TEXT PRIMARY KEY,
    draft_id TEXT,
    player_num INTEGER,
    name TEXT,
    ready BOOLEAN DEFAULT 0,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS draft_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    draft_id TEXT,
    step INTEGER,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

// Создать драфт
export function createDraft(rules) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO drafts (id, rules) VALUES (?, ?)').run(id, JSON.stringify(rules));
  // Initialize player order in draft rules if not provided
  const rulesObj = JSON.parse(JSON.stringify(rules));
  if (rulesObj.blocks) {
    rulesObj.blocks = rulesObj.blocks.map(b => ({ ...b, playerNum: b.playerNum || 1 }));
    db.prepare('UPDATE drafts SET rules = ? WHERE id = ?').run(JSON.stringify(rulesObj), id);
  }
  return id;
}

// Получить драфт
export function getDraft(id) {
  const row = db.prepare('SELECT * FROM drafts WHERE id = ?').get(id);
  if (row) row.rules = JSON.parse(row.rules);
  return row;
}

// Сессии игроков
export function setPlayerSession(draftId, playerNum, name) {
  const id = `${draftId}_${playerNum}`;
  db.prepare(`INSERT OR REPLACE INTO draft_sessions (id, draft_id, player_num, name, ready, last_active)
    VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`).run(id, draftId, playerNum, name);
}
export function setPlayerReady(draftId, playerNum, ready) {
  const id = `${draftId}_${playerNum}`;
  db.prepare('UPDATE draft_sessions SET ready = ? WHERE id = ?').run(ready ? 1 : 0, id);
}
export function getDraftSessions(draftId) {
  return db.prepare('SELECT * FROM draft_sessions WHERE draft_id = ?').all(draftId);
}

// История драфта
export function addDraftHistory(draftId, step, data) {
  db.prepare('INSERT INTO draft_history (draft_id, step, data) VALUES (?, ?, ?)').run(draftId, step, JSON.stringify(data));
}
export function getDraftHistory(draftId) {
  return db.prepare('SELECT * FROM draft_history WHERE draft_id = ? ORDER BY step ASC').all(draftId).map(h => ({...h, data: JSON.parse(h.data)}));
}

export default db;
