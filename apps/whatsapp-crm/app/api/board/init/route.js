import { NextResponse } from 'next/server';
import { getDb, applySchema } from '../../../../src/db/db';
import { initDefaultBoard } from '../../../../src/crm/kanban';

export const dynamic = 'force-dynamic';

export async function POST() {
  applySchema(getDb());
  const cols = initDefaultBoard();
  return NextResponse.json(cols);
}
