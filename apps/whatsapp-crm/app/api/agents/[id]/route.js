import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../../src/db/db';
import { setAgentActive, getAgentById } from '../../../../src/crm/agents';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  applySchema(getDb());
  const id = parseInt(params.id, 10);
  const agent = getAgentById(id);
  if (!agent) return NextResponse.json({ error: 'agent not found' }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(req, { params }) {
  applySchema(getDb());
  const id = parseInt(params.id, 10);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (typeof body?.active !== 'boolean') {
    return NextResponse.json({ error: 'active (boolean) is required' }, { status: 400 });
  }
  try {
    const updated = setAgentActive(id, body.active);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 400 },
    );
  }
}
