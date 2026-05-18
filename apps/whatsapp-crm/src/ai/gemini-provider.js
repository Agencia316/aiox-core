'use strict';

const { logger } = require('../utils/logger');

let _client = null;

function loadSdk() {
  try {
    return require('@google/generative-ai');
  } catch (err) {
    throw new Error(
      `Failed to load @google/generative-ai. Run "npm install" inside apps/whatsapp-crm/. Original: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function getClient(apiKeyOverride) {
  if (_client) return _client;
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Configure it in .env to use Gemini agents.');
  }
  const sdk = loadSdk();
  const Ctor = sdk.GoogleGenerativeAI || sdk.default || sdk;
  _client = new Ctor(apiKey);
  return _client;
}

function resetClient() {
  _client = null;
}

async function chat({ model, systemPrompt, history, userMessage, temperature = 0.7 }) {
  if (!model) throw new Error('gemini.chat: model is required');
  if (!userMessage) throw new Error('gemini.chat: userMessage is required');
  const genAi = getClient();
  const generativeModel = genAi.getGenerativeModel({
    model,
    systemInstruction: systemPrompt || 'You are a helpful assistant.',
    generationConfig: { temperature },
  });

  const contents = (history || []).map((h) => ({
    role: h.direction === 'inbound' ? 'user' : 'model',
    parts: [{ text: h.body || '' }],
  }));

  try {
    const chatSession = generativeModel.startChat({ history: contents });
    const result = await chatSession.sendMessage(userMessage);
    const reply = result?.response?.text ? result.response.text() : '';
    return { reply, raw: result };
  } catch (err) {
    logger.error('Gemini chat failed', {
      model,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(`Gemini chat failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

module.exports = { chat, getClient, resetClient };
