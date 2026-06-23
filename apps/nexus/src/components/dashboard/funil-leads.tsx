import type { FunilColuna, LeadColuna } from '@/server/dto';

export interface FunilLeadsProps {
  funil: FunilColuna[];
}

const LABELS: Record<LeadColuna, string> = {
  novo: 'Novo',
  qualificacao: 'Qualificação',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

const BAR: Record<LeadColuna, string> = {
  novo: 'bg-brand',
  qualificacao: 'bg-brand/80',
  proposta: 'bg-gold',
  negociacao: 'bg-gold/80',
  ganho: 'bg-success',
  perdido: 'bg-danger',
};

export function FunilLeads({ funil }: FunilLeadsProps) {
  const max = Math.max(1, ...funil.map((f) => f.total));

  return (
    <section className="nx-card p-5">
      <h2 className="font-display text-base font-semibold text-ink">Funil de leads</h2>
      <div className="mt-4 space-y-3">
        {funil.map((f) => (
          <div key={f.coluna} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-sm text-muted">{LABELS[f.coluna]}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className={`h-full rounded-full ${BAR[f.coluna]}`}
                style={{ width: `${(f.total / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-mono text-sm text-ink">{f.total}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
