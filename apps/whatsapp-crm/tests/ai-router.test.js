'use strict';

const { generateReply, _registerProviderForTests } = require('../src/ai/router');

describe('ai/router', () => {
  test('routes to the OpenAI fake provider', async () => {
    const fake = {
      chat: jest.fn(async ({ model, systemPrompt, userMessage, temperature }) => ({
        reply: `OPENAI(${model}, t=${temperature}): ${userMessage}`,
        raw: { model, systemPrompt },
      })),
    };
    _registerProviderForTests('openai', fake);
    const agent = {
      name: 'sales',
      provider: 'openai',
      model: 'gpt-4o',
      system_prompt: 'Be nice.',
      temperature: 0.2,
    };
    const result = await generateReply({
      agent,
      history: [{ direction: 'inbound', body: 'Oi' }],
      userMessage: 'Quanto custa?',
    });
    expect(fake.chat).toHaveBeenCalledTimes(1);
    expect(result.providerName).toBe('openai');
    expect(result.model).toBe('gpt-4o');
    expect(result.reply).toContain('Quanto custa?');
  });

  test('routes to the Gemini fake provider', async () => {
    const fake = {
      chat: jest.fn(async ({ model, userMessage }) => ({
        reply: `GEMINI(${model}): ${userMessage}`,
      })),
    };
    _registerProviderForTests('gemini', fake);
    const agent = {
      name: 'support',
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      system_prompt: 'Help.',
      temperature: 0.7,
    };
    const result = await generateReply({
      agent,
      history: [],
      userMessage: 'Status do pedido?',
    });
    expect(result.providerName).toBe('gemini');
    expect(result.reply).toContain('Status do pedido?');
  });

  test('rejects unsupported provider', async () => {
    const agent = { provider: 'azure', model: 'foo', system_prompt: 'bar' };
    await expect(
      generateReply({ agent, history: [], userMessage: 'hi' }),
    ).rejects.toThrow(/unsupported provider/);
  });

  test('requires userMessage', async () => {
    const fake = { chat: jest.fn() };
    _registerProviderForTests('openai', fake);
    const agent = { provider: 'openai', model: 'gpt-4o', system_prompt: 's' };
    await expect(
      generateReply({ agent, history: [], userMessage: '' }),
    ).rejects.toThrow(/userMessage/);
  });
});
