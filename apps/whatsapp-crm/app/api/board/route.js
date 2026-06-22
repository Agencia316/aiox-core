import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../src/db/db';
import { getBoardSnapshot } from '../../../src/crm/kanban';

export const dynamic = 'force-dynamic';

export async function GET() {
  applySchema(getDb());
  return NextResponse.json(getBoardSnapshot());
}
