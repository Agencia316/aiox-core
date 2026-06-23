'use strict';

// Populate the DB with a few demo contacts/conversations/agents so the
// dashboard has something interesting on first run (before any real WhatsApp
// message arrives). Safe to re-run — uses idempotent upserts.

require('dotenv').config();

const { getDb, applySchema } = require('../src/db/db');
const { upsertContact } = require('../src/crm/contacts');
const {
  upsertConversation,
  recordMessage,
} = require('../src/crm/conversations');
const {
  initDefaultBoard,
  ensureCardForContact,
  moveCard,
  getColumnByName,
} = require('../src/crm/kanban');
const {
  createAgent,
  getAgentByName,
  assignAgentToColumn,
} = require('../src/crm/agents');
const { logger } = require('../src/utils/logger');

const DEMO_CONVERSATIONS = [
  {
    phone: '5511980011001',
    name: 'Ana Beatriz',
    column: 'Novo',
    msgs: [
      ['inbound', 'Oi! Vi o anúncio de vocês no Instagram, ainda têm o plano anual com desconto?'],
    ],
  },
  {
    phone: '5511980022002',
    name: 'Carlos Eduardo',
    column: 'Em atendimento',
    msgs: [
      ['inbound', 'Bom dia, preciso de uma segunda via do boleto'],
      ['outbound', 'Bom dia, Carlos! Claro, vou gerar agora mesmo. Pode confirmar seu CPF?'],
      ['inbound', 'Claro: 123.456.789-00'],
    ],
  },
  {
    phone: '5511980033003',
    name: 'Juliana Martins',
    column: 'Aguardando cliente',
    msgs: [
      ['inbound', 'Quero saber sobre integração com meu sistema atual'],
      ['outbound', 'Oi Juliana! Temos integração via API. Te enviei a documentação por e-mail, deu uma olhada?'],
    ],
  },
  {
    phone: '5511980044004',
    name: 'Pedro Henrique',
    column: 'Fechado',
    msgs: [
      ['inbound', 'Fechado, podem emitir a nota'],
      ['outbound', 'Perfeito, Pedro! Nota emitida e enviada. Obrigado pela confiança!'],
    ],
  },
  {
    phone: '5511980055005',
    name: 'Mariana Costa',
    column: 'Novo',
    msgs: [['inbound', 'Vocês atendem no fim de semana?']],
  },
];

const DEMO_AGENTS = [
  {
    name: 'vendas-novos',
    provider: 'openai',
    model: 'gpt-4o-mini',
    systemPrompt:
      'Você é um SDR amigável e objetivo. Qualifique o lead, responda dúvidas sobre planos e conduza para o fechamento. Responda sempre em PT-BR, tom próximo mas profissional.',
    temperature: 0.6,
    assignColumn: 'Novo',
  },
  {
    name: 'suporte-tecnico',
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    systemPrompt:
      'Você é um agente de suporte técnico. Seja claro, empático e resolva o problema do cliente passo a passo. Responda em PT-BR.',
    temperature: 0.4,
    assignColumn: null,
  },
];

function seed() {
  applySchema(getDb());
  initDefaultBoard();

  for (const conv of DEMO_CONVERSATIONS) {
    const contact = upsertContact({ phone: conv.phone, name: conv.name });
    const chatId = `${conv.phone}@c.us`;
    const conversation = upsertConversation({
      contactId: contact.id,
      whatsappChatId: chatId,
    });
    for (const [direction, body] of conv.msgs) {
      recordMessage({
        conversationId: conversation.id,
        whatsappMsgId: `demo_${conv.phone}_${direction}_${body.slice(0, 12)}`,
        direction,
        body,
        status: direction === 'inbound' ? 'received' : 'sent',
      });
    }
    const card = ensureCardForContact(contact.id);
    if (conv.column !== 'Novo') {
      moveCard({ cardId: card.id, toColumnName: conv.column });
    }
  }

  for (const cfg of DEMO_AGENTS) {
    let agent = getAgentByName(cfg.name);
    if (!agent) {
      agent = createAgent({
        name: cfg.name,
        provider: cfg.provider,
        model: cfg.model,
        systemPrompt: cfg.systemPrompt,
        temperature: cfg.temperature,
      });
    }
    if (cfg.assignColumn) {
      const col = getColumnByName(cfg.assignColumn);
      if (col) assignAgentToColumn({ agentId: agent.id, columnId: col.id });
    }
  }

  logger.info('Demo seed applied', {
    conversations: DEMO_CONVERSATIONS.length,
    agents: DEMO_AGENTS.length,
  });
}

if (require.main === module) {
  try {
    seed();
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed', { error: err instanceof Error ? err.message : 'unknown' });
    process.exit(1);
  }
}

module.exports = { seed };
