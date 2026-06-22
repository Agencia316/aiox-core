'use strict';

const { applySchema, getDb } = require('../../db/db');
const { startClient, getStatus } = require('../../worker/whatsapp-worker');
const { initDefaultBoard } = require('../../crm/kanban');
const { logger } = require('../../utils/logger');

module.exports = function register(program) {
  program
    .command('qr')
    .description('Start the WhatsApp worker and display the pairing QR Code')
    .option('--no-board', 'Skip default kanban board initialization')
    .action(async (opts) => {
      applySchema(getDb());
      if (opts.board !== false) {
        try {
          initDefaultBoard();
        } catch (err) {
          logger.warn('Could not initialize default board', {
            error: err instanceof Error ? err.message : 'unknown',
          });
        }
      }
      logger.info('Starting WhatsApp worker (Ctrl+C to stop)');
      try {
        await startClient();
      } catch (err) {
        logger.error('Failed to start client', {
          error: err instanceof Error ? err.message : 'unknown',
        });
        process.exitCode = 1;
        return;
      }
      const onSignal = async (sig) => {
        logger.info('Received signal, shutting down', { signal: sig, status: getStatus() });
        process.exit(0);
      };
      process.on('SIGINT', onSignal);
      process.on('SIGTERM', onSignal);
    });
};
