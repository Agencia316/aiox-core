'use strict';

const openai = require('./openai-provider');
const gemini = require('./gemini-provider');
const { logger } = require('../utils/logger');

const PROVIDERS = {
  openai,
  gemini,
};

/**
 * Generate a reply for a given agent + conversation context.
 *
 * @param {Object} params
 * @param {Object} params.agent - agent row from DB (provider, model, system_prompt, temperature)
 * @param {Array}  params.history - messages array ordered ASC (each: {direction, body})
 * @param {string} params.userMessage - the latest inbound message body
 * @returns {Promise<{reply: string, providerName: string, model: string}>}
 */
async function generateReply({ agent, history, userMessage }) {
  if (!agent) throw new Error('generateReply: agent is required');
  const provider = PROVIDERS[agent.provider];
  if (!provider) {
    throw new Error(`generateReply: unsupported provider "${agent.provider}"`);
  }
  if (!userMessage) {
    throw new Error('generateReply: userMessage is required');
  }
  logger.debug('Generating reply', {
    provider: agent.provider,
    model: agent.model,
    agent: agent.name,
  });
  const { reply } = await provider.chat({
    model: agent.model,
    systemPrompt: agent.system_prompt,
    history,
    userMessage,
    temperature: agent.temperature ?? 0.7,
  });
  return { reply, providerName: agent.provider, model: agent.model };
}

function _registerProviderForTests(name, impl) {
  PROVIDERS[name] = impl;
}

module.exports = {
  generateReply,
  PROVIDERS,
  _registerProviderForTests,
};
