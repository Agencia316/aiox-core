'use strict';

let bootstrapDb;
let upsertContact;
let initDefaultBoard;
let getBoardSnapshot;
let createCard;
let moveCard;
let ensureCardForContact;

beforeAll(() => {
  bootstrapDb = require('./helpers/in-memory-db').bootstrapDb;
  ({ upsertContact } = require('../src/crm/contacts'));
  ({ initDefaultBoard, getBoardSnapshot, createCard, moveCard, ensureCardForContact } =
    require('../src/crm/kanban'));
});

describe('crm/kanban', () => {
  beforeEach(() => {
    bootstrapDb();
  });

  test('initDefaultBoard creates the four default columns', () => {
    const cols = initDefaultBoard();
    expect(cols.map((c) => c.name)).toEqual([
      'Novo',
      'Em atendimento',
      'Aguardando cliente',
      'Fechado',
    ]);
  });

  test('createCard places a card in the chosen column', () => {
    initDefaultBoard();
    const contact = upsertContact({ phone: '5511999990001', name: 'Alice' });
    const card = createCard({ contactId: contact.id, columnName: 'Em atendimento' });
    const snap = getBoardSnapshot();
    const target = snap.find((c) => c.name === 'Em atendimento');
    expect(target.cards.map((c) => c.id)).toContain(card.id);
  });

  test('moveCard relocates a card between columns', () => {
    initDefaultBoard();
    const contact = upsertContact({ phone: '5511999990002', name: 'Bob' });
    const card = createCard({ contactId: contact.id, columnName: 'Novo' });
    moveCard({ cardId: card.id, toColumnName: 'Fechado' });
    const snap = getBoardSnapshot();
    const fechado = snap.find((c) => c.name === 'Fechado');
    expect(fechado.cards.map((c) => c.id)).toContain(card.id);
    const novo = snap.find((c) => c.name === 'Novo');
    expect(novo.cards.map((c) => c.id)).not.toContain(card.id);
  });

  test('ensureCardForContact is idempotent', () => {
    initDefaultBoard();
    const contact = upsertContact({ phone: '5511999990003', name: 'Carol' });
    const a = ensureCardForContact(contact.id);
    const b = ensureCardForContact(contact.id);
    expect(a.id).toBe(b.id);
  });

  test('moving an unknown card throws', () => {
    initDefaultBoard();
    expect(() => moveCard({ cardId: 9999, toColumnName: 'Novo' })).toThrow(/9999/);
  });
});
