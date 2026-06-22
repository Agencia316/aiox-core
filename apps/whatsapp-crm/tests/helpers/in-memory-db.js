'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');

function freshDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wcrm-test-'));
  return path.join(dir, 'test.db');
}

function bootstrapDb() {
  const dbPath = freshDbPath();
  process.env.DB_PATH = dbPath;
  const { getDb, applySchema, closeDb } = require('../../src/db/db');
  closeDb();
  const db = getDb(dbPath);
  applySchema(db);
  return { db, dbPath };
}

module.exports = { freshDbPath, bootstrapDb };
