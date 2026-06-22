'use server';

import { headers } from 'next/headers';

import { isMockMode } from '@/lib/env';
import { getOfficeContext } from '@/lib/office-context';
import { buscarJurisprudencia, type JurisprudenciaItem } from '@/server/integrations/juit';
import { getOfficeProfile } from '@/server/repositories/office';

export interface BuscaResult {
  bloqueado: boolean;
  resultados: JurisprudenciaItem[];
}

/**
 * Busca de jurisprudência (JUIT Rimor). Recurso de Fase 2 restrito ao plano
 * Elite (briefing §6). Em modo demo o gate é relaxado para demonstração.
 */
export async function buscarJurisprudenciaAction(query: string): Promise<BuscaResult> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }
    const termo = query.trim();
    if (!termo) {
      return { bloqueado: false, resultados: [] };
    }

    const profile = await getOfficeProfile(ctx.officeId);
    const liberado = isMockMode() || profile.plano === 'elite';
    if (!liberado) {
      return { bloqueado: true, resultados: [] };
    }

    const busca = await buscarJurisprudencia(termo);
    return { bloqueado: false, resultados: busca.resultados };
  } catch (error) {
    console.error('buscarJurisprudenciaAction falhou', { error });
    throw new Error(
      `Falha na busca: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}
