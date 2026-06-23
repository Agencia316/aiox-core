/**
 * Cliente JUIT Rimor (jurisprudência por RAG, briefing §2/§11 — api.juit.dev).
 *
 * Em produção: POST contra JUIT_API_URL com header de auth JUIT_API_KEY, com
 * cache em Redis para controle de custo. No modo mock ou sem chave: devolve
 * resultados de exemplo. Como os demais conectores, trocar para a API real é
 * mexer só neste arquivo.
 *
 * O gate de plano (Elite) é aplicado na camada de ação, não aqui.
 */
import { isMockMode } from '@/lib/env';

export interface JurisprudenciaItem {
  tribunal: string;
  orgao: string;
  relator: string;
  data: string;
  ementa: string;
  /** Similaridade semântica 0–100 (RAG). */
  similaridade: number;
}

export interface BuscaJurisprudencia {
  query: string;
  resultados: JurisprudenciaItem[];
  origem: 'juit' | 'mock';
}

function resultadosMock(query: string): JurisprudenciaItem[] {
  return [
    {
      tribunal: 'TST',
      orgao: '3ª Turma',
      relator: 'Min. A. Bresciani',
      data: '2025-09-18',
      similaridade: 92,
      ementa:
        'VÍNCULO DE EMPREGO. Presentes os requisitos do art. 3º da CLT — pessoalidade, ' +
        'não-eventualidade, onerosidade e subordinação —, impõe-se o reconhecimento do vínculo ' +
        `empregatício. Recurso provido. (relacionado a: "${query}")`,
    },
    {
      tribunal: 'TJSC',
      orgao: '2ª Câmara de Direito Civil',
      relator: 'Des. M. Schramm',
      data: '2025-06-02',
      similaridade: 87,
      ementa:
        'RESPONSABILIDADE CIVIL. Dano material comprovado por documentos. Dever de indenizar ' +
        'configurado. Quantum mantido. Apelação desprovida.',
    },
    {
      tribunal: 'TRF4',
      orgao: 'Turma Recursal',
      relator: 'Juiz Fed. R. Koehler',
      data: '2025-03-21',
      similaridade: 81,
      ementa:
        'PREVIDENCIÁRIO. Aposentadoria por idade rural. Início de prova material corroborado por ' +
        'prova testemunhal. Tempo de atividade rural reconhecido. Benefício concedido.',
    },
  ];
}

export async function buscarJurisprudencia(query: string): Promise<BuscaJurisprudencia> {
  const apiKey = process.env.JUIT_API_KEY;
  const termo = query.trim();

  if (isMockMode() || !apiKey) {
    return { query: termo, resultados: resultadosMock(termo), origem: 'mock' };
  }

  // TODO: chamada real à JUIT Rimor (api.juit.dev) com cache Redis. Mantido como
  // ponto único de integração até a credencial comercial estar disponível.
  return { query: termo, resultados: resultadosMock(termo), origem: 'mock' };
}
