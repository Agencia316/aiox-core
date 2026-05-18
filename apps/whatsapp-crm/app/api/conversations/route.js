import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../src/db/db';
import { listConversations } from '../../../src/crm/conversations';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  applySchema(getDb());
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const rows = listConversations({ limit });
  return NextResponse.json(rows);
}
