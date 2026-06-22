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
  },
];

export function disponivel(agente: AgenteDef, planoAtual: Plano): boolean {
  return PLANO_NIVEL[planoAtual] >= PLANO_NIVEL[agente.minPlano];
}

export function planoLabel(plano: Plano): string {
  return { solo: 'Solo', essencial: 'Essencial', avancado: 'Avançado', elite: 'Elite' }[plano];
}
