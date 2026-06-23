import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { FaseBadge, StatusBadge } from '@/components/processos/status-badge';
import { Icon } from '@/components/shell/icons';
import { formatBRL, formatData } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import { listCobrancas } from '@/server/repositories/equipe';
import { listMovimentacoesByProcesso } from '@/server/repositories/movimentacoes';
import { getProcesso, listProcessos } from '@/server/repositories/processos';

export const dynamic = 'force-dynamic';

// Visão "como o cliente vê" — preview do Portal self-service. Em produção, o
// cliente autentica e enxerga apenas o(s) próprio(s) processo(s); aqui usamos o
// primeiro processo do escritório demo como exemplo.
export default async function PortalPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const processos = await listProcessos(ctx.officeId);
  const principal = processos[0] ?? null;
  const processo = principal ? await getProcesso(ctx.officeId, principal.id) : null;
  const movs = processo ? await listMovimentacoesByProcesso(ctx.officeId, processo.id) : [];
  const cobrancas = await listCobrancas(ctx.officeId);
  const pendente = cobrancas.find((c) => c.status === 'pendente') ?? null;

  if (!processo) {
    return (
      <div className="nx-card p-10 text-center text-sm text-muted">
        Nenhum processo para exibir no portal.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Portal do Cliente</h2>
          <p className="text-sm text-muted">Pré-visualização — como {processo.clienteNome} vê</p>
        </div>
        <span className="nx-chip bg-elevated text-muted">Visão do cliente</span>
      </div>

      {/* Saudação + atendimento */}
      <div className="nx-card flex items-center gap-4 p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Icon name="capi" size={26} />
        </span>
        <div className="flex-1">
          <p className="font-display text-lg font-semibold text-ink">
            Olá, {processo.clienteNome.split(' ')[0]}!
          </p>
          <p className="text-sm text-muted">
            Sou o Caio. Acompanhe aqui seu processo e fale comigo a qualquer hora.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-muted"
        >
          Falar com o Caio
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Processo + andamento */}
        <section className="nx-card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-muted">{processo.cnj}</p>
              <p className="font-display text-base font-semibold text-ink">
                {processo.area} · {processo.tribunal}
              </p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={processo.status} />
              <FaseBadge fase={processo.fase} />
            </div>
          </div>

          <h3 className="mt-5 text-xs uppercase tracking-wider text-muted">Andamento</h3>
          {movs.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Sem novidades por enquanto.</p>
          ) : (
            <ol className="mt-3 space-y-4 border-l border-border pl-5">
              {movs.map((m) => (
                <li key={m.id} className="relative">
                  <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-brand ring-4 ring-surface" />
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-medium text-ink">{m.titulo}</p>
                    <span className="font-mono text-xs text-muted">{formatData(m.data)}</span>
                  </div>
                  {/* No portal o cliente vê o resumo em linguagem clara (Agente Portal). */}
                  {m.resumoIa ? <p className="mt-0.5 text-sm text-muted">{m.resumoIa}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Pagamento */}
        <section className="nx-card flex flex-col p-5">
          <h3 className="font-display text-base font-semibold text-ink">Pagamento</h3>
          {pendente ? (
            <>
              <p className="mt-3 text-sm text-muted">Honorários em aberto</p>
              <p className="font-display text-2xl font-bold text-ink">
                {formatBRL(pendente.valor)}
              </p>
              <span className="nx-chip mt-2 w-fit bg-gold/15 text-gold">Pendente</span>
              <button
                type="button"
                disabled
                className="mt-4 w-full rounded-lg bg-success/30 px-4 py-2.5 text-sm font-medium text-muted"
                title="Pagamento PIX via Asaas — requer credencial"
              >
                Pagar via PIX
              </button>
            </>
          ) : (
            <div className="mt-3 flex flex-1 flex-col items-center justify-center text-center">
              <span className="text-success">
                <Icon name="shield" size={28} />
              </span>
              <p className="mt-2 text-sm text-ink">Tudo em dia!</p>
              <p className="text-xs text-muted">Nenhum pagamento pendente.</p>
            </div>
          )}
        </section>
      </div>

      <p className="text-xs text-muted">
        Em produção, o cliente acessa este portal com login próprio e o pagamento é processado por
        PIX/boleto recorrente via Asaas.
      </p>
    </div>
  );
}
