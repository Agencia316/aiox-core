'use strict';

const { upsertContact } = require('../crm/contacts');
const { upsertConversation, recordMessage } = require('../crm/conversations');
const { ensureCardForContact } = require('../crm/kanban');
const { logger } = require('../utils/logger');

function extractPhone(chatId) {
  if (!chatId || typeof chatId !== 'string') return null;
  const [num] = chatId.split('@');
  return num || null;
}

function handleIncoming(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('handleIncoming: message is required');
  }
  const chatId = message.from || message.chatId;
  const phone = extractPhone(chatId);
  if (!phone) {
    logger.warn('Skipping message without resolvable phone', { chatId });
    return null;
  }
  const contact = upsertContact({
    phone,
    name: message.pushName || message._data?.notifyName || null,
    isBusiness: Boolean(message.isBusiness),
  });
  const conversation = upsertConversation({
    contactId: contact.id,
    whatsappChatId: chatId,
  });
  const stored = recordMessage({
    conversationId: conversation.id,
    whatsappMsgId: message.id?._serialized || message.id || null,
    direction: 'inbound',
    body: message.body || null,
    mediaType: message.type || null,
    status: 'received',
  });
  const card = ensureCardForContact(contact.id);
  logger.info('Inbound message stored', {
    phone,
    conversationId: conversation.id,
    cardId: card?.id,
  });
  return { contact, conversation, message: stored, card };
}

function handleOutgoing({ chatId, body, whatsappMsgId, status = 'sent' }) {
  const phone = extractPhone(chatId);
  if (!phone) throw new Error(`handleOutgoing: cannot resolve phone from chatId "${chatId}"`);
  const contact = upsertContact({ phone });
  const conversation = upsertConversation({
    contactId: contact.id,
    whatsappChatId: chatId,
  });
  return recordMessage({
    conversationId: conversation.id,
    whatsappMsgId,
    direction: 'outbound',
    body,
    status,
  });
}

module.exports = { handleIncoming, handleOutgoing, extractPhone };
