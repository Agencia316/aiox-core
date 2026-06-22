import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../../src/db/db';
import { moveCard } from '../../../../src/crm/kanban';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  applySchema(getDb());
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const cardId = parseInt(body?.cardId, 10);
  const toColumnName = body?.toColumnName;
  if (!cardId || !toColumnName) {
    return NextResponse.json(
      { error: 'cardId and toColumnName are required' },
      { status: 400 },
    );
  }
  try {
    const moved = moveCard({ cardId, toColumnName });
    return NextResponse.json(moved);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 400 },
    );
  }
}
