/**
 * Os 13 módulos do Nexus (briefing §3). Fonte única para a sidebar e o
 * roteamento. `phase2` marca módulos planejados para a Fase 2 do produto;
 * `locked` marca recursos restritos a planos superiores.
 */
import type { IconName } from '@/components/shell/icons';

export interface ModuleDef {
  slug: string;
  label: string;
  href: string;
  icon: IconName;
  phase2?: boolean;
  locked?: boolean;
}

export const MODULES: ModuleDef[] = [
  { slug: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { slug: 'processos', label: 'Monitoramento', href: '/processos', icon: 'gavel' },
  { slug: 'crm', label: 'CRM & Leads', href: '/crm', icon: 'funnel' },
  { slug: 'atendimento', label: 'Atendimento WhatsApp', href: '/atendimento', icon: 'chat' },
  { slug: 'peticionamento', label: 'Peticionamento', href: '/peticionamento', icon: 'doc' },
  { slug: 'portal', label: 'Portal do Cliente', href: '/portal', icon: 'portal' },
  { slug: 'agenda', label: 'Agenda & Prazos', href: '/agenda', icon: 'calendar' },
  { slug: 'ia', label: 'Central de IA', href: '/ia', icon: 'spark' },
  { slug: 'cliente-360', label: 'Cliente 360', href: '/cliente-360', icon: 'shield' },
  { slug: 'jurimetria', label: 'Jurimetria', href: '/jurimetria', icon: 'chart', phase2: true },
  { slug: 'background-check', label: 'Background Check', href: '/background-check', icon: 'search' },
  { slug: 'agentes', label: 'Estúdio de Agentes', href: '/agentes', icon: 'robot' },
  { slug: 'equipe', label: 'Equipe & Plano', href: '/equipe', icon: 'users' },
];

export function moduleBySlug(slug: string): ModuleDef | undefined {
  return MODULES.find((m) => m.slug === slug);
}
