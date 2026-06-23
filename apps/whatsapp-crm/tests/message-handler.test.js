'use strict';

let bootstrapDb;
let handleIncoming;
let extractPhone;
let initDefaultBoard;
let getBoardSnapshot;
let listConversations;

beforeAll(() => {
  bootstrapDb = require('./helpers/in-memory-db').bootstrapDb;
  ({ handleIncoming, extractPhone } = require('../src/worker/message-handler'));
  ({ initDefaultBoard, getBoardSnapshot } = require('../src/crm/kanban'));
  ({ listConversations } = require('../src/crm/conversations'));
});

describe('worker/message-handler', () => {
  beforeEach(() => {
    bootstrapDb();
    initDefaultBoard();
  });

  test('extractPhone strips the @ suffix', () => {
    expect(extractPhone('5511999990001@c.us')).toBe('5511999990001');
    expect(extractPhone(null)).toBeNull();
  });

  test('handleIncoming creates contact, conversation, message and card', () => {
    const result = handleIncoming({
      from: '5511999990001@c.us',
      body: 'Olá, gostaria de mais informações',
      pushName: 'João',
      type: 'chat',
      id: { _serialized: 'true_5511999990001@c.us_ABC' },
    });
    expect(result.contact.phone).toBe('5511999990001');
    expect(result.contact.name).toBe('João');
    expect(result.conversation.whatsapp_chat_id).toBe('5511999990001@c.us');
    expect(result.card.id).toBeDefined();

    const convs = listConversations();
    expect(convs).toHaveLength(1);
    expect(convs[0].last_body).toContain('Olá');

    const board = getBoardSnapshot();
    const novo = board.find((c) => c.name === 'Novo');
    expect(novo.cards).toHaveLength(1);
  });

  test('handleIncoming is idempotent on duplicate whatsapp_msg_id', () => {
    const payload = {
      from: '5511888880002@c.us',
      body: 'Ping',
      pushName: 'Maria',
      type: 'chat',
      id: { _serialized: 'true_5511888880002@c.us_XYZ' },
    };
    handleIncoming(payload);
    handleIncoming(payload);
    const convs = listConversations();
    expect(convs).toHaveLength(1);
  });
});
