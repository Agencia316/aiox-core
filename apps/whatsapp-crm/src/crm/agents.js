'use strict';

const { getDb } = require('../db/db');
const { logger } = require('../utils/logger');

const VALID_PROVIDERS = ['openai', 'gemini'];

function createAgent({ name, provider, model, systemPrompt, temperature = 0.7 }) {
  if (!name) throw new Error('createAgent: name is required');
  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error(`createAgent: invalid provider "${provider}". Use one of ${VALID_PROVIDERS.join(', ')}`);
  }
  if (!model) throw new Error('createAgent: model is required');
  if (!systemPrompt) throw new Error('createAgent: systemPrompt is required');
  const db = getDb();
  try {
    const info = db
      .prepare(
        `INSERT INTO agents (name, provider, model, system_prompt, temperature, active)
         VALUES (?, ?, ?, ?, ?, 1)`,
      )
      .run(name, provider, model, systemPrompt, temperature);
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(info.lastInsertRowid);
  } catch (err) {
    logger.error('Failed to create agent', {
      name,
      provider,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(`Failed to create agent ${name}: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

function listAgents() {
  const db = getDb();
  return db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
}

function getAgentById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM agents WHERE id = ?').get(id) || null;
}

function getAgentByName(name) {
  const db = getDb();
  return db.prepare('SELECT * FROM agents WHERE name = ?').get(name) || null;
}

function setAgentActive(id, active) {
  const db = getDb();
  const info = db
    .prepare('UPDATE agents SET active = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(active ? 1 : 0, id);
  if (info.changes === 0) throw new Error(`Agent ${id} not found`);
  return getAgentById(id);
}

function assignAgentToColumn({ agentId, columnId }) {
  if (!agentId) throw new Error('assignAgentToColumn: agentId is required');
  if (!columnId) throw new Error('assignAgentToColumn: columnId is required');
  const db = getDb();
  try {
    db.prepare(
      `INSERT OR IGNORE INTO agent_column_assignments (agent_id, column_id) VALUES (?, ?)`,
    ).run(agentId, columnId);
    return listColumnAssignments(agentId);
  } catch (err) {
    logger.error('Failed to assign agent', {
      agentId,
      columnId,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(
      `Failed to assign agent ${agentId} to column ${columnId}: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function listColumnAssignments(agentId) {
  const db = getDb();
  return db
    .prepare(
      `SELECT kc.* FROM kanban_columns kc
       JOIN agent_column_assignments aca ON aca.column_id = kc.id
       WHERE aca.agent_id = ?
       ORDER BY kc.position`,
    )
    .all(agentId);
}

function getAgentForColumn(columnId) {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT a.* FROM agents a
         JOIN agent_column_assignments aca ON aca.agent_id = a.id
         WHERE aca.column_id = ? AND a.active = 1
         ORDER BY a.updated_at DESC
         LIMIT 1`,
      )
      .get(columnId) || null
  );
}

module.exports = {
  VALID_PROVIDERS,
  createAgent,
  listAgents,
  getAgentById,
  getAgentByName,
  setAgentActive,
  assignAgentToColumn,
  listColumnAssignments,
  getAgentForColumn,
};
