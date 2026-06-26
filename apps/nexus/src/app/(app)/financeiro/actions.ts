'use server';

import { headers } from 'next/headers';

import { isMockMode } from '@/lib/env';
import { getOfficeContext } from '@/lib/office-context';
import type { HonorarioDTO, HonorarioTipo, TimesheetDTO } from '@/server/dto';
import { createHonorario, createTimesheet } from '@/server/repositories/financeiro';

export interface RegistrarHonorarioInput {
  clienteNome: string;
  descricao: string;
  tipo: HonorarioTipo;
  valor: number;
  vencimento: string | null;
}

export interface RegistrarHonorarioResult {
  ok: boolean;
  motivo?: 'invalido' | 'indisponivel';
  honorario?: HonorarioDTO;
}

const TIPOS_VALIDOS: HonorarioTipo[] = ['fixo', 'hora', 'exito'];

export async function registrarHonorarioAction(
  input: RegistrarHonorarioInput,
): Promise<RegistrarHonorarioResult> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }

    if (!isMockMode()) {
      return { ok: false, motivo: 'indisponivel' };
    }

    const clienteNome = input.clienteNome.trim();
    const descricao = input.descricao.trim();
    if (!clienteNome || !descricao || !TIPOS_VALIDOS.includes(input.tipo) || input.valor <= 0) {
      return { ok: false, motivo: 'invalido' };
    }

    const honorario = await createHonorario(ctx.officeId, {
      clienteNome,
      descricao,
      tipo: input.tipo,
      valor: input.valor,
      vencimento: input.vencimento || null,
    });
    return { ok: true, honorario };
  } catch (error) {
    console.error('registrarHonorarioAction falhou', { error });
    throw new Error(
      `Falha ao registrar honorário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}

export interface RegistrarTimesheetInput {
  descricao: string;
  advogado: string;
  minutos: number;
  valorHora: number;
}

export interface RegistrarTimesheetResult {
  ok: boolean;
  motivo?: 'invalido' | 'indisponivel';
  timesheet?: TimesheetDTO;
}

export async function registrarTimesheetAction(
  input: RegistrarTimesheetInput,
): Promise<RegistrarTimesheetResult> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }

    if (!isMockMode()) {
      return { ok: false, motivo: 'indisponivel' };
    }

    const descricao = input.descricao.trim();
    const advogado = input.advogado.trim();
    if (!descricao || !advogado || input.minutos <= 0 || input.valorHora <= 0) {
      return { ok: false, motivo: 'invalido' };
    }

    const hoje = new Date().toISOString().slice(0, 10);
    const timesheet = await createTimesheet(ctx.officeId, {
      descricao,
      advogado,
      minutos: Math.round(input.minutos),
      valorHora: input.valorHora,
      data: hoje,
    });
    return { ok: true, timesheet };
  } catch (error) {
    console.error('registrarTimesheetAction falhou', { error });
    throw new Error(
      `Falha ao registrar timesheet: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}
</content>
