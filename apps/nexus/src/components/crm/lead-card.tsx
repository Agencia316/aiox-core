'use client';

import { useTransition } from 'react';

import { moveLeadAction } from '@/app/(app)/crm/actions';
import { Icon } from '@/components/shell/icons';
import type { LeadColuna, LeadDTO } from '@/server/dto';

const ORDER: LeadColuna[] = [
  'novo',
  'qualificacao',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
];

const ORIGEM_LABEL: Record<LeadDTO['origem'], string> = {
  whatsapp: 'WhatsApp',
  indicacao: 'Indicação',
  site: 'Site',
  anuncio: 'Anúncio',
  organico: 'Orgânico',
};

function scoreTone(score: number): string {
  if (score >= 80) return 'bg-success/15 text-success';
  if (score >= 50) return 'bg-gold/15 text-gold';
  return 'bg-danger/15 text-danger';
}

export function LeadCard({ lead }: { lead: LeadDTO }) {
  const [pending, startTransition] = useTransition();
  const idx = ORDER.indexOf(lead.colunaFunil);

  const mover = (dir: -1 | 1) => {
    const destino = ORDER[idx + dir];
    if (!destino) return;
    startTransition(() => {
      void moveLeadAction(lead.id, destino);
    });
  };

  return (
    <article
      className={`rounded-lg border border-border bg-elevated/60 p-3 transition-colors hover:border-brand/60 ${
        pending ? 'opacity-50' : ''
      }`}
    >
      <header className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium text-ink">{lead.nome}</p>
        <span className={`nx-chip ${scoreTone(lead.score)} font-mono`}>{lead.score}</span>
      </header>
      <p className="mt-0.5 text-xs text-muted">{lead.area}</p>
      {lead.resumoIa ? (
        <p className="mt-2 line-clamp-2 text-xs text-muted/90">{lead.resumoIa}</p>
      ) : null}

      <footer className="mt-3 flex items-center justify-between text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          {lead.origem === 'whatsapp' ? <Icon name="chat" size={12} /> : null}
          {ORIGEM_LABEL[lead.origem]}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={pending || idx <= 0}
            aria-label="Mover para a coluna anterior"
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-surface text-muted hover:text-ink disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            disabled={pending || idx >= ORDER.length - 1}
            aria-label="Mover para a próxima coluna"
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-surface text-muted hover:text-ink disabled:opacity-30"
          >
            ›
          </button>
        </span>
      </footer>
    </article>
  );
}
