'use strict';

const { Command } = require('commander');
const pkg = require('../../package.json');
const { logger } = require('../utils/logger');

const registerQr = require('./commands/qr');
const registerStatus = require('./commands/status');
const registerSend = require('./commands/send');
const registerConversations = require('./commands/conversations');
const registerMessages = require('./commands/messages');
const registerBoard = require('./commands/board');
const registerCard = require('./commands/card');
const registerAgent = require('./commands/agent');

function build() {
  const program = new Command();
  program
    .name('whatsapp-crm')
    .description('WhatsApp CRM Kanban with AI agents (OpenAI/Gemini) — CLI First MVP')
    .version(pkg.version);

  registerQr(program);
  registerStatus(program);
  registerSend(program);
  registerConversations(program);
  registerMessages(program);
  registerBoard(program);
  registerCard(program);
  registerAgent(program);

  return program;
}

function run(argv) {
  const program = build();
  program.parseAsync(argv).catch((err) => {
    logger.error('CLI error', { error: err instanceof Error ? err.message : 'unknown' });
    process.exit(1);
  });
}

module.exports = { build, run };
