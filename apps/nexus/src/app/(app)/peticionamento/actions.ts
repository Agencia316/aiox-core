'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { getOfficeContext } from '@/lib/office-context';
import { gerarPeticao } from '@/server/integrations/anthropic';
import { createDocumento } from '@/server/repositories/documentos';
import { listMovimentacoesByProcesso } from '@/server/repositories/movimentacoes';
import { getProcesso } from '@/server/repositories/processos';

export interface GerarPecaResult {
  documentoId: string;
  origem: 'ia' | 'mock';
}

/**
 * Server Action: o Agente Redator (Caio) gera uma peça a partir de um processo
 * + instrução do advogado, e persiste como documento. Tenant resolvido no
 * servidor; RLS reforça no banco.
 */
export async function gerarPecaAction(
  processoId: string,
  instrucao: string,
): Promise<GerarPecaResult> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }
    const texto = instrucao.trim();
    if (!texto) {
      throw new Error('Descreva a instrução para o Caio');
    }

    const processo = await getProcesso(ctx.officeId, processoId);
    if (!processo) {
      throw new Error('Processo não encontrado');
    }

    const movs = await listMovimentacoesByProcesso(ctx.officeId, processo.id);
    const contexto = movs
      .map((m) => `- ${m.titulo}${m.resumoIa ? `: ${m.resumoIa}` : ''}`)
      .join('\n');

    const peca = await gerarPeticao({
      officeId: ctx.officeId,
      area: processo.area,
      cliente: processo.clienteNome,
      cnj: processo.cnj,
      tribunal: processo.tribunal,
      instrucao: texto,
      contexto,
    });

    const doc = await createDocumento(ctx.officeId, {
      processoId: processo.id,
      titulo: `Peça — ${processo.clienteNome}`,
      conteudo: peca.texto,
      tipo: 'peticao',
      criadoPorIa: true,
    });

    revalidatePath('/peticionamento');
    return { documentoId: doc.id, origem: peca.origem };
  } catch (error) {
    console.error('gerarPecaAction falhou', { processoId, error });
    throw new Error(
      `Falha ao gerar peça: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}
