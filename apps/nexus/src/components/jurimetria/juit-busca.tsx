'use client';

import { useState, useTransition } from 'react';

import { buscarJurisprudenciaAction } from '@/app/(app)/jurimetria/actions';
import { Icon } from '@/components/shell/icons';
import { formatDataFull } from '@/lib/format';
import type { JurisprudenciaItem } from '@/server/integrations/juit';

function tomSimilaridade(s: number): string {
  if (s >= 90) return 'bg-success/15 text-success';
  if (s >= 80) return 'bg-gold/15 text-gold';
  return 'bg-elevated text-muted';
}

export function JuitBusca() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<JurisprudenciaItem[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const buscar = () => {
    setErro(null);
    if (!query.trim()) return;
    startTransition(async () => {
      try {
        const r = await buscarJurisprudenciaAction(query.trim());
        setResultados(r.resultados);
        setBloqueado(r.bloqueado);
        setBuscou(true);
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha na busca');
      }
    });
  };

  return (
    <section className="nx-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">
          Pesquisa de jurisprudência
        </h3>
        <span className="nx-chip bg-gold/15 text-gold">JUIT Rimor · RAG</span>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') buscar();
          }}
          disabled={pending}
          placeholder="Ex.: vínculo de emprego requisitos art. 3º CLT"
          className="flex-1 rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={buscar}
          disabled={pending || !query.trim()}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
        >
          <Icon name="search" size={15} /> {pending ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {erro ? <p className="mt-2 text-xs text-danger">{erro}</p> : null}

      {bloqueado ? (
        <div className="mt-4 rounded-lg border border-gold/30 bg-gold/10 p-4 text-sm text-gold">
          A pesquisa de jurisprudência (JUIT Rimor) está disponível no plano{' '}
          <span className="font-semibold">Elite</span>. Faça upgrade para liberar a busca RAG em
          peças.
        </div>
      ) : null}

      {!bloqueado && buscou && resultados.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nenhum resultado para a consulta.</p>
      ) : null}

      {resultados.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {resultados.map((r, i) => (
            <li key={i} className="rounded-lg border border-border bg-elevated/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">
                  {r.tribunal} · {r.orgao}
                </p>
                <span className={`nx-chip font-mono ${tomSimilaridade(r.similaridade)}`}>
                  {r.similaridade}% similar
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {r.relator} · {formatDataFull(r.data)}
              </p>
              <p className="mt-2 text-sm text-muted">{r.ementa}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
