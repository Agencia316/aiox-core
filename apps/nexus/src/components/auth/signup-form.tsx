'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { criarContaAction } from '@/app/signup/actions';
import { signIn } from '@/lib/auth-client';
import type { Plano } from '@/lib/agentes';
import { PLANOS } from '@/lib/planos';

const ORDEM_PLANOS: Plano[] = ['solo', 'essencial', 'avancado', 'elite'];

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [officeNome, setOfficeNome] = useState('');
  const [oab, setOab] = useState('');
  const [plano, setPlano] = useState<Plano>('solo');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const criar = () => {
    setErro(null);
    if (!officeNome.trim() || !nome.trim() || !email.trim() || senha.length < 8) {
      setErro('Preencha todos os campos. A senha precisa de 8+ caracteres.');
      return;
    }
    startTransition(async () => {
      try {
        await criarContaAction({ officeNome, oab, plano, nome, email, senha });
        const { error } = await signIn.email({ email: email.trim().toLowerCase(), password: senha });
        if (error) {
          // Conta criada, mas auto-login falhou — manda para o login.
          router.push('/login');
          return;
        }
        router.push('/dashboard');
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha ao criar conta');
      }
    });
  };

  const input =
    'mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-ink focus:border-brand/60 focus:outline-none';
  const label = 'text-xs uppercase tracking-wider text-muted';

  return (
    <div className="mt-6 space-y-3 text-left">
      <div>
        <label className={label}>Nome do escritório</label>
        <input value={officeNome} onChange={(e) => setOfficeNome(e.target.value)} disabled={pending} className={input} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>OAB</label>
          <input value={oab} onChange={(e) => setOab(e.target.value)} disabled={pending} placeholder="OAB/SC 12.345" className={input} />
        </div>
        <div>
          <label className={label}>Plano</label>
          <select value={plano} onChange={(e) => setPlano(e.target.value as Plano)} disabled={pending} className={input}>
            {ORDEM_PLANOS.map((p) => (
              <option key={p} value={p}>
                {PLANOS[p].nome} — R${PLANOS[p].precoMensal}/mês
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={label}>Seu nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} disabled={pending} autoComplete="name" className={input} />
      </div>
      <div>
        <label className={label}>E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} autoComplete="email" className={input} />
      </div>
      <div>
        <label className={label}>Senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} disabled={pending} autoComplete="new-password" className={input} />
      </div>

      {erro ? <p className="text-xs text-danger">{erro}</p> : null}

      <button
        type="button"
        onClick={criar}
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? 'Criando conta…' : 'Criar conta'}
      </button>
    </div>
  );
}
