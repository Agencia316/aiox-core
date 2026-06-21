/**
 * Repositório de processos. Em modo real usa withTenant (RLS); em mock, fixtures.
 * Em nenhum caso filtra office_id manualmente na query — o RLS faz isso.
 */
import { desc } from 'drizzle-orm';

import { processos } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { ProcessoDTO } from '@/server/dto';
import { PROCESSOS_MOCK } from '@/server/mocks/fixtures';

export async function listProcessos(officeId: string): Promise<ProcessoDTO[]> {
  if (isMockMode()) {
    return PROCESSOS_MOCK[officeId] ?? [];
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(processos).orderBy(desc(processos.createdAt));
    return rows.map((r) => ({
      id: r.id,
      cnj: r.cnj,
      clienteNome: r.clienteNome,
      area: r.area,
      tribunal: r.tribunal,
      status: r.status,
      fase: r.fase,
      valorCausa: r.valorCausa === null ? null : Number(r.valorCausa),
      createdAt: r.createdAt.toISOString(),
    }));
  });
}
