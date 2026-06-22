/**
 * Repositório de prazos (Agenda). Real → withTenant (RLS); mock → fixtures.
 * Ordenado por data de vencimento ascendente (mais próximos primeiro).
 */
import { asc } from 'drizzle-orm';

import { prazos } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { PrazoDTO } from '@/server/dto';
import { PRAZOS_MOCK } from '@/server/mocks/fixtures';

export async function listPrazos(officeId: string): Promise<PrazoDTO[]> {
  if (isMockMode()) {
    return [...(PRAZOS_MOCK[officeId] ?? [])].sort((a, b) =>
      a.dataVencimento.localeCompare(b.dataVencimento),
    );
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(prazos).orderBy(asc(prazos.dataVencimento));
    return rows.map((r) => ({
      id: r.id,
      processoId: r.processoId,
      titulo: r.titulo,
      dataVencimento: r.dataVencimento,
      urgente: r.urgente,
    }));
  });
}
