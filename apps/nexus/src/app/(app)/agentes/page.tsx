import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { Icon } from '@/components/shell/icons';
import { AGENTES, disponivel, planoLabel, type Plano } from '@/lib/agentes';
import { getOfficeContext } from '@/lib/office-context';
import { getOfficeProfile } from '@/server/repositories/office';

export const dynamic = 'force-dynamic';

function normalizarPlano(raw: string): Plano {
  return (['solo', 'essencial', 'avancado', 'elite'] as Plano[]).includes(raw as Plano)
    ? (raw as Plano)
    : 'solo';
}

export default async function EstudioAgentesPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const profile = await getOfficeProfile(ctx.officeId);
  const plano = normalizarPlano(profile.plano);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Estúdio de Agentes</h2>
        <p className="text-sm text-muted">
          Configure o comportamento dos 6 agentes — prompt, modelo e criatividade
        </p>
      </div>

      <div className="space-y-4">
        {AGENTES.map((a) => {
          const ok = disponivel(a, plano);
          return (
            <section
              key={a.slug}
              className={`nx-card p-5 ${ok ? '' : 'opacity-60'}`}
            >
              <div className="flex flex-col gap-4 lg:flex-row">
                {/* Identidade */}
                <div className="lg:w-64 lg:shrink-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        ok ? 'bg-brand/15 text-brand' : 'bg-elevated text-muted'
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
                    {ok ? (
                      <label className="inline-flex cursor-not-allowed items-center gap-2 text-xs text-muted">
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

                {/* Config */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted">
                      System prompt
                    </label>
                    <textarea
                      readOnly
                      rows={3}
                      value={a.systemPrompt}
                      className="mt-1 w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink focus:outline-none"
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
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        A edição persistida dos prompts será habilitada com a Claude API conectada. Em modo demo,
        os valores são somente leitura.
      </p>
    </div>
  );
}
