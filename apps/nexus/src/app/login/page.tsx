import { Icon } from '@/components/shell/icons';

// Placeholder de login. O fluxo completo do Better Auth (formulário + ações)
// é construído quando a autenticação real entrar (fora de NEXUS_USE_MOCKS).
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base p-6">
      <div className="nx-card w-full max-w-sm p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Icon name="capi" size={24} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Nexus</h1>
        <p className="mt-1 text-sm text-muted">Entre para acessar seu escritório</p>
        <p className="mt-6 text-xs text-muted">
          Autenticação via Better Auth — em modo demo o login é dispensado.
        </p>
      </div>
    </main>
  );
}
