/**
 * Repositório Financeiro: honorários (receitas), despesas (saídas) e timesheets
 * (horas). Real → withTenant (RLS); mock → fixtures.
 *
 * O resumo agregado (`resumoFinanceiro`) é derivado em memória a partir das
 * listas — mantém a mesma fonte da verdade em ambos os modos.
 */
import { randomUUID } from 'node:crypto';

import { asc, desc } from 'drizzle-orm';

import { despesas, honorarios, timesheets } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type {
  DespesaDTO,
  HonorarioDTO,
  ResumoFinanceiro,
  TimesheetDTO,
} from '@/server/dto';
import {
  DESPESAS_MOCK,
  HONORARIOS_MOCK,
  TIMESHEETS_MOCK,
} from '@/server/mocks/fixtures';

export async function listHonorarios(officeId: string): Promise<HonorarioDTO[]> {
  if (isMockMode()) {
    return [...(HONORARIOS_MOCK[officeId] ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(honorarios).orderBy(desc(honorarios.createdAt));
    return rows.map((r) => ({
      id: r.id,
      processoId: r.processoId,
      clienteNome: r.clienteNome,
      descricao: r.descricao,
      tipo: r.tipo,
      valor: Number(r.valor),
      status: r.status,
      vencimento: r.vencimento,
      createdAt: r.createdAt.toISOString(),
    }));
  });
}

export async function listDespesas(officeId: string): Promise<DespesaDTO[]> {
  if (isMockMode()) {
    return [...(DESPESAS_MOCK[officeId] ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(despesas).orderBy(desc(despesas.createdAt));
    return rows.map((r) => ({
      id: r.id,
      processoId: r.processoId,
      descricao: r.descricao,
      categoria: r.categoria,
      valor: Number(r.valor),
      reembolsavel: r.reembolsavel,
      createdAt: r.createdAt.toISOString(),
    }));
  });
}

export async function listTimesheets(officeId: string): Promise<TimesheetDTO[]> {
  if (isMockMode()) {
    return [...(TIMESHEETS_MOCK[officeId] ?? [])].sort((a, b) => b.data.localeCompare(a.data));
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(timesheets).orderBy(asc(timesheets.data));
    return rows.map((r) => ({
      id: r.id,
      processoId: r.processoId,
      descricao: r.descricao,
      advogado: r.advogado,
      minutos: r.minutos,
      valorHora: Number(r.valorHora),
      data: r.data,
      createdAt: r.createdAt.toISOString(),
    }));
  });
}

/** Deriva o agregado financeiro a partir das listas (mesma lógica em mock/real). */
export function resumoFinanceiro(
  honos: HonorarioDTO[],
  desps: DespesaDTO[],
  times: TimesheetDTO[],
): ResumoFinanceiro {
  const recebido = honos
    .filter((h) => h.status === 'recebido')
    .reduce((acc, h) => acc + h.valor, 0);
  const aReceber = honos
    .filter((h) => h.status === 'aberto' || h.status === 'faturado')
    .reduce((acc, h) => acc + h.valor, 0);
  const atrasado = honos
    .filter((h) => h.status === 'atrasado')
    .reduce((acc, h) => acc + h.valor, 0);
  const totalDespesas = desps.reduce((acc, d) => acc + d.valor, 0);
  const horasNoMes = times.reduce((acc, t) => acc + t.minutos, 0) / 60;

  return {
    recebido,
    aReceber,
    atrasado,
    despesas: totalDespesas,
    saldo: recebido - totalDespesas,
    horasNoMes: Math.round(horasNoMes * 10) / 10,
  };
}

export interface NovoHonorario {
  clienteNome: string;
  descricao: string;
  tipo: HonorarioDTO['tipo'];
  valor: number;
  vencimento: string | null;
}

export async function createHonorario(
  officeId: string,
  novo: NovoHonorario,
): Promise<HonorarioDTO> {
  if (isMockMode()) {
    const honorario: HonorarioDTO = {
      id: `hon-${randomUUID()}`,
      processoId: null,
      clienteNome: novo.clienteNome,
      descricao: novo.descricao,
      tipo: novo.tipo,
      valor: novo.valor,
      status: 'aberto',
      vencimento: novo.vencimento,
      createdAt: new Date().toISOString(),
    };
    (HONORARIOS_MOCK[officeId] ??= []).unshift(honorario);
    return honorario;
  }

  return withTenant(officeId, async (tx) => {
    const [row] = await tx
      .insert(honorarios)
      .values({
        officeId,
        clienteNome: novo.clienteNome,
        descricao: novo.descricao,
        tipo: novo.tipo,
        valor: novo.valor.toFixed(2),
        vencimento: novo.vencimento,
      })
      .returning();
    return {
      id: row.id,
      processoId: row.processoId,
      clienteNome: row.clienteNome,
      descricao: row.descricao,
      tipo: row.tipo,
      valor: Number(row.valor),
      status: row.status,
      vencimento: row.vencimento,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export interface NovoTimesheet {
  descricao: string;
  advogado: string;
  minutos: number;
  valorHora: number;
  data: string;
}

export async function createTimesheet(
  officeId: string,
  novo: NovoTimesheet,
): Promise<TimesheetDTO> {
  if (isMockMode()) {
    const ts: TimesheetDTO = {
      id: `ts-${randomUUID()}`,
      processoId: null,
      descricao: novo.descricao,
      advogado: novo.advogado,
      minutos: novo.minutos,
      valorHora: novo.valorHora,
      data: novo.data,
      createdAt: new Date().toISOString(),
    };
    (TIMESHEETS_MOCK[officeId] ??= []).unshift(ts);
    return ts;
  }

  return withTenant(officeId, async (tx) => {
    const [row] = await tx
      .insert(timesheets)
      .values({
        officeId,
        descricao: novo.descricao,
        advogado: novo.advogado,
        minutos: novo.minutos,
        valorHora: novo.valorHora.toFixed(2),
        data: novo.data,
      })
      .returning();
    return {
      id: row.id,
      processoId: row.processoId,
      descricao: row.descricao,
      advogado: row.advogado,
      minutos: row.minutos,
      valorHora: Number(row.valorHora),
      data: row.data,
      createdAt: row.createdAt.toISOString(),
    };
  });
}
</content>
