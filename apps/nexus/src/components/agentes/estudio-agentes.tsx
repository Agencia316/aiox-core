'use client';

import { useState } from 'react';

import { Icon } from '@/components/shell/icons';
import { AGENTES, disponivel, planoLabel, type AgenteDef, type Plano } from '@/lib/agentes';

export interface EstudioAgentesProps {
  plano: Plano;
}

export function EstudioAgentes({ plano }: EstudioAgentesProps) {
  const [prompts, setPrompts] = useState<Record<string, string>>(
    Object.fromEntries(AGENTES.map((a) => [a.slug, a.systemPrompt])),
  );
  const [salvo, setSalvo] = useState<string | null>(null);

  const salvar = (agente: AgenteDef) => {
    setSalvo(agente.slug);
    setTimeout(() => setSalvo(null), 2000);
  };

  const ok = (a: AgenteDef) => disponivel(a, plano);

  return (
    <div className="space-y-4">
      {AGENTES.map((a) => {
        const ativo = ok(a);
        const isSaving = salvo === a.slug;

        return (
          <section key={a.slug} className={`nx-card p-5 ${ativo ? '' : 'opacity-60'}`}>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="lg:w-64 lg:shrink-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      ativo ? 'bg-brand/15 text-brand' : 'bg-elevated text-muted'
                    }`}
                  >
                    <Icon name={a.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">{a.nome}</h3>
                    <p className="text-xs text-muted">{a.papel}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {ativo ? (
                    <label className="inline-flex items-center gap-2 text-xs text-muted">
                      <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-success/40">
                        <span className="absolute right-0.5 h-4 w-4 rounded-full bg-success" />
                      </span>
                      Ativo
                    </label>
                  ) : (
                    <span className="nx-chip bg-elevated text-muted">
                      Plano {planoLabel(a.minPlano)}+
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted">
                    System prompt
                  </label>
                  <textarea
                    rows={3}
                    disabled={!ativo}
                    value={prompts[a.slug]}
                    onChange={(e) => setPrompts((prev) => ({ ...prev, [a.slug]: e.target.value }))}
                    className="mt-1 w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink focus:border-brand/60 focus:outline-none disabled:cursor-not-allowed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted">Modelo</label>
                    <p className="mt-1 rounded-lg border border-border bg-elevated px-3 py-2 font-mono text-xs text-ink">
                      {a.modelo}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted">
                      Temperatura
                    </label>
                    <p className="mt-1 rounded-lg border border-border bg-elevated px-3 py-2 font-mono text-xs text-ink">
                      {a.temperatura.toFixed(1)}
                    </p>
                  </div>
                </div>

                {ativo && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => salvar(a)}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand/90"
                    >
                      {isSaving ? 'Salvo ✓' : 'Salvar prompt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrompts((prev) => ({ ...prev, [a.slug]: a.systemPrompt }))}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
                    >
                      Restaurar padrão
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      <p className="text-xs text-muted">
        Em modo demo, as edições são salvas na sessão. A persistência de prompts requer a Claude API
        configurada.
      </p>
    </div>
  );
}
