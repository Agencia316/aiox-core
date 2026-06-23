'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { signIn } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const entrar = () => {
    setErro(null);
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    startTransition(async () => {
      const { error } = await signIn.email({ email: email.trim(), password: senha });
      if (error) {
        setErro(error.message ?? 'Credenciais inválidas.');
        return;
      }
      router.push(redirect);
      router.refresh();
    });
  };

  return (
    <div className="mt-6 space-y-3 text-left">
      <div>
        <label className="text-xs uppercase tracking-wider text-muted">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-ink focus:border-brand/60 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-muted">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') entrar();
          }}
          disabled={pending}
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-ink focus:border-brand/60 focus:outline-none"
        />
      </div>

      {erro ? <p className="text-xs text-danger">{erro}</p> : null}

      <button
        type="button"
        onClick={entrar}
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </div>
  );
}
