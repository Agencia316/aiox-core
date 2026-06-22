'use strict';

const { applySchema, getDb } = require('../../db/db');
const { createCard, moveCard } = require('../../crm/kanban');
const { getContactById } = require('../../crm/contacts');

module.exports = function register(program) {
  const card = program.command('card').description('Manage Kanban cards');

  card
    .command('create <contactId>')
    .description('Create a card for a contact')
    .option('-c, --column <name>', 'Target column name', 'Novo')
    .option('-n, --notes <text>', 'Notes for the card')
    .action((contactId, opts) => {
      applySchema(getDb());
      const id = parseInt(contactId, 10);
      if (!id) {
        console.error('Invalid contactId');
        process.exitCode = 1;
        return;
      }
      const contact = getContactById(id);
      if (!contact) {
        console.error(`Contact ${id} not found`);
        process.exitCode = 1;
        return;
      }
      const created = createCard({ contactId: id, columnName: opts.column, notes: opts.notes });
      console.log(`Card #${created.id} ready in column ${opts.column}`);
    });

  card
    .command('move <cardId> <columnName>')
    .description('Move a card to another column')
    .action((cardId, columnName) => {
      applySchema(getDb());
      const id = parseInt(cardId, 10);
      if (!id) {
        console.error('Invalid cardId');
        process.exitCode = 1;
        return;
      }
      const moved = moveCard({ cardId: id, toColumnName: columnName });
      console.log(`Card #${moved.id} moved to "${columnName}"`);
    });
};
