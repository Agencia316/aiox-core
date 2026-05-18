import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../src/db/db';
import { listAgents, createAgent } from '../../../src/crm/agents';

export const dynamic = 'force-dynamic';

export async function GET() {
  applySchema(getDb());
  return NextResponse.json(listAgents());
}

export async function POST(req) {
  applySchema(getDb());
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const { name, provider, model, systemPrompt, temperature } = body || {};
  try {
    const created = createAgent({
      name,
      provider,
      model,
      systemPrompt,
      temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
    });
    return NextResponse.json(created);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 400 },
    );
  }
}
