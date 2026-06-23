/**
 * Cliente INTIMA.AI (peticionamento eletrônico, briefing §11).
 *
 * Em produção: POST contra INTIMA_API_KEY com o conteúdo da peça + dados do
 * processo; INTIMA.AI cuida do certificado A1 e do envio ao PJe/e-SAJ/PROJUDI/e-PROC.
 * No modo mock ou sem chave: simula sucesso e devolve um protocolo fictício.
 *
 * Como evolution.ts, é o único ponto de contato: trocar para a API real é
 * mexer só neste arquivo.
 */
import { isMockMode } from '@/lib/env';

export interface PedidoProtocolo {
  officeId: string;
  documentoId: string;
  tribunal: string;
  cnj: string;
  conteudo: string;
}

export interface ResultadoProtocolo {
  status: 'protocolado' | 'mock' | 'erro';
  protocolo?: string;
  detalhe?: string;
}

export async function protocolar(pedido: PedidoProtocolo): Promise<ResultadoProtocolo> {
  const apiKey = process.env.INTIMA_API_KEY;

  if (isMockMode() || !apiKey) {
    const fake = `PROTO-${pedido.cnj.slice(-7)}-${Date.now().toString(36).toUpperCase()}`;
    console.info('[intima:mock] protocolaria documento', {
      officeId: pedido.officeId,
      documentoId: pedido.documentoId,
      tribunal: pedido.tribunal,
      cnj: pedido.cnj,
      protocoloSimulado: fake,
    });
    return { status: 'mock', protocolo: fake };
  }

  // TODO: substituir pelo endpoint real do INTIMA.AI assim que a documentação
  // comercial estiver disponível (§11 do briefing).
  return {
    status: 'erro',
    detalhe: 'Cliente INTIMA.AI real ainda não implementado — configure o endpoint oficial.',
  };
}
