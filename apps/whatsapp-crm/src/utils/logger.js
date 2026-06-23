'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function currentLevel() {
  const env = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[env] !== undefined ? LEVELS[env] : LEVELS.info;
}

function fmt(level, msg, ctx) {
  const ts = new Date().toISOString();
  const tag = `[${ts}] [${level.toUpperCase()}]`;
  if (ctx && Object.keys(ctx).length > 0) {
    return `${tag} ${msg} ${JSON.stringify(ctx)}`;
  }
  return `${tag} ${msg}`;
}

const logger = {
  error(msg, ctx) {
    if (currentLevel() >= LEVELS.error) console.error(fmt('error', msg, ctx));
  },
  warn(msg, ctx) {
    if (currentLevel() >= LEVELS.warn) console.warn(fmt('warn', msg, ctx));
  },
  info(msg, ctx) {
    if (currentLevel() >= LEVELS.info) console.log(fmt('info', msg, ctx));
  },
  debug(msg, ctx) {
    if (currentLevel() >= LEVELS.debug) console.log(fmt('debug', msg, ctx));
  },
};

module.exports = { logger };
