import { Icon } from '@/components/shell/icons';
import { formatData, formatHora } from '@/lib/format';
import type { ConversaDTO, MensagemWA } from '@/server/dto';

function scoreTone(score: number): string {
  if (score >= 80) return 'bg-success/15 text-success';
  if (score >= 50) return 'bg-gold/15 text-gold';
  return 'bg-danger/15 text-danger';
}

export interface ConversaViewProps {
  conversa: ConversaDTO;
}

export function ConversaView({ conversa }: ConversaViewProps) {
  return (
    <section className="flex h-full flex-col">
      {/* Cabeçalho do contato */}
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="font-display text-lg font-semibold text-ink">{conversa.leadNome}</p>
          <p className="font-mono text-xs text-muted">{conversa.leadTelefone}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="nx-chip bg-elevated text-muted">{conversa.leadArea}</span>
          <span className={`nx-chip ${scoreTone(conversa.leadScore)} font-mono`}>
            Score {conversa.leadScore}
          </span>
        </div>
      </header>

      {/* Mensagens */}
      <ol className="flex-1 space-y-3 overflow-y-auto bg-base/40 p-5">
        {conversa.mensagens.map((m, idx) => (
          <MensagemBalao key={`${m.em}-${idx}`} mensagem={m} />
        ))}
      </ol>

      {/* Composer (stub — envio real requer Evolution + Caio com Claude API) */}
      <footer className="border-t border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Caio assume — envio real requer Evolution API + chave Anthropic"
            disabled
            className="flex-1 rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-muted placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 rounded-lg bg-brand/30 px-4 py-2.5 text-sm font-medium text-muted"
          >
            <Icon name="spark" size={14} /> Enviar
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Em produção, o Agente Recepção (Caio) responde 24h via Evolution API.
        </p>
      </footer>
    </section>
  );
}

function MensagemBalao({ mensagem }: { mensagem: MensagemWA }) {
  const eCaio = mensagem.de === 'caio';
  const hora = `${formatData(mensagem.em)} · ${formatHora(mensagem.em)}`;
  return (
    <li className={`flex ${eCaio ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[75%]">
        <div
          className={[
            'rounded-2xl px-4 py-2.5 text-sm',
            eCaio
              ? 'rounded-br-sm bg-brand/20 text-ink'
              : 'rounded-bl-sm bg-elevated text-ink',
          ].join(' ')}
        >
          {mensagem.texto}
        </div>
        <p
          className={`mt-1 font-mono text-[10px] text-muted ${
            eCaio ? 'text-right' : 'text-left'
          }`}
        >
          {eCaio ? 'Caio' : 'Lead'} · {hora}
        </p>
      </div>
    </li>
  );
}
