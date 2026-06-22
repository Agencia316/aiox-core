/**
 * Repositório de leads (CRM). Real → withTenant (RLS); mock → fixtures.
 */
import { desc, eq } from 'drizzle-orm';

import { leads } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { LeadColuna, LeadDTO } from '@/server/dto';
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

/**
 * Move um lead para outra coluna do funil. Real → UPDATE via withTenant (RLS
 * garante que só o próprio tenant altera); mock → muta a fixture em memória.
 */
export async function moveLeadColuna(
  officeId: string,
  leadId: string,
  coluna: LeadColuna,
): Promise<void> {
  if (isMockMode()) {
    const lead = (LEADS_MOCK[officeId] ?? []).find((l) => l.id === leadId);
    if (lead) {
      lead.colunaFunil = coluna;
    }
    return;
  }

  await withTenant(officeId, async (tx) => {
    await tx.update(leads).set({ colunaFunil: coluna }).where(eq(leads.id, leadId));
  });
}
