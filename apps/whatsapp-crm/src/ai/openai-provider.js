'use strict';

const { logger } = require('../utils/logger');

let _client = null;

function loadSdk() {
  try {
    return require('openai');
  } catch (err) {
    throw new Error(
      `Failed to load openai SDK. Run "npm install" inside apps/whatsapp-crm/. Original: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function getClient(apiKeyOverride) {
  if (_client) return _client;
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Configure it in .env to use OpenAI agents.');
  }
  const sdk = loadSdk();
  const Ctor = sdk.OpenAI || sdk.default || sdk;
  _client = new Ctor({ apiKey });
  return _client;
}

function resetClient() {
  _client = null;
}

async function chat({ model, systemPrompt, history, userMessage, temperature = 0.7 }) {
  if (!model) throw new Error('openai.chat: model is required');
  if (!userMessage) throw new Error('openai.chat: userMessage is required');
  const client = getClient();
  const messages = [
    { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
    ...(history || []).map((h) => ({
      role: h.direction === 'inbound' ? 'user' : 'assistant',
      content: h.body || '',
    })),
    { role: 'user', content: userMessage },
  ];
  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature,
    });
    const reply = completion?.choices?.[0]?.message?.content || '';
    return { reply, raw: completion };
  } catch (err) {
    logger.error('OpenAI chat failed', {
      model,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(`OpenAI chat failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

module.exports = { chat, getClient, resetClient };
