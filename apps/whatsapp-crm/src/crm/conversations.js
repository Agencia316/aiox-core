'use strict';

const { getDb } = require('../db/db');
const { logger } = require('../utils/logger');

function upsertConversation({ contactId, whatsappChatId }) {
  if (!contactId) throw new Error('upsertConversation: contactId is required');
  if (!whatsappChatId) throw new Error('upsertConversation: whatsappChatId is required');
  const db = getDb();
  try {
    const existing = db
      .prepare('SELECT * FROM conversations WHERE whatsapp_chat_id = ?')
      .get(whatsappChatId);
    if (existing) return existing;
    const info = db
      .prepare(
        `INSERT INTO conversations (contact_id, whatsapp_chat_id, last_message_at)
         VALUES (?, ?, datetime('now'))`,
      )
      .run(contactId, whatsappChatId);
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(info.lastInsertRowid);
  } catch (err) {
    logger.error('Failed to upsert conversation', {
      whatsappChatId,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(
      `Failed to upsert conversation ${whatsappChatId}: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function recordMessage({
  conversationId,
  whatsappMsgId,
  direction,
  body,
  mediaType,
  status = 'received',
}) {
  if (!conversationId) throw new Error('recordMessage: conversationId is required');
  if (!['inbound', 'outbound'].includes(direction)) {
    throw new Error(`recordMessage: invalid direction "${direction}"`);
  }
  const db = getDb();
  try {
    const insert = db.prepare(
      `INSERT OR IGNORE INTO messages
         (conversation_id, whatsapp_msg_id, direction, body, media_type, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const info = insert.run(
      conversationId,
      whatsappMsgId || null,
      direction,
      body || null,
      mediaType || null,
      status,
    );
    if (info.changes > 0) {
      db.prepare(
        `UPDATE conversations
         SET last_message_at = datetime('now'),
             unread_count = CASE WHEN ? = 'inbound' THEN unread_count + 1 ELSE unread_count END
         WHERE id = ?`,
      ).run(direction, conversationId);
    }
    return db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(conversationId);
  } catch (err) {
    logger.error('Failed to record message', {
      conversationId,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(
      `Failed to record message for conversation ${conversationId}: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function listConversations({ limit = 50 } = {}) {
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, ct.phone, ct.name AS contact_name,
              (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_body
       FROM conversations c
       JOIN contacts ct ON ct.id = c.contact_id
       ORDER BY c.last_message_at DESC NULLS LAST
       LIMIT ?`,
    )
    .all(limit);
}

function listMessages({ conversationId, limit = 100 }) {
  if (!conversationId) throw new Error('listMessages: conversationId is required');
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC
       LIMIT ?`,
    )
    .all(conversationId, limit);
}

function markRead(conversationId) {
  const db = getDb();
  db.prepare('UPDATE conversations SET unread_count = 0 WHERE id = ?').run(conversationId);
}

module.exports = {
  upsertConversation,
  recordMessage,
  listConversations,
  listMessages,
  markRead,
};
