'use client';

import { useState, useTransition } from 'react';

import { consultarBackgroundCheckAction } from '@/app/(app)/background-check/actions';
import { Icon } from '@/components/shell/icons';
import { formatDataFull } from '@/lib/format';
import type { BgcResultado } from '@/server/dto';

export interface ConsultaBgcProps {
  inicial: BgcResultado[];
}

export function ConsultaBgc({ inicial }: ConsultaBgcProps) {
  const [cpf, setCpf] = useState('');
  const [resultados, setResultados] = useState<BgcResultado[]>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const consultar = () => {
    setErro(null);
    if (!cpf.trim()) return;
    startTransition(async () => {
      try {
        const r = await consultarBackgroundCheckAction(cpf.trim());
        if (!r.ok || !r.resultado) {
          setErro(
            r.motivo === 'indisponivel'
              ? 'Consulta real integra os sistemas do CNJ (BNMP/SEEU).'
              : 'CPF inválido. Informe 11 dígitos.',
          );
          return;
        }
        const novo = r.resultado;
        setResultados((prev) => [novo, ...prev.filter((c) => c.cpf !== novo.cpf)]);
        setCpf('');
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha na consulta');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="nx-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <Icon name="search" />
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') consultar();
          }}
          disabled={pending}
          placeholder="Digite o CPF para consultar BNMP e SEEU"
          className="flex-1 rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={consultar}
          disabled={pending || !cpf.trim()}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
        >
          <Icon name="search" size={15} /> {pending ? 'Consultando…' : 'Consultar'}
        </button>
      </div>

      {erro ? <p className="text-xs text-danger">{erro}</p> : null}

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
