import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ConversaView } from '@/components/atendimento/conversa-view';
import { Icon } from '@/components/shell/icons';
import { formatHora } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import { getConversaByLead, listConversas } from '@/server/repositories/conversas';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { lead?: string };
}

export default async function AtendimentoPage({ searchParams }: PageProps) {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const conversas = await listConversas(ctx.officeId);

  // Default: primeira conversa (ordenadas por última mensagem desc).
  const leadIdSelecionado = searchParams.lead ?? conversas[0]?.leadId;
  const conversaAtiva =
    leadIdSelecionado != null ? await getConversaByLead(ctx.officeId, leadIdSelecionado) : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Atendimento WhatsApp</h2>
        <p className="text-sm text-muted">
          {conversas.length} conversa{conversas.length === 1 ? '' : 's'} — Caio atende 24h via
          Evolution API
        </p>
      </div>

      <div className="nx-card grid h-[70vh] grid-cols-12 overflow-hidden p-0">
        {/* Lista de conversas */}
        <aside className="col-span-4 flex flex-col border-r border-border lg:col-span-3">
          <div className="border-b border-border px-4 py-3 text-xs uppercase tracking-wider text-muted">
            Conversas
          </div>
          <ul className="flex-1 overflow-y-auto">
            {conversas.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted">
                Nenhuma conversa ainda. Conecte uma instância Evolution.
              </li>
            ) : (
              conversas.map((c) => {
                const ativo = c.leadId === leadIdSelecionado;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/atendimento?lead=${c.leadId}`}
                      className={`flex gap-3 border-b border-border px-4 py-3 transition-colors ${
                        ativo ? 'bg-brand/10' : 'hover:bg-elevated/40'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                        <Icon name="chat" size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-medium text-ink">{c.leadNome}</p>
                          {c.ultimaMensagem ? (
                            <span className="shrink-0 font-mono text-[10px] text-muted">
                              {formatHora(c.ultimaMensagem.em)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {c.ultimaMensagem
                            ? `${c.ultimaMensagem.de === 'caio' ? 'Caio: ' : ''}${
                                c.ultimaMensagem.texto
                              }`
                            : 'Sem mensagens'}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* Conversa ativa */}
        <div className="col-span-8 lg:col-span-9">
          {conversaAtiva ? (
            <ConversaView conversa={conversaAtiva} />
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-center text-sm text-muted">
              Selecione uma conversa à esquerda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
