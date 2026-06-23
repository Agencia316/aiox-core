'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { getOfficeContext } from '@/lib/office-context';
import type { LeadColuna } from '@/server/dto';
import { moveLeadColuna } from '@/server/repositories/leads';

/**
 * Server Action: move um lead de coluna no funil. O tenant é resolvido aqui
 * (nunca confiamos no cliente para o officeId) e o RLS reforça no banco.
 */
export async function moveLeadAction(leadId: string, coluna: LeadColuna): Promise<void> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }
    await moveLeadColuna(ctx.officeId, leadId, coluna);
    revalidatePath('/crm');
  } catch (error) {
    console.error('moveLeadAction falhou', { leadId, coluna, error });
    throw new Error(
      `Falha ao mover lead: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}
