'use strict';

let bootstrapDb;
let createAgent;
let listAgents;
let setAgentActive;
let assignAgentToColumn;
let getAgentForColumn;
let initDefaultBoard;
let getColumnByName;

beforeAll(() => {
  bootstrapDb = require('./helpers/in-memory-db').bootstrapDb;
  ({ createAgent, listAgents, setAgentActive, assignAgentToColumn, getAgentForColumn } =
    require('../src/crm/agents'));
  ({ initDefaultBoard, getColumnByName } = require('../src/crm/kanban'));
});

describe('crm/agents', () => {
  beforeEach(() => {
    bootstrapDb();
    initDefaultBoard();
  });

  test('createAgent stores provider + model + prompt', () => {
    const a = createAgent({
      name: 'sales-bot',
      provider: 'openai',
      model: 'gpt-4o',
      systemPrompt: 'You are a friendly sales rep.',
      temperature: 0.4,
    });
    expect(a.id).toBeDefined();
    expect(a.provider).toBe('openai');
    expect(a.temperature).toBeCloseTo(0.4);
    expect(listAgents()).toHaveLength(1);
  });

  test('rejects invalid provider', () => {
    expect(() =>
      createAgent({
        name: 'bad',
        provider: 'claude',
        model: 'claude-opus',
        systemPrompt: 'x',
      }),
    ).toThrow(/provider/);
  });

  test('setAgentActive toggles the active flag', () => {
    const a = createAgent({
      name: 'support-bot',
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      systemPrompt: 'Help users.',
    });
    const off = setAgentActive(a.id, false);
    expect(off.active).toBe(0);
    const on = setAgentActive(a.id, true);
    expect(on.active).toBe(1);
  });

  test('assignAgentToColumn + getAgentForColumn round-trip', () => {
    const a = createAgent({
      name: 'novo-bot',
      provider: 'openai',
      model: 'gpt-4o-mini',
      systemPrompt: 'Greet new leads.',
    });
    const col = getColumnByName('Novo');
    assignAgentToColumn({ agentId: a.id, columnId: col.id });
    const found = getAgentForColumn(col.id);
    expect(found.id).toBe(a.id);
  });

  test('inactive agent is not returned for column', () => {
    const a = createAgent({
      name: 'closed-bot',
      provider: 'openai',
      model: 'gpt-4o-mini',
      systemPrompt: 'Bye.',
    });
    const col = getColumnByName('Fechado');
    assignAgentToColumn({ agentId: a.id, columnId: col.id });
    setAgentActive(a.id, false);
    expect(getAgentForColumn(col.id)).toBeNull();
  });
});
