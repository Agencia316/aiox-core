/**
 * Fixtures em memória, espelhando o seed. Usadas quando NEXUS_USE_MOCKS=true,
 * para rodar a aplicação sem Postgres. Chaveadas por officeId — o isolamento
 * multi-tenant é respeitado também no modo mock.
 */
import { OFFICE_ALMEIDA, OFFICE_NAVES } from '@/db/ids';
import type {
  ConversaDTO,
  DocumentoDTO,
  LeadDTO,
  MovimentacaoDTO,
  PrazoDTO,
  ProcessoDTO,
} from '@/server/dto';

export const PROCESSOS_MOCK: Record<string, ProcessoDTO[]> = {
  [OFFICE_ALMEIDA]: [
    {
      id: 'p-almeida-1',
      cnj: '5001234-56.2024.8.24.0018',
      clienteNome: 'Indústria Madeira Verde Ltda.',
      area: 'Trabalhista',
      tribunal: 'TJSC',
      status: 'ativo',
      fase: 'conhecimento',
      valorCausa: 85000,
      createdAt: '2026-05-02T12:00:00.000Z',
    },
    {
      id: 'p-almeida-2',
      cnj: '5002345-67.2024.8.24.0018',
      clienteNome: 'João Batista dos Santos',
      area: 'Cível',
      tribunal: 'TJSC',
      status: 'ativo',
      fase: 'recursal',
      valorCausa: 32000,
      createdAt: '2026-05-10T12:00:00.000Z',
    },
    {
      id: 'p-almeida-3',
      cnj: '5003456-78.2023.8.24.0018',
      clienteNome: 'Cooperativa Agro Caçador',
      area: 'Empresarial',
      tribunal: 'TJSC',
      status: 'ativo',
      fase: 'execucao',
      valorCausa: 240000,
      createdAt: '2026-03-18T12:00:00.000Z',
    },
    {
      id: 'p-almeida-4',
      cnj: '5004567-89.2024.8.24.0018',
      clienteNome: 'Maria Aparecida Lima',
      area: 'Família',
      tribunal: 'TJSC',
      status: 'suspenso',
      fase: 'conhecimento',
      valorCausa: 15000,
      createdAt: '2026-04-22T12:00:00.000Z',
    },
    {
      id: 'p-almeida-5',
      cnj: '5005678-90.2022.8.24.0018',
      clienteNome: 'Transportes Planalto S/A',
      area: 'Tributário',
      tribunal: 'TJSC',
      status: 'arquivado',
      fase: 'cumprimento',
      valorCausa: 410000,
      createdAt: '2025-11-05T12:00:00.000Z',
    },
  ],
  [OFFICE_NAVES]: [
    {
      id: 'p-naves-1',
      cnj: '5009999-11.2024.8.16.0001',
      clienteNome: 'Confidencial — Naves',
      area: 'Cível',
      tribunal: 'TJPR',
      status: 'ativo',
      fase: 'conhecimento',
      valorCausa: 50000,
      createdAt: '2026-06-01T12:00:00.000Z',
    },
  ],
};

export const MOVIMENTACOES_MOCK: Record<string, MovimentacaoDTO[]> = {
  [OFFICE_ALMEIDA]: [
    {
      id: 'm-almeida-3',
      processoId: 'p-almeida-2',
      data: '2026-06-15T09:15:00.000Z',
      titulo: 'Recurso de apelação distribuído',
      resumoIa: 'A apelação subiu ao tribunal. Aguardando designação de relator.',
    },
    {
      id: 'm-almeida-1',
      processoId: 'p-almeida-1',
      data: '2026-06-12T13:30:00.000Z',
      titulo: 'Audiência de instrução designada',
      resumoIa:
        'O juiz marcou audiência para 14/07. É preciso arrolar testemunhas até 5 dias antes.',
    },
    {
      id: 'm-almeida-2',
      processoId: 'p-almeida-1',
      data: '2026-06-05T10:00:00.000Z',
      titulo: 'Contestação juntada pela parte ré',
      resumoIa: 'A empresa contestou negando o vínculo. Cabe réplica no prazo de 15 dias.',
    },
  ],
  [OFFICE_NAVES]: [],
};

export const LEADS_MOCK: Record<string, LeadDTO[]> = {
  [OFFICE_ALMEIDA]: [
    {
      id: 'l-almeida-1',
      nome: 'Roberto Menezes',
      telefone: '+55 49 99811-2233',
      area: 'Trabalhista',
      score: 88,
      colunaFunil: 'qualificacao',
      origem: 'whatsapp',
      resumoIa: 'Demitido sem justa causa, verbas não pagas. Caso forte, urgência alta.',
    },
    {
      id: 'l-almeida-2',
      nome: 'Cleusa Fernandes',
      telefone: '+55 49 99744-5566',
      area: 'Previdenciário',
      score: 72,
      colunaFunil: 'novo',
      origem: 'whatsapp',
      resumoIa: 'Aposentadoria por idade rural, falta documentação. Mérito provável.',
    },
    {
      id: 'l-almeida-3',
      nome: 'Supermercado Bom Preço',
      telefone: '+55 49 99655-7788',
      area: 'Empresarial',
      score: 91,
      colunaFunil: 'proposta',
      origem: 'indicacao',
      resumoIa: 'Recuperação de crédito de R$ 60k. Provas sólidas, cliente recorrente.',
    },
    {
      id: 'l-almeida-4',
      nome: 'Antônio Carlos Pereira',
      telefone: '+55 49 99566-8899',
      area: 'Família',
      score: 54,
      colunaFunil: 'negociacao',
      origem: 'site',
      resumoIa: 'Divórcio consensual. Caso simples, baixa urgência.',
    },
    {
      id: 'l-almeida-5',
      nome: 'Fernanda Souza',
      telefone: '+55 49 99477-9900',
      area: 'Consumidor',
      score: 35,
      colunaFunil: 'perdido',
      origem: 'anuncio',
      resumoIa: 'Negativação indevida, valor baixo. Optou por não prosseguir.',
    },
    {
      id: 'l-almeida-6',
      nome: 'Lucas Andrade',
      telefone: '+55 49 99388-0011',
      area: 'Cível',
      score: 79,
      colunaFunil: 'ganho',
      origem: 'organico',
      resumoIa: 'Acidente de trânsito com danos materiais. Contrato fechado.',
    },
  ],
  [OFFICE_NAVES]: [
    {
      id: 'l-naves-1',
      nome: 'Lead Confidencial Naves',
      telefone: '+55 41 99000-0000',
      area: 'Empresarial',
      score: 60,
      colunaFunil: 'novo',
      origem: 'whatsapp',
      resumoIa: null,
    },
  ],
};

/** Receita do mês (cobranças pagas) por office — mock para o KPI do dashboard. */
export const RECEITA_MES_MOCK: Record<string, number> = {
  [OFFICE_ALMEIDA]: 679,
  [OFFICE_NAVES]: 379,
};

/** Prazos urgentes em aberto por office — mock para o KPI do dashboard. */
export const PRAZOS_URGENTES_MOCK: Record<string, number> = {
  [OFFICE_ALMEIDA]: 2,
  [OFFICE_NAVES]: 0,
};

/**
 * Conversas de WhatsApp (Evolution API) por office. Em produção, mensagens
 * chegam por webhook e o Caio responde via integrações reais. As fixtures
 * abaixo espelham o seed para o modo demo.
 */
export const CONVERSAS_MOCK: Record<string, ConversaDTO[]> = {
  [OFFICE_ALMEIDA]: [
    {
      id: 'conv-almeida-1',
      leadId: 'l-almeida-1',
      leadNome: 'Roberto Menezes',
      leadTelefone: '+55 49 99811-2233',
      leadArea: 'Trabalhista',
      leadScore: 88,
      mensagens: [
        {
          de: 'lead',
          texto: 'Boa tarde, fui demitido e não recebi nada',
          em: '2026-06-18T18:02:00.000Z',
        },
        {
          de: 'caio',
          texto:
            'Olá, Roberto! Sinto muito. Pode me dizer há quanto tempo trabalhava na empresa?',
          em: '2026-06-18T18:02:20.000Z',
        },
        { de: 'lead', texto: '3 anos e 4 meses', em: '2026-06-18T18:03:10.000Z' },
        {
          de: 'caio',
          texto:
            'Entendi. Tem carteira assinada? E o último salário, foi pago integralmente?',
          em: '2026-06-18T18:03:35.000Z',
        },
        {
          de: 'lead',
          texto: 'Tenho sim. Faltou o último salário, 13º proporcional e férias',
          em: '2026-06-18T18:05:01.000Z',
        },
        {
          de: 'caio',
          texto:
            'Caso forte de verbas rescisórias. Vou agendar uma consulta com a Dra. Carolina amanhã às 14h. Confirma?',
          em: '2026-06-18T18:05:30.000Z',
        },
      ],
    },
    {
      id: 'conv-almeida-2',
      leadId: 'l-almeida-2',
      leadNome: 'Cleusa Fernandes',
      leadTelefone: '+55 49 99744-5566',
      leadArea: 'Previdenciário',
      leadScore: 72,
      mensagens: [
        {
          de: 'lead',
          texto: 'Doutora, posso me aposentar por idade rural?',
          em: '2026-06-20T09:14:00.000Z',
        },
        {
          de: 'caio',
          texto:
            'Olá, dona Cleusa! Sou o Caio, assistente. A senhora tem mais de 55 anos e exerceu atividade rural?',
          em: '2026-06-20T09:14:20.000Z',
        },
        {
          de: 'lead',
          texto: 'Tenho 58 e trabalhei na lavoura desde os 14',
          em: '2026-06-20T09:15:00.000Z',
        },
        {
          de: 'caio',
          texto:
            'Excelente — provável mérito. Precisaremos de notas de produtor, declaração do sindicato ou contratos de parceria. Tem como reunir?',
          em: '2026-06-20T09:15:40.000Z',
        },
      ],
    },
  ],
  [OFFICE_NAVES]: [],
};

/**
 * Documentos jurídicos (peças, contratos, procurações). Em produção são gerados
 * pelo Agente Redator (Caio) e protocolados via INTIMA.AI.
 */
export const DOCUMENTOS_MOCK: Record<string, DocumentoDTO[]> = {
  [OFFICE_ALMEIDA]: [
    {
      id: 'doc-almeida-1',
      processoId: 'p-almeida-1',
      titulo: 'Réplica à contestação — Madeira Verde',
      tipo: 'peticao',
      criadoPorIa: true,
      createdAt: '2026-06-19T14:22:00.000Z',
      conteudo: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DA __ VARA DO TRABALHO DE CAÇADOR/SC

Processo nº 5001234-56.2024.8.24.0018

JOSÉ DA SILVA, já qualificado nos autos da reclamação trabalhista em epígrafe, por seu procurador infrafirmado, vem, respeitosamente, à presença de Vossa Excelência, apresentar

RÉPLICA À CONTESTAÇÃO

apresentada pela reclamada INDÚSTRIA MADEIRA VERDE LTDA., pelos fatos e fundamentos jurídicos a seguir expostos.

I — DA PRELIMINAR

A reclamada alegou, em contestação, inexistência do vínculo empregatício. Tal alegação não merece prosperar, vez que os elementos probatórios constantes dos autos demonstram, de forma inequívoca, a presença dos requisitos do artigo 3º da CLT: pessoalidade, não-eventualidade, onerosidade e subordinação.

II — DO MÉRITO

O autor laborou para a reclamada de 14/02/2022 a 30/05/2025, totalizando 3 anos e 3 meses de prestação ininterrupta de serviços. Conforme se extrai dos depoimentos colhidos e dos documentos juntados (folhas 42-58), o reclamante cumpria jornada fixa, recebia salário mensal e exercia suas atividades sob ordens diretas do preposto da empresa.

III — DOS PEDIDOS

Ante o exposto, requer-se:
  a) Seja reconhecido o vínculo empregatício no período declinado;
  b) Sejam julgados procedentes os pedidos da inicial;
  c) Sejam concedidos os benefícios da gratuidade da justiça.

Termos em que pede deferimento.

Caçador/SC, 19 de junho de 2026.

Dra. Carolina Almeida
OAB/SC 12.345`,
    },
    {
      id: 'doc-almeida-2',
      processoId: 'p-almeida-3',
      titulo: 'Petição inicial — Cooperativa Agro',
      tipo: 'peticao',
      criadoPorIa: true,
      createdAt: '2026-05-20T10:00:00.000Z',
      conteudo: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA EMPRESARIAL DA COMARCA DE CAÇADOR/SC

COOPERATIVA AGRO CAÇADOR, pessoa jurídica de direito privado, vem propor a presente AÇÃO DE COBRANÇA com pedido de tutela de urgência em face de [...].`,
    },
    {
      id: 'doc-almeida-3',
      processoId: null,
      titulo: 'Procuração ad judicia — Sr. João Batista',
      tipo: 'procuracao',
      criadoPorIa: false,
      createdAt: '2026-05-08T16:30:00.000Z',
      conteudo: `PROCURAÇÃO AD JUDICIA

Outorgante: JOÃO BATISTA DOS SANTOS, CPF 000.000.000-00, residente em Caçador/SC.

Outorgado: Dra. CAROLINA ALMEIDA, OAB/SC 12.345 (Almeida & Rocha Advocacia).

Por este instrumento, o outorgante nomeia e constitui o outorgado seu bastante procurador para o foro em geral, com os poderes da cláusula ad judicia [...].`,
    },
  ],
  [OFFICE_NAVES]: [],
};

export const PRAZOS_MOCK: Record<string, PrazoDTO[]> = {
  [OFFICE_ALMEIDA]: [
    {
      id: 'prz-almeida-1',
      processoId: 'p-almeida-1',
      titulo: 'Apresentar réplica à contestação',
      dataVencimento: '2026-06-26',
      urgente: true,
    },
    {
      id: 'prz-almeida-2',
      processoId: 'p-almeida-1',
      titulo: 'Arrolar testemunhas',
      dataVencimento: '2026-07-09',
      urgente: true,
    },
    {
      id: 'prz-almeida-3',
      processoId: 'p-almeida-2',
      titulo: 'Contrarrazões de apelação',
      dataVencimento: '2026-07-20',
      urgente: false,
    },
  ],
  [OFFICE_NAVES]: [],
};
