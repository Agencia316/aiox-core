import type { ProcessoDTO } from '@/server/dto';

const STATUS: Record<ProcessoDTO['status'], { label: string; cls: string }> = {
  ativo: { label: 'Ativo', cls: 'bg-success/15 text-success' },
  suspenso: { label: 'Suspenso', cls: 'bg-gold/15 text-gold' },
  arquivado: { label: 'Arquivado', cls: 'bg-elevated text-muted' },
  baixado: { label: 'Baixado', cls: 'bg-elevated text-muted' },
};

const FASE: Record<ProcessoDTO['fase'], string> = {
  conhecimento: 'Conhecimento',
  recursal: 'Recursal',
  execucao: 'Execução',
  cumprimento: 'Cumprimento',
};

export function StatusBadge({ status }: { status: ProcessoDTO['status'] }) {
  const s = STATUS[status];
  return <span className={`nx-chip ${s.cls}`}>{s.label}</span>;
}

export function FaseBadge({ fase }: { fase: ProcessoDTO['fase'] }) {
  return <span className="nx-chip bg-elevated text-ink">{FASE[fase]}</span>;
}
