import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../../../src/db/db';
import { getAgentById } from '../../../../../src/crm/agents';
import { listMessages } from '../../../../../src/crm/conversations';
import { generateReply } from '../../../../../src/ai/router';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  applySchema(getDb());
  const id = parseInt(params.id, 10);
  const agent = getAgentById(id);
  if (!agent) return NextResponse.json({ error: 'agent not found' }, { status: 404 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const conversationId = parseInt(body?.conversationId, 10);
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }
  const messages = listMessages({ conversationId, limit: 50 });
  const lastInbound = [...messages].reverse().find((m) => m.direction === 'inbound');
  if (!lastInbound) {
    return NextResponse.json({ error: 'no inbound message to reply to' }, { status: 400 });
  }
  try {
    const result = await generateReply({
      agent,
      history: messages.slice(0, -1),
      userMessage: lastInbound.body || '',
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}
