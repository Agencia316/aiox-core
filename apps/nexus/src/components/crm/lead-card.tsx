import { Icon } from '@/components/shell/icons';
import type { LeadDTO } from '@/server/dto';

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
  return (
    <article className="rounded-lg border border-border bg-elevated/60 p-3 transition-colors hover:border-brand/60">
      <header className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-medium text-ink">{lead.nome}</p>
        <span className={`nx-chip ${scoreTone(lead.score)} font-mono`}>{lead.score}</span>
      </header>
      <p className="mt-0.5 text-xs text-muted">{lead.area}</p>
      {lead.resumoIa ? (
        <p className="mt-2 line-clamp-2 text-xs text-muted/90">{lead.resumoIa}</p>
      ) : null}
      <footer className="mt-3 flex items-center justify-between text-xs text-muted">
        <span className="font-mono">{lead.telefone}</span>
        <span className="inline-flex items-center gap-1">
          {lead.origem === 'whatsapp' ? <Icon name="chat" size={12} /> : null}
          {ORIGEM_LABEL[lead.origem]}
        </span>
      </footer>
    </article>
  );
}
