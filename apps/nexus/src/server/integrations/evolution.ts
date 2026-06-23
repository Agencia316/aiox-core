/**
 * Cliente Evolution API (WhatsApp self-hosted, briefing §11).
 *
 * Em produção: POST contra EVOLUTION_API_URL com header `apikey: EVOLUTION_API_KEY`.
 * Em modo mock ou sem credencial: registra a tentativa no log e devolve OK simulado.
 *
 * O resto da plataforma só conhece este contrato — qualquer mudança de
 * provedor de WhatsApp acontece aqui dentro.
 */
import { isMockMode } from '@/lib/env';

export interface EnvioMensagem {
  /** Tenant que está enviando (preservado para auditoria/observabilidade). */
  officeId: string;
  /** Telefone E.164 ou formatado; o cliente normaliza antes de chamar a API. */
  telefone: string;
  /** Conteúdo da mensagem (texto puro). */
  texto: string;
}

export interface ResultadoEnvio {
  status: 'enviado' | 'mock' | 'erro';
  detalhe?: string;
}

function normalizarTelefone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export async function sendMessage(input: EnvioMensagem): Promise<ResultadoEnvio> {
  const url = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  // Sem credencial real ou em modo mock: simula.
  if (isMockMode() || !url || !apiKey) {
    console.info('[evolution:mock] enviaria mensagem', {
      officeId: input.officeId,
      telefone: input.telefone,
      preview: input.texto.slice(0, 60),
    });
    return { status: 'mock' };
  }

  // Real Evolution API. A instância (nome) costuma vir por office; placeholder
  // até o multi-instância ser modelado (uma instância Evolution por escritório).
  const instancia = process.env.EVOLUTION_INSTANCIA ?? 'default';
  const endpoint = `${url.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instancia)}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: normalizarTelefone(input.telefone),
        text: input.texto,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return { status: 'enviado' };
  } catch (error) {
    const detalhe = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[evolution] falha ao enviar mensagem', { officeId: input.officeId, detalhe });
    return { status: 'erro', detalhe };
  }
}
