'use strict';

const { applySchema, getDb } = require('../../db/db');
const { listMessages, markRead } = require('../../crm/conversations');

module.exports = function register(program) {
  program
    .command('messages <conversationId>')
    .description('List messages from a conversation')
    .option('-l, --limit <n>', 'How many messages to show', '50')
    .option('--mark-read', 'Mark the conversation as read after listing')
    .action((conversationId, opts) => {
      applySchema(getDb());
      const id = parseInt(conversationId, 10);
      if (!id) {
        console.error('Invalid conversationId');
        process.exitCode = 1;
        return;
      }
      const rows = listMessages({ conversationId: id, limit: parseInt(opts.limit, 10) || 50 });
      for (const m of rows) {
        const arrow = m.direction === 'inbound' ? '<-' : '->';
        const body = (m.body || `[${m.media_type || 'media'}]`).replace(/\n/g, ' ');
        console.log(`${m.created_at}  ${arrow}  ${body}`);
      }
      if (opts.markRead) markRead(id);
    });
};
