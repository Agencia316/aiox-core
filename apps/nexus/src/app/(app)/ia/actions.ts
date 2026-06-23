'use server';

import { headers } from 'next/headers';

import { getOfficeContext } from '@/lib/office-context';
import { gerarRespostaAtendimento } from '@/server/integrations/anthropic';

export interface ChatIaResult {
  ok: boolean;
  texto?: string;
  origem?: 'ia' | 'mock';
  erro?: string;
}

/** Chat livre com o Caio (Agente Redator) — demo da Central de IA. */
export async function chatIaAction(mensagem: string): Promise<ChatIaResult> {
  const ctx = await getOfficeContext(headers());
  if (!ctx) return { ok: false, erro: 'Não autenticado' };

  const texto = mensagem.trim();
  if (!texto) return { ok: false, erro: 'Mensagem vazia' };

  try {
    const resposta = await gerarRespostaAtendimento({
      leadNome: 'Usuário',
      area: 'geral',
      historico: [{ de: 'lead', texto, em: new Date().toISOString() }],
    });
    return { ok: true, texto: resposta.texto, origem: resposta.origem };
  } catch {
    return { ok: false, erro: 'Falha ao chamar o agente' };
  }
}
