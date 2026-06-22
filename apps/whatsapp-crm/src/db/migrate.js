'use strict';

require('dotenv').config();
const { getDb, applySchema, resolveDbPath } = require('./db');
const { logger } = require('../utils/logger');

function migrate() {
  const target = resolveDbPath();
  logger.info('Applying schema', { path: target });
  const db = getDb();
  applySchema(db);
  logger.info('Schema applied successfully');
}

if (require.main === module) {
  try {
    migrate();
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed', { error: err instanceof Error ? err.message : 'unknown' });
    process.exit(1);
  }
}

module.exports = { migrate };
