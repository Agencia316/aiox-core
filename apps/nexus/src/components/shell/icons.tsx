/**
 * Ícones inline (stroke). Sem dependência externa — mantém o app self-contained.
 * Cada ícone herda `currentColor` e tamanho via className.
 */
import type { SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'gavel'
  | 'funnel'
  | 'chat'
  | 'doc'
  | 'portal'
  | 'calendar'
  | 'spark'
  | 'shield'
  | 'chart'
  | 'search'
  | 'robot'
  | 'users'
  | 'wallet'
  | 'capi';

type PathProps = SVGProps<SVGSVGElement>;

const base: PathProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const PATHS: Record<IconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  gavel: (
    <>
      <path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10" />
      <path d="m9 8 7 7" />
      <path d="m13 4 7 7" />
      <path d="m16.5 7.5-5 5" />
    </>
  ),
  funnel: (
    <>
      <path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z" />
    </>
  ),
  chat: (
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.7A8.4 8.4 0 1 1 21 11.5Z" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  portal: (
    <>
      <path d="M4 21V8l8-5 8 5v13" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.6 4-1.2 7-5.2 7-9.6V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15v3M12 9v9M17 5v13" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  robot: (
    <>
      <rect x="4" y="8" width="16" height="11" rx="2" />
      <path d="M12 8V4M9 13h.01M15 13h.01M9 16h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6M18 20a6.5 6.5 0 0 0-3-5.5" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M16 14h2" />
    </>
  ),
  capi: (
    <>
      <ellipse cx="12" cy="13" rx="7" ry="6" />
      <path d="M9 11h.01M15 11h.01" />
      <path d="M8 6c0-1.5 1-2 2-2M16 6c0-1.5-1-2-2-2" />
    </>
  ),
};

export interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size = 20 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
