import { Icon } from '@/components/shell/icons';
import { formatData } from '@/lib/format';
import type { MovimentacaoDTO } from '@/server/dto';

export interface AtividadeRecenteProps {
  movimentacoes: MovimentacaoDTO[];
}

export function AtividadeRecente({ movimentacoes }: AtividadeRecenteProps) {
  return (
    <section className="nx-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Atividade recente</h2>
        <span className="text-xs text-muted">Resumos pelo Agente Resumo</span>
      </div>

      {movimentacoes.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Sem movimentações recentes.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {movimentacoes.map((m) => (
            <li key={m.id} className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <Icon name="gavel" size={16} />
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-sm font-medium text-ink">{m.titulo}</p>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {formatData(m.data)}
                  </span>
                </div>
                {m.resumoIa ? (
                  <p className="mt-0.5 text-sm text-muted">{m.resumoIa}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
