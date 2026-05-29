'use strict';

// Schema kept inline (not a .sql file) so it bundles correctly with Next.js
// route handlers — reading via __dirname breaks once webpack relocates the module.
const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS contacts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  phone           TEXT NOT NULL UNIQUE,
  name            TEXT,
  is_business     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id      INTEGER NOT NULL,
  whatsapp_chat_id TEXT NOT NULL UNIQUE,
  last_message_at TEXT,
  unread_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  whatsapp_msg_id TEXT UNIQUE,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  body            TEXT,
  media_type      TEXT,
  status          TEXT NOT NULL DEFAULT 'received',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS kanban_columns (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  position        INTEGER NOT NULL DEFAULT 0,
  color           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kanban_cards (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id      INTEGER NOT NULL UNIQUE,
  column_id       INTEGER NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (column_id)  REFERENCES kanban_columns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kanban_cards_column ON kanban_cards(column_id, position);

CREATE TABLE IF NOT EXISTS agents (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  provider        TEXT NOT NULL CHECK (provider IN ('openai','gemini')),
  model           TEXT NOT NULL,
  system_prompt   TEXT NOT NULL,
  temperature     REAL NOT NULL DEFAULT 0.7,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_column_assignments (
  agent_id        INTEGER NOT NULL,
  column_id       INTEGER NOT NULL,
  PRIMARY KEY (agent_id, column_id),
  FOREIGN KEY (agent_id)  REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (column_id) REFERENCES kanban_columns(id) ON DELETE CASCADE
);
`;

module.exports = { SCHEMA_SQL };
