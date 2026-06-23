import { NextResponse } from 'next/server';
import { getLastQr, getStatus } from '../../../../src/worker/whatsapp-worker';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    worker: getStatus(),
    qr: getLastQr(),
  });
}
