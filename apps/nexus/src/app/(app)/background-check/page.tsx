import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ConsultaBgc } from '@/components/background-check/consulta-bgc';
import { getOfficeContext } from '@/lib/office-context';
import { listBackgroundChecks } from '@/server/repositories/background-check';

export const dynamic = 'force-dynamic';

export default async function BackgroundCheckPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const resultados = await listBackgroundChecks(ctx.officeId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Background Check</h2>
          <p className="text-sm text-muted">
            Consulta criminal — BNMP (mandados) + SEEU (execução penal)
          </p>
        </div>
        <span className="nx-chip bg-gold/15 text-gold">Add-on criminal</span>
      </div>

      <ConsultaBgc inicial={resultados} />
    </div>
  );
}
