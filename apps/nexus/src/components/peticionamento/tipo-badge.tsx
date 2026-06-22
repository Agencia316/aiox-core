import type { DocumentoTipo } from '@/server/dto';

const LABEL: Record<DocumentoTipo, string> = {
  peticao: 'Petição',
  contrato: 'Contrato',
  procuracao: 'Procuração',
  parecer: 'Parecer',
  outro: 'Outro',
};

const TONE: Record<DocumentoTipo, string> = {
  peticao: 'bg-brand/15 text-brand',
  contrato: 'bg-gold/15 text-gold',
  procuracao: 'bg-success/15 text-success',
  parecer: 'bg-elevated text-ink',
  outro: 'bg-elevated text-muted',
};

export function TipoBadge({ tipo }: { tipo: DocumentoTipo }) {
  return <span className={`nx-chip ${TONE[tipo]}`}>{LABEL[tipo]}</span>;
}
