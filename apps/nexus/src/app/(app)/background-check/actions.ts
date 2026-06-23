'use server';

import { headers } from 'next/headers';

import { isMockMode } from '@/lib/env';
import { getOfficeContext } from '@/lib/office-context';
import type { BgcResultado } from '@/server/dto';
import { simularBackgroundCheck } from '@/server/repositories/background-check';

export interface ConsultaBgcResult {
  ok: boolean;
  motivo?: 'invalido' | 'indisponivel';
  resultado?: BgcResultado;
}

/**
 * Consulta criminal (Background Check). Em modo demo gera um resultado
 * determinístico (BNMP + SEEU). Em produção integra os sistemas do CNJ — fora do
 * mock retorna "indisponível" para não exibir dados falsos.
 */
export async function consultarBackgroundCheckAction(cpf: string): Promise<ConsultaBgcResult> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }

    if (!isMockMode()) {
      return { ok: false, motivo: 'indisponivel' };
    }

    const resultado = simularBackgroundCheck(cpf);
    if (!resultado) {
      return { ok: false, motivo: 'invalido' };
    }
    return { ok: true, resultado };
  } catch (error) {
    console.error('consultarBackgroundCheckAction falhou', { error });
    throw new Error(
      `Falha na consulta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}
