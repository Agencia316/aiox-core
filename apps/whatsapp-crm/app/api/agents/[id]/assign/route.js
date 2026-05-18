import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../../../src/db/db';
import { assignAgentToColumn, getAgentById } from '../../../../../src/crm/agents';
import { getColumnByName } from '../../../../../src/crm/kanban';

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
  const columnName = body?.columnName;
  if (!columnName) return NextResponse.json({ error: 'columnName is required' }, { status: 400 });
  const column = getColumnByName(columnName);
  if (!column) return NextResponse.json({ error: 'column not found' }, { status: 404 });
  try {
    const assignments = assignAgentToColumn({ agentId: agent.id, columnId: column.id });
    return NextResponse.json({ agent, column, assignments });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}
