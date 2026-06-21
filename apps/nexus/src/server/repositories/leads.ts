/**
 * Repositório de leads (CRM). Real → withTenant (RLS); mock → fixtures.
 */
import { desc } from 'drizzle-orm';

import { leads } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { LeadDTO } from '@/server/dto';
import { LEADS_MOCK } from '@/server/mocks/fixtures';

export async function listLeads(officeId: string): Promise<LeadDTO[]> {
  if (isMockMode()) {
    return LEADS_MOCK[officeId] ?? [];
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(leads).orderBy(desc(leads.score));
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      telefone: r.telefone,
      area: r.area,
      score: r.score,
      colunaFunil: r.colunaFunil,
      origem: r.origem,
      resumoIa: r.resumoIa,
    }));
  });
}
