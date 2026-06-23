'use strict';

const { getDb } = require('../db/db');
const { logger } = require('../utils/logger');

const DEFAULT_COLUMNS = [
  { name: 'Novo', position: 0, color: '#3b82f6' },
  { name: 'Em atendimento', position: 1, color: '#f59e0b' },
  { name: 'Aguardando cliente', position: 2, color: '#a855f7' },
  { name: 'Fechado', position: 3, color: '#10b981' },
];

function initDefaultBoard() {
  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) AS n FROM kanban_columns').get();
  if (existing.n > 0) {
    logger.info('Board already initialized', { columnCount: existing.n });
    return listColumns();
  }
  const insert = db.prepare(
    'INSERT INTO kanban_columns (name, position, color) VALUES (?, ?, ?)',
  );
  const tx = db.transaction((cols) => {
    for (const c of cols) insert.run(c.name, c.position, c.color);
  });
  tx(DEFAULT_COLUMNS);
  return listColumns();
}

function listColumns() {
  const db = getDb();
  return db.prepare('SELECT * FROM kanban_columns ORDER BY position ASC').all();
}

function getColumnByName(name) {
  const db = getDb();
  return db.prepare('SELECT * FROM kanban_columns WHERE name = ?').get(name) || null;
}

function createCard({ contactId, columnName = 'Novo', notes }) {
  if (!contactId) throw new Error('createCard: contactId is required');
  const column = getColumnByName(columnName);
  if (!column) throw new Error(`createCard: column "${columnName}" not found`);
  const db = getDb();
  try {
    const existing = db.prepare('SELECT * FROM kanban_cards WHERE contact_id = ?').get(contactId);
    if (existing) return existing;
    const maxPos = db
      .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM kanban_cards WHERE column_id = ?')
      .get(column.id);
    const info = db
      .prepare(
        `INSERT INTO kanban_cards (contact_id, column_id, position, notes)
         VALUES (?, ?, ?, ?)`,
      )
      .run(contactId, column.id, maxPos.pos, notes || null);
    return db.prepare('SELECT * FROM kanban_cards WHERE id = ?').get(info.lastInsertRowid);
  } catch (err) {
    logger.error('Failed to create card', {
      contactId,
      columnName,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(
      `Failed to create card for contact ${contactId}: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function moveCard({ cardId, toColumnName }) {
  if (!cardId) throw new Error('moveCard: cardId is required');
  const column = getColumnByName(toColumnName);
  if (!column) throw new Error(`moveCard: target column "${toColumnName}" not found`);
  const db = getDb();
  try {
    const maxPos = db
      .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM kanban_cards WHERE column_id = ?')
      .get(column.id);
    const info = db
      .prepare(
        `UPDATE kanban_cards
         SET column_id = ?, position = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(column.id, maxPos.pos, cardId);
    if (info.changes === 0) throw new Error(`card ${cardId} not found`);
    return db.prepare('SELECT * FROM kanban_cards WHERE id = ?').get(cardId);
  } catch (err) {
    logger.error('Failed to move card', {
      cardId,
      toColumnName,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(
      `Failed to move card ${cardId}: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function getBoardSnapshot() {
  const db = getDb();
  const columns = listColumns();
  const cards = db
    .prepare(
      `SELECT k.*, c.phone, c.name AS contact_name
       FROM kanban_cards k
       JOIN contacts c ON c.id = k.contact_id
       ORDER BY k.column_id ASC, k.position ASC`,
    )
    .all();
  return columns.map((col) => ({
    ...col,
    cards: cards.filter((card) => card.column_id === col.id),
  }));
}

function ensureCardForContact(contactId) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM kanban_cards WHERE contact_id = ?').get(contactId);
  if (existing) return existing;
  return createCard({ contactId, columnName: 'Novo' });
}

module.exports = {
  DEFAULT_COLUMNS,
  initDefaultBoard,
  listColumns,
  getColumnByName,
  createCard,
  moveCard,
  getBoardSnapshot,
  ensureCardForContact,
};
