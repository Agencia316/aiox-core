/**
 * Agregações do Dashboard (KPIs, funil de leads, atividade recente).
 * Real → withTenant (RLS, contagens no banco); mock → derivado das fixtures.
 */
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';

import { cobrancas, leads, movimentacoes, prazos, processos } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { useMocks } from '@/lib/env';
import type { DashboardDTO, FunilColuna, LeadColuna } from '@/server/dto';
import {
  LEADS_MOCK,
  MOVIMENTACOES_MOCK,
  PRAZOS_URGENTES_MOCK,
  PROCESSOS_MOCK,
  RECEITA_MES_MOCK,
} from '@/server/mocks/fixtures';

const COLUNAS: LeadColuna[] = [
  'novo',
  'qualificacao',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
];

function buildFunil(counts: Record<string, number>): FunilColuna[] {
  return COLUNAS.map((coluna) => ({ coluna, total: counts[coluna] ?? 0 }));
}

export async function getDashboard(officeId: string): Promise<DashboardDTO> {
  if (useMocks()) {
    const procs = PROCESSOS_MOCK[officeId] ?? [];
    const lds = LEADS_MOCK[officeId] ?? [];
    const movs = MOVIMENTACOES_MOCK[officeId] ?? [];

    const funilCounts: Record<string, number> = {};
    for (const l of lds) {
      funilCounts[l.colunaFunil] = (funilCounts[l.colunaFunil] ?? 0) + 1;
    }

    return {
      kpis: {
        processosAtivos: procs.filter((p) => p.status === 'ativo').length,
        prazosUrgentes: PRAZOS_URGENTES_MOCK[officeId] ?? 0,
        leadsNovos: lds.filter((l) => l.colunaFunil === 'novo').length,
        receitaMes: RECEITA_MES_MOCK[officeId] ?? 0,
      },
      funil: buildFunil(funilCounts),
      atividadeRecente: movs.slice(0, 5),
    };
  }

  return withTenant(officeId, async (tx) => {
    const [procAtivos] = await tx
      .select({ total: count() })
      .from(processos)
      .where(eq(processos.status, 'ativo'));

    const [prazosUrg] = await tx
      .select({ total: count() })
      .from(prazos)
      .where(eq(prazos.urgente, true));

    const [leadsNovos] = await tx
      .select({ total: count() })
      .from(leads)
      .where(eq(leads.colunaFunil, 'novo'));

    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [receita] = await tx
      .select({ total: sql<string>`coalesce(sum(${cobrancas.valor}), 0)` })
      .from(cobrancas)
      .where(and(eq(cobrancas.status, 'pago'), gte(cobrancas.createdAt, inicioMes)));

    const funilRows = await tx
      .select({ coluna: leads.colunaFunil, total: count() })
      .from(leads)
      .groupBy(leads.colunaFunil);
    const funilCounts: Record<string, number> = {};
    for (const row of funilRows) {
      funilCounts[row.coluna] = Number(row.total);
    }

    const movs = await tx
      .select()
      .from(movimentacoes)
      .orderBy(desc(movimentacoes.data))
      .limit(5);

    return {
      kpis: {
        processosAtivos: Number(procAtivos?.total ?? 0),
        prazosUrgentes: Number(prazosUrg?.total ?? 0),
        leadsNovos: Number(leadsNovos?.total ?? 0),
        receitaMes: Number(receita?.total ?? 0),
      },
      funil: buildFunil(funilCounts),
      atividadeRecente: movs.map((r) => ({
        id: r.id,
        processoId: r.processoId,
        data: r.data.toISOString(),
        titulo: r.titulo,
        resumoIa: r.resumoIa,
      })),
    };
  });
}
