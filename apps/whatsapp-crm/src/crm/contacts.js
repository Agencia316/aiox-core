'use strict';

const { getDb } = require('../db/db');
const { logger } = require('../utils/logger');

function upsertContact({ phone, name, isBusiness = false }) {
  if (!phone || typeof phone !== 'string') {
    throw new Error('upsertContact: phone is required');
  }
  const db = getDb();
  try {
    const existing = db.prepare('SELECT * FROM contacts WHERE phone = ?').get(phone);
    if (existing) {
      db.prepare(
        `UPDATE contacts
         SET name = COALESCE(?, name),
             is_business = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      ).run(name || null, isBusiness ? 1 : 0, existing.id);
      return getContactById(existing.id);
    }
    const info = db
      .prepare(
        `INSERT INTO contacts (phone, name, is_business)
         VALUES (?, ?, ?)`,
      )
      .run(phone, name || null, isBusiness ? 1 : 0);
    return getContactById(info.lastInsertRowid);
  } catch (err) {
    logger.error('Failed to upsert contact', {
      phone,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(`Failed to upsert contact ${phone}: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

function getContactById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) || null;
}

function getContactByPhone(phone) {
  const db = getDb();
  return db.prepare('SELECT * FROM contacts WHERE phone = ?').get(phone) || null;
}

function listContacts({ limit = 50, offset = 0 } = {}) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM contacts ORDER BY updated_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset);
}

module.exports = {
  upsertContact,
  getContactById,
  getContactByPhone,
  listContacts,
};
