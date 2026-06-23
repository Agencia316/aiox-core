import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { EstudioAgentes } from '@/components/agentes/estudio-agentes';
import type { Plano } from '@/lib/agentes';
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

      <EstudioAgentes plano={plano} />
    </div>
  );
}
