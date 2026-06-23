import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { ConsultaCliente } from '@/components/cliente-360/consulta-cliente';
import { getOfficeContext } from '@/lib/office-context';
import { listClientesConsultados } from '@/server/repositories/cliente360';

export const dynamic = 'force-dynamic';

export default async function Cliente360Page() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const clientes = await listClientesConsultados(ctx.officeId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Cliente 360</h2>
        <p className="text-sm text-muted">
          {clientes.length} consulta{clientes.length === 1 ? '' : 's'} · score consolida Receita
          Federal, Serasa, BNMP e tribunais
        </p>
      </div>

      <ConsultaCliente inicial={clientes} />
    </div>
  );
}
