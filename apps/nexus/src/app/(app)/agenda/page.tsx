import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Icon } from '@/components/shell/icons';
import { descricaoPrazo, diasAte, formatDataFull } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import { listPrazos } from '@/server/repositories/prazos';

export const dynamic = 'force-dynamic';

function urgenciaTone(prazo: { urgente: boolean; dataVencimento: string }): string {
  const d = diasAte(prazo.dataVencimento);
  if (d < 0) return 'bg-danger/15 text-danger';
  if (prazo.urgente || d <= 3) return 'bg-danger/15 text-danger';
  if (d <= 7) return 'bg-gold/15 text-gold';
  return 'bg-success/15 text-success';
}

export default async function AgendaPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const prazos = await listPrazos(ctx.officeId);
  const urgentes = prazos.filter((p) => p.urgente || diasAte(p.dataVencimento) <= 3).length;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Agenda &amp; Prazos</h2>
          <p className="text-sm text-muted">
            {prazos.length} prazo{prazos.length === 1 ? '' : 's'} em aberto · {urgentes} urgente
            {urgentes === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="nx-card overflow-hidden">
        {prazos.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Nenhum prazo cadastrado.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {prazos.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-elevated/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <Icon name="calendar" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{p.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {p.processoId ? (
                      <Link
                        href={`/processos/${p.processoId}`}
                        className="hover:text-brand"
                      >
                        Ver processo
                      </Link>
                    ) : (
                      'Sem processo vinculado'
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm text-ink">{formatDataFull(p.dataVencimento)}</p>
                  <span className={`nx-chip mt-1 ${urgenciaTone(p)}`}>
                    {descricaoPrazo(p.dataVencimento)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
