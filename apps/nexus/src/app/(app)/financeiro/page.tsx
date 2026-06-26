import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { PainelFinanceiro } from '@/components/financeiro/painel-financeiro';
import { getOfficeContext } from '@/lib/office-context';
import {
  listDespesas,
  listHonorarios,
  listTimesheets,
} from '@/server/repositories/financeiro';

export const dynamic = 'force-dynamic';

export default async function FinanceiroPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const [honorarios, despesas, timesheets] = await Promise.all([
    listHonorarios(ctx.officeId),
    listDespesas(ctx.officeId),
    listTimesheets(ctx.officeId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Financeiro</h2>
        <p className="text-sm text-muted">
          Honorários, timesheet e despesas · integração de cobrança via Asaas (boleto + PIX)
        </p>
      </div>

      <PainelFinanceiro
        honorariosIniciais={honorarios}
        despesas={despesas}
        timesheetsIniciais={timesheets}
      />
    </div>
  );
}
</content>
