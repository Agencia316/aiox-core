/**
 * Catálogo de planos (briefing §6). Fonte única para Equipe & Plano.
 * Preços em reais; `usuarios` = limite de seats (null = ilimitado).
 */
import type { Plano } from '@/lib/agentes';

export interface PlanoInfo {
  id: Plano;
  nome: string;
  precoMensal: number;
  precoAnual: number;
  usuarios: number | null;
  whatsapps: number;
  destaques: string[];
}

export const PLANOS: Record<Plano, PlanoInfo> = {
  solo: {
    id: 'solo',
    nome: 'Solo',
    precoMensal: 227,
    precoAnual: 188,
    usuarios: 1,
    whatsapps: 1,
    destaques: ['Monitoramento de 50 processos', 'Redação de 20 peças/mês', 'Google Calendar'],
  },
  essencial: {
    id: 'essencial',
    nome: 'Essencial',
    precoMensal: 379,
    precoAnual: 314,
    usuarios: 3,
    whatsapps: 1,
    destaques: ['Portal self-service', 'INTIMA.AI', 'ZapSign', 'Asaas'],
  },
  avancado: {
    id: 'avancado',
    nome: 'Avançado',
    precoMensal: 679,
    precoAnual: 564,
    usuarios: 6,
    whatsapps: 2,
    destaques: ['Caio com memória por processo', 'Insights proativos', 'Cliente 360', 'BGC', 'SDR'],
  },
  elite: {
    id: 'elite',
    nome: 'Elite',
    precoMensal: 1349,
    precoAnual: 1120,
    usuarios: null,
    whatsapps: 99,
    destaques: ['JUIT Rimor (jurisprudência)', 'API access', 'SLA 4h', 'Marca branca'],
  },
};

/** Preço por seat adicional (briefing §6). */
export const SEAT_EXTRA = { mensal: 49, anual: 41 };

export function planoInfo(plano: Plano): PlanoInfo {
  return PLANOS[plano];
}
