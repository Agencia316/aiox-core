import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { Icon } from '@/components/shell/icons';
import { formatDataFull } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import type { ClienteRisco } from '@/server/dto';
import { listClientesConsultados } from '@/server/repositories/cliente360';

export const dynamic = 'force-dynamic';

const NIVEL: Record<ClienteRisco['nivel'], { label: string; tone: string; bar: string }> = {
  baixo: { label: 'Risco baixo', tone: 'bg-success/15 text-success', bar: 'bg-success' },
  medio: { label: 'Risco médio', tone: 'bg-gold/15 text-gold', bar: 'bg-gold' },
  alto: { label: 'Risco alto', tone: 'bg-danger/15 text-danger', bar: 'bg-danger' },
};

export default async function Cliente360Page() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const clientes = await listClientesConsultados(ctx.officeId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Cliente 360</h2>
        <p className="text-sm text-muted">
          {clientes.length} consulta{clientes.length === 1 ? '' : 's'} · score consolida Receita
          Federal, Serasa, BNMP e tribunais
        </p>
      </div>

      {/* Consulta — placeholder (precisa de Serasa/Receita) */}
      <div className="nx-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <Icon name="search" />
        <input
          type="text"
          placeholder="Digite um CPF ou CNPJ para consultar"
          disabled
          className="flex-1 rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-muted placeholder:text-muted focus:outline-none"
        />
        <button
          type="button"
          disabled
          className="rounded-lg bg-brand/30 px-4 py-2.5 text-sm font-medium text-muted"
          title="Consulta real requer contrato com Serasa / Receita Federal"
        >
          Consultar
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="nx-card p-10 text-center text-sm text-muted">
          Nenhum cliente consultado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {clientes.map((c) => (
            <ClienteCard key={c.documento} cliente={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClienteCard({ cliente }: { cliente: ClienteRisco }) {
  const nv = NIVEL[cliente.nivel];
  return (
    <article className="nx-card flex flex-col gap-4 p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-ink">{cliente.nome}</p>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {cliente.tipoDocumento} {cliente.documento}
          </p>
        </div>
        <span className={`nx-chip ${nv.tone}`}>{nv.label}</span>
      </header>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted">Score Nexus</span>
          <span className="font-mono text-2xl font-bold text-ink">{cliente.score}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
          <div
            className={`h-full rounded-full ${nv.bar}`}
            style={{ width: `${cliente.score}%` }}
          />
        </div>
      </div>

      {cliente.apontamentos.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Apontamentos</p>
          <ul className="mt-1.5 space-y-1 text-sm text-ink">
            {cliente.apontamentos.map((a, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-danger" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-success">Sem apontamentos relevantes.</p>
      )}

      <footer className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
        <span>Fontes: {cliente.fontes.join(', ')}</span>
        <span className="font-mono">{formatDataFull(cliente.consultadoEm)}</span>
      </footer>
    </article>
  );
}
