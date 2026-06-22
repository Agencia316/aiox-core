'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { getOfficeContext } from '@/lib/office-context';
import type { MensagemWA } from '@/server/dto';
import { gerarRespostaAtendimento } from '@/server/integrations/anthropic';
import { sendMessage } from '@/server/integrations/evolution';
import { appendMensagem, getConversaByLead } from '@/server/repositories/conversas';

/** Envia uma mensagem do escritório (Caio) ao lead — via Evolution (stub). */
export async function enviarMensagemAction(leadId: string, texto: string): Promise<void> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }
    const corpo = texto.trim();
    if (!corpo) {
      throw new Error('Mensagem vazia');
    }

    const conversa = await getConversaByLead(ctx.officeId, leadId);
    if (!conversa) {
      throw new Error('Conversa não encontrada');
    }

    const mensagem: MensagemWA = { de: 'caio', texto: corpo, em: new Date().toISOString() };
    await appendMensagem(ctx.officeId, leadId, mensagem);
    await sendMessage({ officeId: ctx.officeId, telefone: conversa.leadTelefone, texto: corpo });

    revalidatePath('/atendimento');
  } catch (error) {
    console.error('enviarMensagemAction falhou', { leadId, error });
    throw new Error(
      `Falha ao enviar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}

/** O Agente Recepção (Caio) gera e envia a próxima resposta ao lead. */
export async function caioResponderAction(leadId: string): Promise<{ origem: 'ia' | 'mock' }> {
  try {
    const ctx = await getOfficeContext(headers());
    if (!ctx) {
      throw new Error('Não autenticado');
    }

    const conversa = await getConversaByLead(ctx.officeId, leadId);
    if (!conversa) {
      throw new Error('Conversa não encontrada');
    }

    const resposta = await gerarRespostaAtendimento({
      leadNome: conversa.leadNome,
      area: conversa.leadArea,
      historico: conversa.mensagens,
    });

    const mensagem: MensagemWA = {
      de: 'caio',
      texto: resposta.texto,
      em: new Date().toISOString(),
    };
    await appendMensagem(ctx.officeId, leadId, mensagem);
    await sendMessage({
      officeId: ctx.officeId,
      telefone: conversa.leadTelefone,
      texto: resposta.texto,
    });

    revalidatePath('/atendimento');
    return { origem: resposta.origem };
  } catch (error) {
    console.error('caioResponderAction falhou', { leadId, error });
    throw new Error(
      `Falha ao gerar resposta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}
