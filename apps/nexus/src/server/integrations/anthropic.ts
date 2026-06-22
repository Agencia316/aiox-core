/**
 * Integração com a Claude API (Anthropic) — o Agente Redator "Caio".
 *
 * Usa o SDK oficial @anthropic-ai/sdk. O modelo vem de NEXUS_AI_MODEL
 * (default claude-opus-4-5, conforme briefing §11). Em NEXUS_USE_MOCKS ou sem
 * ANTHROPIC_API_KEY, gera uma minuta-modelo localmente — a plataforma roda
 * inteira em demo sem chave.
 *
 * NUNCA hardcoda a API key (briefing §7) — sempre via env.
 */
import Anthropic from '@anthropic-ai/sdk';

import { aiModel, isMockMode } from '@/lib/env';

export interface GerarPeticaoInput {
  officeId: string;
  area: string;
  cliente: string;
  cnj: string;
  tribunal: string;
  instrucao: string;
  /** Contexto do processo (resumos das movimentações) para fundamentar a peça. */
  contexto: string;
}

export interface PeticaoGerada {
  texto: string;
  modelo: string;
  origem: 'ia' | 'mock';
}

const SYSTEM_PROMPT =
  'Você é o Caio, assistente de redação jurídica de um escritório de advocacia brasileiro. ' +
  'Gere peças processuais bem fundamentadas, em português forense, citando dispositivos legais ' +
  'aplicáveis e usando o contexto do processo fornecido. Estruture a peça com endereçamento, ' +
  'qualificação, fatos, fundamentos jurídicos e pedidos. Nunca invente jurisprudência nem ' +
  'números de processo. Seja preciso e objetivo.';

function buildPrompt(input: GerarPeticaoInput): string {
  return [
    `Área: ${input.area}`,
    `Cliente: ${input.cliente}`,
    `Processo (CNJ): ${input.cnj}`,
    `Tribunal: ${input.tribunal}`,
    '',
    'Contexto do processo:',
    input.contexto || '(sem movimentações registradas)',
    '',
    `Instrução do advogado: ${input.instrucao}`,
    '',
    'Redija a peça completa.',
  ].join('\n');
}

/** Minuta-modelo determinística para o modo demo (sem chamar a API). */
function minutaMock(input: GerarPeticaoInput): string {
  return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) — ${input.tribunal}

Processo nº ${input.cnj}

${input.cliente.toUpperCase()}, já qualificado(a) nos autos, por seu procurador,
vem respeitosamente à presença de Vossa Excelência expor e requerer o que segue.

I — DOS FATOS
${input.instrucao}

II — DO CONTEXTO PROCESSUAL
${input.contexto || 'Sem movimentações relevantes até o momento.'}

III — DO DIREITO
Com fundamento na legislação aplicável à matéria de ${input.area.toLowerCase()}, demonstram-se
presentes os requisitos para o acolhimento do pedido.

IV — DOS PEDIDOS
Ante o exposto, requer-se o deferimento dos pedidos formulados.

Termos em que pede deferimento.

[Minuta gerada pelo Caio em modo demonstração — revise antes de protocolar.]`;
}

export async function gerarPeticao(input: GerarPeticaoInput): Promise<PeticaoGerada> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (isMockMode() || !apiKey) {
    return { texto: minutaMock(input), modelo: 'mock', origem: 'mock' };
  }

  try {
    const client = new Anthropic({ apiKey });
    const model = aiModel();
    const message = await client.messages.create({
      model,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(input) }],
    });

    const texto = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return { texto: texto || minutaMock(input), modelo: model, origem: 'ia' };
  } catch (error) {
    // Falha na API não derruba o fluxo — devolve a minuta-modelo com aviso.
    console.error('gerarPeticao: falha na Claude API, usando minuta-modelo', { error });
    return { texto: minutaMock(input), modelo: 'mock', origem: 'mock' };
  }
}
