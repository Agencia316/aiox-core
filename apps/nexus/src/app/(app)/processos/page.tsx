import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { FaseBadge, StatusBadge } from '@/components/processos/status-badge';
import { formatBRL } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import { listProcessos } from '@/server/repositories/processos';

export const dynamic = 'force-dynamic';

export default async function ProcessosPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const processos = await listProcessos(ctx.officeId);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Monitoramento processual</h2>
          <p className="text-sm text-muted">
            {processos.length} processo{processos.length === 1 ? '' : 's'} — 90+ tribunais via JUDIT
          </p>
        </div>
      </div>

      <div className="nx-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">CNJ</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Área</th>
              <th className="px-4 py-3 font-medium">Tribunal</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Fase</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {processos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Nenhum processo em monitoramento ainda.
                </td>
              </tr>
            ) : (
              processos.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-elevated/40">
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    <Link href={`/processos/${p.id}`} className="hover:text-brand">
                      {p.cnj}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/processos/${p.id}`} className="text-ink hover:text-brand">
                      {p.clienteNome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.area}</td>
                  <td className="px-4 py-3 text-muted">{p.tribunal}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <FaseBadge fase={p.fase} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink">
                    {p.valorCausa !== null ? formatBRL(p.valorCausa) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
