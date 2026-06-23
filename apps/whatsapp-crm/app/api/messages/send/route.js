import { NextResponse } from 'next/server';
import { sendText, getStatus } from '../../../../src/worker/whatsapp-worker';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const { phone, text } = payload || {};
  if (!phone || !text) {
    return NextResponse.json({ error: 'phone and text are required' }, { status: 400 });
  }
  if (getStatus() !== 'READY') {
    return NextResponse.json(
      {
        error:
          'WhatsApp worker not ready. Start it in a terminal with `npx whatsapp-crm qr` and scan the QR.',
        worker_status: getStatus(),
      },
      { status: 409 },
    );
  }
  try {
    const sent = await sendText({ phone, text });
    return NextResponse.json({ id: sent?.id?._serialized || null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown error' },
      { status: 500 },
    );
  }
}
