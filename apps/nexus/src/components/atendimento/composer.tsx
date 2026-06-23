'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { caioResponderAction, enviarMensagemAction } from '@/app/(app)/atendimento/actions';
import { Icon } from '@/components/shell/icons';

export interface ComposerProps {
  leadId: string;
}

export function Composer({ leadId }: ComposerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const enviar = () => {
    setErro(null);
    if (!texto.trim()) return;
    startTransition(async () => {
      try {
        await enviarMensagemAction(leadId, texto.trim());
        setTexto('');
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha ao enviar');
      }
    });
  };

  const caioResponde = () => {
    setErro(null);
    startTransition(async () => {
      try {
        await caioResponderAction(leadId);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha ao gerar resposta');
      }
    });
  };

  return (
    <footer className="border-t border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          disabled={pending}
          placeholder="Escreva uma mensagem…"
          className="flex-1 rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={pending || !texto.trim()}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
        >
          Enviar
        </button>
        <button
          type="button"
          onClick={caioResponde}
          disabled={pending}
          title="O Caio gera e envia a próxima resposta"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-ink transition-colors hover:border-brand/60 disabled:opacity-50"
        >
          <span className="text-brand">
            <Icon name="spark" size={15} />
          </span>
          {pending ? 'Caio…' : 'Caio responde'}
        </button>
      </div>
      {erro ? <p className="mt-2 text-xs text-danger">{erro}</p> : (
        <p className="mt-2 text-xs text-muted">
          O Agente Recepção (Caio) atende 24h. Em demo, a resposta é gerada localmente.
        </p>
      )}
    </footer>
  );
}
