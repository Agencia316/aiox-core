'use strict';

const { applySchema, getDb } = require('../../db/db');
const {
  createAgent,
  listAgents,
  getAgentByName,
  setAgentActive,
  assignAgentToColumn,
  getAgentForColumn,
} = require('../../crm/agents');
const { getColumnByName } = require('../../crm/kanban');
const { listMessages } = require('../../crm/conversations');
const { generateReply } = require('../../ai/router');
const { logger } = require('../../utils/logger');

module.exports = function register(program) {
  const agent = program.command('agent').description('Manage AI agents');

  agent
    .command('create')
    .description('Create an AI agent')
    .requiredOption('--name <name>', 'Unique agent name')
    .requiredOption('--provider <provider>', 'openai | gemini')
    .requiredOption('--model <model>', 'Model id (e.g. gpt-4o, gemini-1.5-pro)')
    .requiredOption('--prompt <text>', 'System prompt')
    .option('--temperature <n>', 'Sampling temperature', '0.7')
    .action((opts) => {
      applySchema(getDb());
      const created = createAgent({
        name: opts.name,
        provider: opts.provider,
        model: opts.model,
        systemPrompt: opts.prompt,
        temperature: parseFloat(opts.temperature) || 0.7,
      });
      console.log(`Agent created: #${created.id} ${created.name} (${created.provider}/${created.model})`);
    });

  agent
    .command('list')
    .description('List configured agents')
    .action(() => {
      applySchema(getDb());
      const rows = listAgents();
      if (rows.length === 0) {
        console.log('No agents yet. Use `agent create` to add one.');
        return;
      }
      for (const a of rows) {
        const flag = a.active ? 'ON ' : 'OFF';
        console.log(`#${a.id}  [${flag}]  ${a.name}  -  ${a.provider}/${a.model}`);
      }
    });

  agent
    .command('toggle <agentName> <state>')
    .description('Activate / deactivate an agent (state: on|off)')
    .action((agentName, state) => {
      applySchema(getDb());
      const a = getAgentByName(agentName);
      if (!a) {
        console.error(`Agent "${agentName}" not found`);
        process.exitCode = 1;
        return;
      }
      const desired = state === 'on';
      const updated = setAgentActive(a.id, desired);
      console.log(`Agent #${updated.id} set to ${desired ? 'active' : 'inactive'}`);
    });

  agent
    .command('assign <agentName> <columnName>')
    .description('Assign an agent to act on cards inside a column')
    .action((agentName, columnName) => {
      applySchema(getDb());
      const a = getAgentByName(agentName);
      const col = getColumnByName(columnName);
      if (!a) {
        console.error(`Agent "${agentName}" not found`);
        process.exitCode = 1;
        return;
      }
      if (!col) {
        console.error(`Column "${columnName}" not found`);
        process.exitCode = 1;
        return;
      }
      assignAgentToColumn({ agentId: a.id, columnId: col.id });
      console.log(`Agent "${a.name}" assigned to column "${col.name}"`);
    });

  agent
    .command('reply <conversationId>')
    .description('Generate a suggested reply for a conversation using the assigned agent')
    .option('--agent <name>', 'Force a specific agent by name (overrides column assignment)')
    .option('--column <name>', 'Use the agent assigned to this column')
    .action(async (conversationId, opts) => {
      applySchema(getDb());
      const id = parseInt(conversationId, 10);
      if (!id) {
        console.error('Invalid conversationId');
        process.exitCode = 1;
        return;
      }
      const messages = listMessages({ conversationId: id, limit: 50 });
      if (messages.length === 0) {
        console.error('No messages in this conversation yet');
        process.exitCode = 1;
        return;
      }
      const lastInbound = [...messages].reverse().find((m) => m.direction === 'inbound');
      if (!lastInbound) {
        console.error('No inbound message to reply to');
        process.exitCode = 1;
        return;
      }
      let chosen = null;
      if (opts.agent) {
        chosen = getAgentByName(opts.agent);
      } else if (opts.column) {
        const col = getColumnByName(opts.column);
        if (col) chosen = getAgentForColumn(col.id);
      }
      if (!chosen) {
        console.error(
          'No agent selected. Use --agent <name> or --column <name> with an assigned agent.',
        );
        process.exitCode = 1;
        return;
      }
      try {
        const { reply, providerName, model } = await generateReply({
          agent: chosen,
          history: messages.slice(0, -1),
          userMessage: lastInbound.body || '',
        });
        console.log(`\n[suggested reply via ${providerName}/${model}]\n${reply}\n`);
      } catch (err) {
        logger.error('agent reply failed', {
          error: err instanceof Error ? err.message : 'unknown',
        });
        process.exitCode = 1;
      }
    });
};
