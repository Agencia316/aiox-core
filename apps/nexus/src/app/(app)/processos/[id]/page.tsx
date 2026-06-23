import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { FaseBadge, StatusBadge } from '@/components/processos/status-badge';
import { Icon } from '@/components/shell/icons';
import { formatBRL, formatData } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import { listMovimentacoesByProcesso } from '@/server/repositories/movimentacoes';
import { getProcesso } from '@/server/repositories/processos';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function ProcessoDetailPage({ params }: PageProps) {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const processo = await getProcesso(ctx.officeId, params.id);
  if (!processo) notFound();

  const movs = await listMovimentacoesByProcesso(ctx.officeId, processo.id);

  return (
    <div className="space-y-6">
      <Link
        href="/processos"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        ← Monitoramento
      </Link>

      {/* Cabeçalho */}
      <div className="nx-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-sm text-muted">{processo.cnj}</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
              {processo.clienteNome}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={processo.status} />
              <FaseBadge fase={processo.fase} />
              <span className="nx-chip bg-elevated text-muted">{processo.area}</span>
              <span className="nx-chip bg-elevated text-muted">{processo.tribunal}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted">Valor da causa</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">
              {processo.valorCausa !== null ? formatBRL(processo.valorCausa) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Movimentações */}
      <section className="nx-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink">Movimentações</h3>
          <span className="text-xs text-muted">Resumos pelo Agente Resumo</span>
        </div>

        {movs.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Sem movimentações registradas.</p>
        ) : (
          <ol className="mt-5 space-y-5 border-l border-border pl-6">
            {movs.map((m) => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand/20 text-brand ring-4 ring-surface">
                  <Icon name="gavel" size={12} />
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-ink">{m.titulo}</p>
                  <span className="font-mono text-xs text-muted">{formatData(m.data)}</span>
                </div>
                {m.resumoIa ? (
                  <p className="mt-1 text-sm text-muted">{m.resumoIa}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
