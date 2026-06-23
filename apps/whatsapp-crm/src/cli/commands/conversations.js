'use strict';

const { applySchema, getDb } = require('../../db/db');
const { listConversations } = require('../../crm/conversations');

module.exports = function register(program) {
  program
    .command('conversations')
    .description('List recent conversations')
    .option('-l, --limit <n>', 'How many conversations to list', '20')
    .action((opts) => {
      applySchema(getDb());
      const limit = parseInt(opts.limit, 10) || 20;
      const rows = listConversations({ limit });
      if (rows.length === 0) {
        console.log('No conversations yet.');
        return;
      }
      for (const r of rows) {
        const label = r.contact_name || r.phone;
        const preview = (r.last_body || '').slice(0, 60).replace(/\n/g, ' ');
        console.log(
          `#${r.id}  ${label.padEnd(28).slice(0, 28)}  unread=${r.unread_count}  "${preview}"`,
        );
      }
    });
};
