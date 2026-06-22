'use strict';

const { sendText } = require('../../worker/whatsapp-worker');
const { logger } = require('../../utils/logger');

module.exports = function register(program) {
  program
    .command('send <phone> <text>')
    .description('Send a text message to a phone number (worker must be running)')
    .action(async (phone, text) => {
      try {
        const result = await sendText({ phone, text });
        logger.info('Message sent', { id: result?.id?._serialized || null });
      } catch (err) {
        logger.error('send failed', { error: err instanceof Error ? err.message : 'unknown' });
        process.exitCode = 1;
      }
    });
};
