'use client';

import { useState } from 'react';

import { Icon } from '@/components/shell/icons';
import { formatBRL } from '@/lib/format';
import { SEAT_EXTRA } from '@/lib/planos';
import type { UserRole, UsuarioDTO } from '@/server/dto';

const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Titular',
  admin: 'Administrador',
  advogado: 'Advogado(a)',
  secretaria: 'Secretaria',
};

const ROLES_CONVIDAVEIS: UserRole[] = ['advogado', 'secretaria', 'admin'];

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export interface SeatsEquipeProps {
  inicial: UsuarioDTO[];
  limite: number | null;
}

export function SeatsEquipe({ inicial, limite }: SeatsEquipeProps) {
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>(inicial);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('advogado');
  const [erro, setErro] = useState<string | null>(null);

  const usados = usuarios.length;
  const limiteLabel = limite === null ? 'ilimitado' : String(limite);
  const limiteAtingido = limite !== null && usados >= limite;

  const convidar = () => {
    setErro(null);
    const nomeT = nome.trim();
    const emailT = email.trim();
    if (!nomeT || !emailT) {
      setErro('Informe nome e e-mail.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailT)) {
      setErro('E-mail inválido.');
      return;
    }
    if (usuarios.some((u) => u.email.toLowerCase() === emailT.toLowerCase())) {
      setErro('Já existe um usuário com esse e-mail.');
      return;
    }
    const novo: UsuarioDTO = {
      id: crypto.randomUUID(),
      nome: nomeT,
      email: emailT,
      role,
      createdAt: new Date().toISOString(),
    };
    setUsuarios((prev) => [...prev, novo]);
    setNome('');
    setEmail('');
    setRole('advogado');
    setAberto(false);
  };

  return (
    <section className="nx-card p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Usuários</h3>
        <span className="text-sm text-muted">
          {usados} de {limiteLabel} seats · extra {formatBRL(SEAT_EXTRA.mensal)}/mês
        </span>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {usuarios.map((u) => (
          <li key={u.id} className="flex items-center gap-3 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand">
              {iniciais(u.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{u.nome}</p>
              <p className="truncate text-xs text-muted">{u.email}</p>
            </div>
            <span className="nx-chip bg-elevated text-muted">{ROLE_LABEL[u.role]}</span>
          </li>
        ))}
      </ul>

      {aberto ? (
        <div className="mt-4 rounded-lg border border-border bg-elevated/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@escritorio.adv.br"
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink focus:border-brand/60 focus:outline-none"
            >
              {ROLES_CONVIDAVEIS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          {erro ? <p className="mt-2 text-xs text-danger">{erro}</p> : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={convidar}
              className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              Adicionar ao escritório
            </button>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                setErro(null);
              }}
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAberto(true)}
          disabled={limiteAtingido}
          title={limiteAtingido ? 'Limite de seats do plano atingido' : undefined}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink disabled:opacity-50"
        >
          <Icon name="users" size={14} /> Convidar usuário
        </button>
      )}
    </section>
  );
}
