import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { Icon } from '@/components/shell/icons';
import type { Plano } from '@/lib/agentes';
import { formatBRL, formatDataFull } from '@/lib/format';
import { planoInfo, SEAT_EXTRA } from '@/lib/planos';
import { getOfficeContext } from '@/lib/office-context';
import type { CobrancaDTO, UserRole } from '@/server/dto';
import { listCobrancas, listUsuarios } from '@/server/repositories/equipe';
import { getOfficeProfile } from '@/server/repositories/office';

export const dynamic = 'force-dynamic';

function normalizarPlano(raw: string): Plano {
  return (['solo', 'essencial', 'avancado', 'elite'] as Plano[]).includes(raw as Plano)
    ? (raw as Plano)
    : 'solo';
}

const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Titular',
  admin: 'Administrador',
  advogado: 'Advogado(a)',
  secretaria: 'Secretaria',
};

const COB_STATUS: Record<CobrancaDTO['status'], { label: string; tone: string }> = {
  pago: { label: 'Pago', tone: 'bg-success/15 text-success' },
  pendente: { label: 'Pendente', tone: 'bg-gold/15 text-gold' },
  vencido: { label: 'Vencido', tone: 'bg-danger/15 text-danger' },
  cancelado: { label: 'Cancelado', tone: 'bg-elevated text-muted' },
};

export default async function EquipePage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const [profile, usuarios, cobrancas] = await Promise.all([
    getOfficeProfile(ctx.officeId),
    listUsuarios(ctx.officeId),
    listCobrancas(ctx.officeId),
  ]);

  const plano = planoInfo(normalizarPlano(profile.plano));
  const limite = plano.usuarios;
  const usados = usuarios.length;
  const limiteLabel = limite === null ? 'ilimitado' : String(limite);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Equipe &amp; Plano</h2>
        <p className="text-sm text-muted">{profile.nome}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Plano atual */}
        <section className="nx-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="nx-chip bg-brand/15 text-brand">Plano {plano.nome}</span>
            <Icon name="shield" className="text-brand" size={18} />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-ink">
            {formatBRL(plano.precoMensal)}
            <span className="text-base font-normal text-muted">/mês</span>
          </p>
          <p className="text-xs text-muted">
            ou {formatBRL(plano.precoAnual)}/mês no plano anual (-17%)
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-ink">
            {plano.destaques.map((d) => (
              <li key={d} className="flex items-start gap-2">
                <span className="mt-0.5 text-success">
                  <Icon name="shield" size={14} />
                </span>
                {d}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled
            className="mt-5 w-full rounded-lg bg-brand/30 px-4 py-2.5 text-sm font-medium text-muted"
            title="Gestão de plano via Asaas — requer credencial"
          >
            Gerenciar assinatura
          </button>
        </section>

        {/* Seats */}
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
                  {u.nome
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{u.nome}</p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>
                <span className="nx-chip bg-elevated text-muted">{ROLE_LABEL[u.role]}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled={limite !== null && usados >= limite}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink disabled:opacity-50"
          >
            <Icon name="users" size={14} /> Convidar usuário
          </button>
        </section>
      </div>

      {/* Cobranças */}
      <section className="nx-card overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-display text-base font-semibold text-ink">Cobranças (Asaas)</h3>
        </div>
        {cobrancas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma cobrança registrada.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Data</th>
                <th className="px-5 py-2 font-medium">Valor</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cobrancas.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-mono text-xs text-ink">
                    {formatDataFull(c.createdAt)}
                  </td>
                  <td className="px-5 py-3 font-mono text-ink">{formatBRL(c.valor)}</td>
                  <td className="px-5 py-3">
                    <span className={`nx-chip ${COB_STATUS[c.status].tone}`}>
                      {COB_STATUS[c.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
