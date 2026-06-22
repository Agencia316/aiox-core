import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import { Icon } from '@/components/shell/icons';
import { isMockMode } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const demo = isMockMode();

  return (
    <main className="flex min-h-screen items-center justify-center bg-base p-6">
      <div className="nx-card w-full max-w-sm p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Icon name="capi" size={24} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Nexus</h1>
        <p className="mt-1 text-sm text-muted">Entre para acessar seu escritório</p>

        {demo ? (
          <p className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
            Modo demo ativo (NEXUS_USE_MOCKS): o login é dispensado — acesse direto o app.
          </p>
        ) : (
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        )}
      </div>
    </main>
  );
}
