/** Formatação pt-BR para a UI. */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export function formatBRL(valor: number): string {
  return BRL.format(valor);
}

const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

export function formatData(iso: string): string {
  return DATE.format(new Date(iso));
}

const DATE_FULL = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDataFull(iso: string): string {
  return DATE_FULL.format(new Date(iso));
}

/**
 * Dias entre `iso` (data) e hoje. Positivo = futuro, negativo = passado.
 * `iso` pode ser 'YYYY-MM-DD' (data pura) ou ISO completo.
 */
export function diasAte(iso: string): number {
  const target = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

export function descricaoPrazo(iso: string): string {
  const d = diasAte(iso);
  if (d === 0) return 'Vence hoje';
  if (d === 1) return 'Vence amanhã';
  if (d > 0) return `Em ${d} dias`;
  if (d === -1) return 'Venceu ontem';
  return `Vencido há ${Math.abs(d)} dias`;
}
