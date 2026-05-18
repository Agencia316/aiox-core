'use strict';

const path = require('path');
const { logger } = require('../utils/logger');
const { handleIncoming, handleOutgoing } = require('./message-handler');

let _client = null;
let _status = 'IDLE';
let _lastQr = null;

function getLastQr() {
  return _lastQr;
}

function clearLastQr() {
  _lastQr = null;
}

function loadWhatsappLib() {
  try {
    return require('whatsapp-web.js');
  } catch (err) {
    throw new Error(
      `Failed to load whatsapp-web.js. Run "npm install" inside apps/whatsapp-crm/. Original: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  }
}

function loadQrTerminal() {
  try {
    return require('qrcode-terminal');
  } catch {
    return null;
  }
}

function resolveSessionPath() {
  return path.resolve(process.env.WHATSAPP_SESSION_PATH || './sessions');
}

function getStatus() {
  return _status;
}

function setStatus(next) {
  _status = next;
  logger.info('Worker status', { status: next });
}

async function startClient({ onQr, onReady, onAuthFailure } = {}) {
  if (_client) {
    logger.warn('startClient: client already started');
    return _client;
  }
  const lib = loadWhatsappLib();
  const qrTerm = loadQrTerminal();
  const headless = (process.env.WHATSAPP_HEADLESS || 'true').toLowerCase() !== 'false';

  setStatus('CONNECTING');
  const client = new lib.Client({
    authStrategy: new lib.LocalAuth({ dataPath: resolveSessionPath() }),
    puppeteer: {
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (qr) => {
    _lastQr = qr;
    logger.info('QR Code received, scan it with your phone');
    if (qrTerm && typeof qrTerm.generate === 'function') {
      qrTerm.generate(qr, { small: true });
    }
    if (typeof onQr === 'function') onQr(qr);
  });

  client.on('ready', () => {
    setStatus('READY');
    _lastQr = null;
    logger.info('WhatsApp client ready');
    if (typeof onReady === 'function') onReady();
  });

  client.on('authenticated', () => {
    logger.info('WhatsApp authenticated');
  });

  client.on('auth_failure', (msg) => {
    setStatus('AUTH_FAILED');
    logger.error('WhatsApp auth failure', { message: msg });
    if (typeof onAuthFailure === 'function') onAuthFailure(msg);
  });

  client.on('disconnected', (reason) => {
    setStatus('DISCONNECTED');
    logger.warn('WhatsApp disconnected', { reason });
  });

  client.on('message', (message) => {
    try {
      handleIncoming(message);
    } catch (err) {
      logger.error('Failed to handle inbound message', {
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  });

  _client = client;
  await client.initialize();
  return client;
}

async function stopClient() {
  if (!_client) return;
  try {
    await _client.destroy();
  } catch (err) {
    logger.warn('Failed to destroy client cleanly', {
      error: err instanceof Error ? err.message : 'unknown',
    });
  }
  _client = null;
  setStatus('IDLE');
}

async function sendText({ phone, text }) {
  if (!_client) throw new Error('sendText: WhatsApp client not started. Run `whatsapp-crm qr` first.');
  if (!phone) throw new Error('sendText: phone is required');
  if (!text) throw new Error('sendText: text is required');
  const chatId = phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@c.us`;
  try {
    const sent = await _client.sendMessage(chatId, text);
    handleOutgoing({
      chatId,
      body: text,
      whatsappMsgId: sent?.id?._serialized || null,
      status: 'sent',
    });
    return sent;
  } catch (err) {
    logger.error('Failed to send WhatsApp message', {
      phone,
      error: err instanceof Error ? err.message : 'unknown',
    });
    throw new Error(`Failed to send message to ${phone}: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

module.exports = { startClient, stopClient, sendText, getStatus, getLastQr, clearLastQr };
