import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { Header } from '@/components/shell/header';
import { Sidebar } from '@/components/shell/sidebar';
import { isMockMode } from '@/lib/env';
import { getOfficeContext } from '@/lib/office-context';
import { getOfficeProfile } from '@/server/repositories/office';

// App shell autenticado: resolve o tenant uma vez e monta sidebar + header.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await getOfficeContext(headers());
  if (!ctx) {
    redirect('/login');
  }

  const profile = await getOfficeProfile(ctx.officeId);

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar officeNome={profile.nome} plano={profile.plano} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header usuarioNome={profile.usuarioNome} podeSair={!isMockMode()} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
