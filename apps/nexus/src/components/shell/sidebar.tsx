'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '@/components/shell/icons';
import { MODULES } from '@/lib/modules';

export interface SidebarProps {
  officeNome: string;
  plano: string;
}

export function Sidebar({ officeNome, plano }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-surface">
      {/* Marca */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-brand">
          <Icon name="capi" size={22} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-tight text-ink">Nexus</p>
          <p className="text-[11px] uppercase tracking-wider text-muted">Inteligência Jurídica</p>
        </div>
      </div>

      {/* Navegação dos 13 módulos */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {MODULES.map((m) => {
          const active = pathname === m.href || pathname.startsWith(`${m.href}/`);
          return (
            <Link
              key={m.slug}
              href={m.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-brand/15 text-ink'
                  : 'text-muted hover:bg-elevated hover:text-ink',
              ].join(' ')}
            >
              <span className={active ? 'text-brand' : 'text-muted group-hover:text-ink'}>
                <Icon name={m.icon} size={18} />
              </span>
              <span className="flex-1 truncate">{m.label}</span>
              {m.phase2 ? (
                <span className="nx-chip bg-gold/15 text-gold">Fase 2</span>
              ) : null}
              {m.locked ? (
                <span className="nx-chip bg-elevated text-muted">Pro</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé: escritório atual + plano */}
      <div className="border-t border-border px-4 py-4">
        <p className="truncate text-sm font-medium text-ink">{officeNome}</p>
        <p className="mt-0.5 text-xs capitalize text-muted">Plano {plano}</p>
      </div>
    </aside>
  );
}
