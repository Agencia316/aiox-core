import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { LeadCard } from '@/components/crm/lead-card';
import { getOfficeContext } from '@/lib/office-context';
import type { LeadColuna, LeadDTO } from '@/server/dto';
import { listLeads } from '@/server/repositories/leads';

export const dynamic = 'force-dynamic';

const COLUNAS: { id: LeadColuna; label: string; tone: string }[] = [
  { id: 'novo', label: 'Novo', tone: 'border-brand/40' },
  { id: 'qualificacao', label: 'Qualificação', tone: 'border-brand/40' },
  { id: 'proposta', label: 'Proposta', tone: 'border-gold/40' },
  { id: 'negociacao', label: 'Negociação', tone: 'border-gold/40' },
  { id: 'ganho', label: 'Ganho', tone: 'border-success/40' },
  { id: 'perdido', label: 'Perdido', tone: 'border-danger/40' },
];

function agrupar(leads: LeadDTO[]): Record<LeadColuna, LeadDTO[]> {
  const out = {
    novo: [],
    qualificacao: [],
    proposta: [],
    negociacao: [],
    ganho: [],
    perdido: [],
  } as Record<LeadColuna, LeadDTO[]>;
  for (const l of leads) out[l.colunaFunil].push(l);
  for (const col of Object.values(out)) col.sort((a, b) => b.score - a.score);
  return out;
}

export default async function CrmPage() {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const leads = await listLeads(ctx.officeId);
  const porColuna = agrupar(leads);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">CRM &amp; Leads</h2>
        <p className="text-sm text-muted">
          {leads.length} leads no funil — score gerado pelo Agente Qualificação
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {COLUNAS.map((col) => {
          const items = porColuna[col.id];
          return (
            <section
              key={col.id}
              className={`flex min-h-[60vh] flex-col rounded-xl border-t-2 ${col.tone} bg-surface p-3`}
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{col.label}</h3>
                <span className="font-mono text-xs text-muted">{items.length}</span>
              </header>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted">
                    Vazio
                  </p>
                ) : (
                  items.map((l) => <LeadCard key={l.id} lead={l} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
