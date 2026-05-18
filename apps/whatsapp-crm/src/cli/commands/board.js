'use strict';

const { applySchema, getDb } = require('../../db/db');
const { initDefaultBoard, getBoardSnapshot } = require('../../crm/kanban');

module.exports = function register(program) {
  const board = program.command('board').description('Manage the Kanban board');

  board
    .command('init')
    .description('Create default columns (Novo / Em atendimento / Aguardando / Fechado)')
    .action(() => {
      applySchema(getDb());
      const cols = initDefaultBoard();
      console.log('Board ready:');
      for (const c of cols) console.log(`  - ${c.name} (pos=${c.position})`);
    });

  board
    .command('show')
    .description('Render the current board with cards')
    .action(() => {
      applySchema(getDb());
      const snap = getBoardSnapshot();
      if (snap.length === 0) {
        console.log('Board not initialized. Run `whatsapp-crm board init`.');
        return;
      }
      for (const col of snap) {
        console.log(`\n== ${col.name} (${col.cards.length}) ==`);
        for (const card of col.cards) {
          const label = card.contact_name || card.phone;
          console.log(`  #${card.id}  ${label}`);
        }
      }
    });
};
