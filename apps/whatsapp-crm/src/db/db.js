'use strict';

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

let _db = null;
let _dbPath = null;

function resolveDbPath(override) {
  const fromEnv = process.env.DB_PATH;
  const target = override || fromEnv || path.join(process.cwd(), 'data', 'whatsapp-crm.db');
  return path.resolve(target);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadDriver() {
  try {
    return require('better-sqlite3');
  } catch (err) {
    throw new Error(
      `Failed to load better-sqlite3. Run "npm install" inside apps/whatsapp-crm/. Original: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function getDb(override) {
  const target = resolveDbPath(override);
  if (_db && _dbPath === target) return _db;
  if (_db) {
    try {
      _db.close();
    } catch (closeErr) {
      logger.warn('Failed to close previous DB handle', {
        error: closeErr instanceof Error ? closeErr.message : 'unknown',
      });
    }
  }
  ensureDir(target);
  const Database = loadDriver();
  _db = new Database(target);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _dbPath = target;
  logger.debug('SQLite opened', { path: target });
  return _db;
}

function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
    _dbPath = null;
  }
}

function applySchema(db) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(sql);
}

module.exports = { getDb, closeDb, applySchema, resolveDbPath };
