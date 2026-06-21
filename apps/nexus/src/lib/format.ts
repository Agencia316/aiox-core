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
