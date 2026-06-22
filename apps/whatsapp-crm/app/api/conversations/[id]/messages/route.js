import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../../../src/db/db';
import { listMessages, markRead } from '../../../../../src/crm/conversations';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  applySchema(getDb());
  const id = parseInt(params.id, 10);
  if (!id) {
    return NextResponse.json({ error: 'invalid conversation id' }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '200', 10);
  const rows = listMessages({ conversationId: id, limit });
  if (searchParams.get('mark_read') === '1') markRead(id);
  return NextResponse.json(rows);
}
