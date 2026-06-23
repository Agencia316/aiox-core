'use server';

import { headers } from 'next/headers';

import { isMockMode } from '@/lib/env';
import { getOfficeContext } from '@/lib/office-context';
import type { ClienteRisco } from '@/server/dto';
import { simularConsultaCliente } from '@/server/repositories/cliente360';

export interface ConsultaClienteResult {
  ok: boolean;
  motivo?: 'invalido' | 'indisponivel';
  cliente?: ClienteRisco;
}

/**
 * Consulta de risco (Cliente 360). Em modo demo gera um score determinístico a
 * partir do documento. Em produção, dependerá do conector real (Serasa/Receita),
 * por isso fora do mock retorna "indisponível" em vez de dados falsos.
 */
export async function consultarClienteAction(documento: string): Promise<ConsultaClienteResult> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }

    if (!isMockMode()) {
      return { ok: false, motivo: 'indisponivel' };
    }

    const cliente = simularConsultaCliente(documento);
    if (!cliente) {
      return { ok: false, motivo: 'invalido' };
    }
    return { ok: true, cliente };
  } catch (error) {
    console.error('consultarClienteAction falhou', { error });
    throw new Error(
      `Falha na consulta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}
