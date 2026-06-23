'use client';

import { useState, useTransition } from 'react';

import { chatIaAction } from '@/app/(app)/ia/actions';
import { Icon } from '@/components/shell/icons';

interface Msg {
  de: 'user' | 'caio';
  texto: string;
}

const SUGESTOES = [
  'Como posso contestar uma multa de trânsito?',
  'Quais documentos preciso para inventário?',
  'Me explique o que é habeas corpus.',
];

export function ChatDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const enviar = (texto: string) => {
    const t = texto.trim();
    if (!t) return;
    setErro(null);
    setMsgs((prev) => [...prev, { de: 'user', texto: t }]);
    setInput('');
    startTransition(async () => {
      const r = await chatIaAction(t);
      if (r.ok && r.texto) {
        setMsgs((prev) => [...prev, { de: 'caio', texto: r.texto! }]);
      } else {
        setErro(r.erro ?? 'Erro desconhecido');
      }
    });
  };

  return (
    <div className="nx-card flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Icon name="spark" size={14} />
        </span>
        <span className="font-display text-sm font-semibold text-ink">Caio — Demo ao vivo</span>
        <span className="ml-auto nx-chip bg-success/15 text-success">Online</span>
      </div>

      <div className="flex min-h-48 flex-col gap-3 overflow-y-auto p-5">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-sm text-muted">Experimente perguntar algo ao Caio</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  disabled={pending}
                  className="rounded-full border border-border bg-elevated px-3 py-1.5 text-xs text-muted transition-colors hover:border-brand/40 hover:text-ink disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          msgs.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.de === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  m.de === 'user'
                    ? 'bg-brand text-white'
                    : 'border border-border bg-elevated text-ink'
                }`}
              >
                {m.texto}
              </div>
            </div>
          ))
        )}
        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-muted">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-75">●</span>
              <span className="animate-pulse delay-150">●</span>
            </div>
          </div>
        )}
      </div>

      {erro && <p className="px-5 text-xs text-danger">{erro}</p>}

      <div className="flex items-center gap-2 border-t border-border p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar(input);
            }
          }}
          disabled={pending}
          placeholder="Pergunte ao Caio…"
          className="flex-1 rounded-lg border border-border bg-elevated px-4 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => enviar(input)}
          disabled={pending || !input.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
        >
          <Icon name="spark" size={14} /> {pending ? 'Caio…' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
