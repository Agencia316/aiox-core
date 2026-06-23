import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ChatDemo } from '@/components/ia/chat-demo';
import { Icon } from '@/components/shell/icons';
import { AGENTES, disponivel, planoLabel, type Plano } from '@/lib/agentes';
import { aiModel } from '@/lib/env';
import { getOfficeContext } from '@/lib/office-context';
import { getOfficeProfile } from '@/server/repositories/office';

export const dynamic = 'force-dynamic';

function normalizarPlano(raw: string): Plano {
  return (['solo', 'essencial', 'avancado', 'elite'] as Plano[]).includes(raw as Plano)
    ? (raw as Plano)
    : 'solo';
}

export default async function CentralIaPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const profile = await getOfficeProfile(ctx.officeId);
  const plano = normalizarPlano(profile.plano);
  const modeloDefault = aiModel();
  const ativos = AGENTES.filter((a) => disponivel(a, plano)).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Central de IA</h2>
        <p className="text-sm text-muted">
          {ativos} de {AGENTES.length} agentes ativos no plano {planoLabel(plano)} · provedor
          Anthropic Claude
        </p>
      </div>

      <ChatDemo />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {AGENTES.map((a) => {
          const ok = disponivel(a, plano);
          return (
            <article
              key={a.slug}
              className={[
                'nx-card flex flex-col gap-3 p-5 transition-colors',
                ok ? 'hover:border-brand/40' : 'opacity-60',
              ].join(' ')}
            >
              <header className="flex items-start justify-between gap-2">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    ok ? 'bg-brand/15 text-brand' : 'bg-elevated text-muted'
                  }`}
                >
                  <Icon name={a.icon} size={20} />
                </span>
                {ok ? (
                  <span className="nx-chip bg-success/15 text-success">Ativo</span>
                ) : (
                  <span className="nx-chip bg-elevated text-muted">
                    Plano {planoLabel(a.minPlano)}+
                  </span>
                )}
              </header>

              <div>
                <h3 className="font-display text-base font-semibold text-ink">{a.nome}</h3>
                <p className="text-xs text-muted">{a.papel}</p>
              </div>

              <p className="flex-1 text-sm text-muted">{a.descricao}</p>

              <footer className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="font-mono text-muted">
                  {a.slug === 'redator' ? modeloDefault : a.modelo}
                </span>
                <span className="text-muted">via Claude API</span>
              </footer>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        Os agentes consomem a Claude API (chave configurada em{' '}
        <code className="font-mono">ANTHROPIC_API_KEY</code>). Em modo demo (mocks ativos), as
        ações geradas por IA são simuladas localmente.
      </p>
    </div>
  );
}
