'use client';

async function http(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = (data && data.error) || `${method} ${path} failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  status: () => http('GET', '/api/status'),
  startWorker: () => http('POST', '/api/worker/start', {}),
  qr: () => http('GET', '/api/worker/qr'),
  conversations: () => http('GET', '/api/conversations'),
  messages: (id) => http('GET', `/api/conversations/${id}/messages`),
  send: (phone, text) => http('POST', '/api/messages/send', { phone, text }),
  board: () => http('GET', '/api/board'),
  initBoard: () => http('POST', '/api/board/init', {}),
  moveCard: (cardId, toColumnName) =>
    http('POST', '/api/cards/move', { cardId, toColumnName }),
  agents: () => http('GET', '/api/agents'),
  createAgent: (payload) => http('POST', '/api/agents', payload),
  toggleAgent: (id, active) => http('PATCH', `/api/agents/${id}`, { active }),
  assignAgent: (id, columnName) => http('POST', `/api/agents/${id}/assign`, { columnName }),
  suggestReply: (id, conversationId) =>
    http('POST', `/api/agents/${id}/reply`, { conversationId }),
};
