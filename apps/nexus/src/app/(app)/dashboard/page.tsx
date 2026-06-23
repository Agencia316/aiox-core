import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AtividadeRecente } from '@/components/dashboard/atividade-recente';
import { FunilLeads } from '@/components/dashboard/funil-leads';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { formatBRL } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import { getDashboard } from '@/server/repositories/dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) {
    redirect('/login');
  }

  const { kpis, funil, atividadeRecente } = await getDashboard(ctx.officeId);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Processos ativos"
          value={String(kpis.processosAtivos)}
          hint="Em monitoramento (JUDIT)"
          icon="gavel"
          tone="brand"
        />
        <KpiCard
          label="Prazos urgentes"
          value={String(kpis.prazosUrgentes)}
          hint="Vencendo nos próximos dias"
          icon="calendar"
          tone="danger"
        />
        <KpiCard
          label="Leads novos"
          value={String(kpis.leadsNovos)}
          hint="Aguardando qualificação"
          icon="funnel"
          tone="gold"
        />
        <KpiCard
          label="Receita do mês"
          value={formatBRL(kpis.receitaMes)}
          hint="Cobranças pagas (Asaas)"
          icon="chart"
          tone="success"
        />
      </div>

      {/* Funil + atividade */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunilLeads funil={funil} />
        <AtividadeRecente movimentacoes={atividadeRecente} />
      </div>
    </div>
  );
}
