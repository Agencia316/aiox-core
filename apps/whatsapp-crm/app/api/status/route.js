import { NextResponse } from 'next/server';
import { resolveDbPath, getDb, applySchema } from '../../../src/db/db';
import { getStatus } from '../../../src/worker/whatsapp-worker';

export const dynamic = 'force-dynamic';

export async function GET() {
  applySchema(getDb());
  return NextResponse.json({
    worker: getStatus(),
    db_path: resolveDbPath(),
    session_path: process.env.WHATSAPP_SESSION_PATH || './sessions',
    openai_configured: Boolean(process.env.OPENAI_API_KEY),
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
  });
}
