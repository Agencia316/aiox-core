import Link from 'next/link';

import { SignupForm } from '@/components/auth/signup-form';
import { Icon } from '@/components/shell/icons';
import { isMockMode } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const demo = isMockMode();

  return (
    <main className="flex min-h-screen items-center justify-center bg-base p-6">
      <div className="nx-card w-full max-w-md p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Icon name="capi" size={24} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Criar conta no Nexus</h1>
        <p className="mt-1 text-sm text-muted">Cadastre seu escritório em minutos</p>

        {demo ? (
          <p className="mt-6 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
            Cadastro indisponível em modo demo (NEXUS_USE_MOCKS). Configure o banco e rode com
            NEXUS_USE_MOCKS=false.
          </p>
        ) : (
          <SignupForm />
        )}

        <p className="mt-6 text-xs text-muted">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
