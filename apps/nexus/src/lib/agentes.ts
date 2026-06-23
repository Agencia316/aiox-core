/**
 * Catálogo dos 6 agentes IA do Nexus (briefing §4). Fonte única para a
 * Central de IA e para o Estúdio de Agentes.
 *
 * Todos rodam via Claude API; o `minPlano` determina visibilidade por plano
 * (briefing §6: SDR liberado a partir do Avançado).
 */
import type { IconName } from '@/components/shell/icons';

export type Plano = 'solo' | 'essencial' | 'avancado' | 'elite';

const PLANO_NIVEL: Record<Plano, number> = {
  solo: 0,
  essencial: 1,
  avancado: 2,
  elite: 3,
};

export interface AgenteDef {
  slug: string;
  nome: string;
  papel: string;
  descricao: string;
  icon: IconName;
  minPlano: Plano;
  modelo: string;
  temperatura: number;
  systemPrompt: string;
}

export const AGENTES: AgenteDef[] = [
  {
    slug: 'recepcao',
    nome: 'Recepção',
    papel: 'Atende leads no WhatsApp 24h',
    descricao:
      'Primeiro contato. Cumprimenta, identifica área do direito e colhe contexto inicial. Repassa para qualificação.',
    icon: 'chat',
    minPlano: 'solo',
    modelo: 'claude-haiku-4-5-20251001',
    temperatura: 0.6,
    systemPrompt:
      'Você é o Caio, recepcionista virtual de um escritório de advocacia. Seja cordial e objetivo. Identifique a área jurídica do problema do contato e colha os dados essenciais (nome, cidade, breve relato). Nunca prometa resultados nem dê parecer jurídico.',
  },
  {
    slug: 'qualificacao',
    nome: 'Qualificação',
    papel: 'Pontua leads por mérito/provas/urgência',
    descricao:
      'Analisa a conversa e atribui score de 0-100. Move o lead para a coluna apropriada do funil (CRM).',
    icon: 'funnel',
    minPlano: 'solo',
    modelo: 'claude-haiku-4-5-20251001',
    temperatura: 0.2,
    systemPrompt:
      'Avalie o lead em três eixos: mérito do caso, existência de provas e urgência. Retorne um score de 0 a 100 e uma justificativa de uma frase. Seja conservador quando faltar informação.',
  },
  {
    slug: 'resumo',
    nome: 'Resumo',
    papel: 'Traduz movimentações em linguagem clara',
    descricao:
      'Lê o despacho técnico do tribunal e gera uma frase humana com a próxima ação esperada.',
    icon: 'gavel',
    minPlano: 'solo',
    modelo: 'claude-haiku-4-5-20251001',
    temperatura: 0.3,
    systemPrompt:
      'Receba o texto técnico de uma movimentação processual e explique em português simples o que aconteceu e qual a próxima ação esperada do advogado. Máximo duas frases.',
  },
  {
    slug: 'redator',
    nome: 'Redator (Caio)',
    papel: 'Gera petições fundamentadas',
    descricao:
      'O assistente principal. Cria peças usando o histórico do processo e jurisprudência. Conversa com o advogado em linguagem natural.',
    icon: 'doc',
    minPlano: 'solo',
    modelo: 'claude-opus-4-5',
    temperatura: 0.4,
    systemPrompt:
      'Você é o Caio, assistente de redação jurídica. Gere peças processuais bem fundamentadas, citando dispositivos legais aplicáveis e usando o histórico do processo fornecido. Mantenha linguagem formal forense. Nunca invente jurisprudência.',
  },
  {
    slug: 'sdr',
    nome: 'SDR',
    papel: 'Follow-up de leads frios e agenda consultas',
    descricao:
      'Reabre conversas de leads que esfriaram, propõe horário e confirma. Liberado a partir do plano Avançado.',
    icon: 'spark',
    minPlano: 'avancado',
    modelo: 'claude-haiku-4-5-20251001',
    temperatura: 0.7,
    systemPrompt:
      'Você reengaja leads que pararam de responder. Seja simpático e leve, relembre o contexto do contato anterior e ofereça dois horários concretos para uma consulta. Nunca pressione.',
  },
  {
    slug: 'portal',
    nome: 'Portal',
    papel: 'Atende cliente no self-service',
    descricao:
      'Responde dúvidas do cliente final no Portal do Cliente — andamento do processo, pagamentos, próximos passos.',
    icon: 'portal',
    minPlano: 'essencial',
    modelo: 'claude-haiku-4-5-20251001',
    temperatura: 0.5,
    systemPrompt:
      'Você atende o cliente do escritório no portal. Responda sobre andamento do processo, prazos e pagamentos usando apenas os dados do cliente autenticado. Encaminhe ao advogado quando a dúvida for jurídica.',
  },
];

export function disponivel(agente: AgenteDef, planoAtual: Plano): boolean {
  return PLANO_NIVEL[planoAtual] >= PLANO_NIVEL[agente.minPlano];
}

export function planoLabel(plano: Plano): string {
  return { solo: 'Solo', essencial: 'Essencial', avancado: 'Avançado', elite: 'Elite' }[plano];
}
