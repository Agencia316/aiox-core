import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TipoBadge } from '@/components/peticionamento/tipo-badge';
import { Icon } from '@/components/shell/icons';
import { formatData, formatHora } from '@/lib/format';
import { getOfficeContext } from '@/lib/office-context';
import { getDocumento, listDocumentos } from '@/server/repositories/documentos';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { doc?: string };
}

export default async function PeticionamentoPage({ searchParams }: PageProps) {
  const ctx = await getOfficeContext(headers());
  if (!ctx) redirect('/login');

  const documentos = await listDocumentos(ctx.officeId);
  const docIdSelecionado = searchParams.doc ?? documentos[0]?.id;
  const docAtivo = docIdSelecionado ? await getDocumento(ctx.officeId, docIdSelecionado) : null;

  const gerados = documentos.filter((d) => d.criadoPorIa).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Peticionamento eletrônico</h2>
        <p className="text-sm text-muted">
          {documentos.length} peça{documentos.length === 1 ? '' : 's'} · {gerados} pelo Agente
          Redator (Caio) · Protocolo via INTIMA.AI
        </p>
      </div>

      <div className="nx-card grid h-[72vh] grid-cols-12 overflow-hidden p-0">
        {/* Lista de documentos */}
        <aside className="col-span-4 flex flex-col border-r border-border lg:col-span-3">
          <div className="border-b border-border px-4 py-3 text-xs uppercase tracking-wider text-muted">
            Peças
          </div>
          <ul className="flex-1 overflow-y-auto">
            {documentos.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted">
                Nenhuma peça produzida ainda.
              </li>
            ) : (
              documentos.map((d) => {
                const ativo = d.id === docIdSelecionado;
                return (
                  <li key={d.id}>
                    <Link
                      href={`/peticionamento?doc=${d.id}`}
                      className={`block border-b border-border px-4 py-3 transition-colors ${
                        ativo ? 'bg-brand/10' : 'hover:bg-elevated/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <TipoBadge tipo={d.tipo} />
                        {d.criadoPorIa ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-brand">
                            <Icon name="spark" size={11} /> IA
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-ink">{d.titulo}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted">
                        {formatData(d.createdAt)} · {formatHora(d.createdAt)}
                      </p>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        {/* Editor (read-only) */}
        <div className="col-span-8 flex flex-col lg:col-span-9">
          {docAtivo ? <Editor doc={docAtivo} /> : (
            <div className="flex h-full items-center justify-center p-10 text-center text-sm text-muted">
              Selecione uma peça à esquerda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EditorProps {
  doc: NonNullable<Awaited<ReturnType<typeof getDocumento>>>;
}

function Editor({ doc }: EditorProps) {
  return (
    <>
      <header className="flex items-start justify-between border-b border-border px-6 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TipoBadge tipo={doc.tipo} />
            {doc.criadoPorIa ? (
              <span className="nx-chip bg-brand/15 text-brand">
                <Icon name="spark" size={11} /> Caio
              </span>
            ) : null}
            {doc.processoId ? (
              <Link
                href={`/processos/${doc.processoId}`}
                className="nx-chip bg-elevated text-ink hover:text-brand"
              >
                Ver processo
              </Link>
            ) : null}
          </div>
          <h3 className="mt-2 font-display text-lg font-semibold text-ink">{doc.titulo}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-muted"
          >
            <Icon name="doc" size={14} /> Baixar PDF
          </button>
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 rounded-lg bg-brand/30 px-3 py-2 text-sm font-medium text-muted"
            title="Protocolo real requer chave INTIMA.AI e certificado A1"
          >
            <Icon name="gavel" size={14} /> Protocolar
          </button>
        </div>
      </header>

      <pre className="flex-1 overflow-y-auto whitespace-pre-wrap bg-base/40 p-8 font-mono text-sm leading-relaxed text-ink">
        {doc.conteudo}
      </pre>

      <footer className="border-t border-border bg-surface px-6 py-3 text-xs text-muted">
        Em produção, o botão Protocolar envia ao PJe / e-SAJ / PROJUDI / e-PROC via INTIMA.AI
        usando o certificado A1 do escritório.
      </footer>
    </>
  );
}
