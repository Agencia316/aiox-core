'use strict';

const { getStatus } = require('../../worker/whatsapp-worker');
const { resolveDbPath } = require('../../db/db');

module.exports = function register(program) {
  program
    .command('status')
    .description('Show worker status and configuration')
    .action(() => {
      const info = {
        worker: getStatus(),
        db_path: resolveDbPath(),
        session_path: process.env.WHATSAPP_SESSION_PATH || './sessions',
        openai_configured: Boolean(process.env.OPENAI_API_KEY),
        gemini_configured: Boolean(process.env.GEMINI_API_KEY),
      };
      console.log(JSON.stringify(info, null, 2));
    });
};
