'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Icon } from '@/components/shell/icons';
import { signOut } from '@/lib/auth-client';
import { MODULES } from '@/lib/modules';

export interface HeaderProps {
  usuarioNome: string;
  podeSair: boolean;
}

export function Header({ usuarioNome, podeSair }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [saindo, startSaindo] = useTransition();

  const sair = () => {
    startSaindo(async () => {
      try {
        await signOut();
      } catch {
        // ignora — segue para o login de qualquer forma
      }
      router.push('/login');
      router.refresh();
    });
  };

  const current = MODULES.find((m) => pathname === m.href || pathname.startsWith(`${m.href}/`));
  const iniciais = usuarioNome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-base/80 px-6 backdrop-blur">
      <div>
        <h1 className="font-display text-lg font-semibold text-ink">
          {current?.label ?? 'Nexus'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Caio — assistente IA */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm text-ink transition-colors hover:border-brand/60"
        >
          <span className="text-brand">
            <Icon name="spark" size={16} />
          </span>
          Perguntar ao Caio
        </button>

        {/* Usuário */}
        <div className="flex items-center gap-2.5 pl-1">
          <span
            title={usuarioNome}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand"
          >
            {iniciais}
          </span>
          {podeSair ? (
            <button
              type="button"
              onClick={sair}
              disabled={saindo}
              title="Sair"
              className="rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              {saindo ? '…' : 'Sair'}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
