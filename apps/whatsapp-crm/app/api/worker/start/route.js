import { NextResponse } from 'next/server';
import { startClient, getStatus } from '../../../../src/worker/whatsapp-worker';
import { getDb, applySchema } from '../../../../src/db/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  applySchema(getDb());
  const current = getStatus();
  if (current !== 'IDLE' && current !== 'DISCONNECTED' && current !== 'AUTH_FAILED') {
    return NextResponse.json({ worker: current, started: false });
  }
  startClient().catch(() => {
    // Errors are surfaced via getStatus() and getLastQr(); avoid throwing here.
  });
  return NextResponse.json({ worker: getStatus(), started: true });
}
