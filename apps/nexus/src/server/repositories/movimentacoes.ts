/**
 * Repositório de movimentações processuais. Real → withTenant (RLS); mock → fixtures.
 */
import { desc } from 'drizzle-orm';

import { movimentacoes } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { MovimentacaoDTO } from '@/server/dto';
import { MOVIMENTACOES_MOCK } from '@/server/mocks/fixtures';

export async function listMovimentacoes(officeId: string, limit = 20): Promise<MovimentacaoDTO[]> {
  if (isMockMode()) {
    return (MOVIMENTACOES_MOCK[officeId] ?? []).slice(0, limit);
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx
      .select()
      .from(movimentacoes)
      .orderBy(desc(movimentacoes.data))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      processoId: r.processoId,
      data: r.data.toISOString(),
      titulo: r.titulo,
      resumoIa: r.resumoIa,
    }));
  });
}
