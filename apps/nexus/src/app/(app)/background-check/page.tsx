import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { Icon } from '@/components/shell/icons';
import { formatDataFull } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import type { BgcResultado } from '@/server/dto';
import { listBackgroundChecks } from '@/server/repositories/background-check';

export const dynamic = 'force-dynamic';

export default async function BackgroundCheckPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const resultados = await listBackgroundChecks(ctx.officeId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Background Check</h2>
          <p className="text-sm text-muted">Consulta criminal — BNMP (mandados) + SEEU (execução penal)</p>
        </div>
        <span className="nx-chip bg-gold/15 text-gold">Add-on criminal</span>
      </div>

      {/* Consulta */}
      <div className="nx-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <Icon name="search" />
        <input
          type="text"
          placeholder="Digite o CPF para consultar BNMP e SEEU"
          disabled
          className="flex-1 rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-muted placeholder:text-muted focus:outline-none"
        />
        <button
          type="button"
          disabled
          className="rounded-lg bg-brand/30 px-4 py-2.5 text-sm font-medium text-muted"
          title="Consulta real integra os sistemas do CNJ (BNMP/SEEU)"
        >
          Consultar
        </button>
      </div>

      {resultados.length === 0 ? (
        <div className="nx-card p-10 text-center text-sm text-muted">
          Nenhuma consulta realizada ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {resultados.map((r) => (
            <BgcCard key={r.cpf} resultado={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function BgcCard({ resultado }: { resultado: BgcResultado }) {
  return (
    <article className="nx-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ink">{resultado.nome}</p>
          <p className="font-mono text-xs text-muted">CPF {resultado.cpf}</p>
        </div>
        {resultado.limpo ? (
          <span className="nx-chip bg-success/15 text-success">
            <Icon name="shield" size={12} /> Nada consta
          </span>
        ) : (
          <span className="nx-chip bg-danger/15 text-danger">
            <Icon name="gavel" size={12} /> Apontamentos
          </span>
        )}
      </header>

      {!resultado.limpo ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Mandados (BNMP)</p>
            {resultado.mandados.length === 0 ? (
              <p className="mt-1 text-sm text-muted">Nenhum.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {resultado.mandados.map((m, i) => (
                  <li key={i} className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm">
                    <p className="font-medium text-ink">{m.tipo}</p>
                    <p className="text-xs text-muted">{m.tribunal}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted">
                      {formatDataFull(m.data)} · {m.situacao}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Execução penal (SEEU)</p>
            {resultado.execucoesPenais.length === 0 ? (
              <p className="mt-1 text-sm text-muted">Nenhuma.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {resultado.execucoesPenais.map((e, i) => (
                  <li key={i} className="rounded-lg border border-border bg-elevated p-3 text-sm">
                    <p className="font-mono text-xs text-ink">{e.processo}</p>
                    <p className="mt-1 text-xs text-muted">
                      Regime {e.regime} · {e.situacao}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-success">
          Sem mandados de prisão ou execução penal em aberto.
        </p>
      )}

      <footer className="mt-4 border-t border-border pt-3 text-xs text-muted">
        Consultado em {formatDataFull(resultado.consultadoEm)} · fontes BNMP/CNJ e SEEU
      </footer>
    </article>
  );
}
