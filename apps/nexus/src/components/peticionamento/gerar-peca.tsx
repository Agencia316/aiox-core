'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { gerarPecaAction } from '@/app/(app)/peticionamento/actions';
import { Icon } from '@/components/shell/icons';

export interface ProcessoOption {
  id: string;
  label: string;
}

export interface GerarPecaProps {
  processos: ProcessoOption[];
}

export function GerarPeca({ processos }: GerarPecaProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [processoId, setProcessoId] = useState(processos[0]?.id ?? '');
  const [instrucao, setInstrucao] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const submeter = () => {
    setErro(null);
    if (!processoId || !instrucao.trim()) {
      setErro('Escolha um processo e descreva a instrução.');
      return;
    }
    startTransition(async () => {
      try {
        const { documentoId } = await gerarPecaAction(processoId, instrucao.trim());
        setInstrucao('');
        setOpen(false);
        router.push(`/peticionamento?doc=${documentoId}`);
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha ao gerar peça');
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={processos.length === 0}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
      >
        <Icon name="spark" size={15} /> Gerar peça com o Caio
      </button>
    );
  }

  return (
    <div className="nx-card w-full max-w-xl p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-ink">Nova peça com o Caio</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-ink"
        >
          Fechar
        </button>
      </div>

      <label className="mt-3 block text-xs uppercase tracking-wider text-muted">Processo</label>
      <select
        value={processoId}
        onChange={(e) => setProcessoId(e.target.value)}
        disabled={pending}
        className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink focus:outline-none"
      >
        {processos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <label className="mt-3 block text-xs uppercase tracking-wider text-muted">Instrução</label>
      <textarea
        value={instrucao}
        onChange={(e) => setInstrucao(e.target.value)}
        disabled={pending}
        rows={3}
        placeholder="Ex.: redija a réplica à contestação refutando a alegação de inexistência de vínculo."
        className="mt-1 w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none"
      />

      {erro ? <p className="mt-2 text-xs text-danger">{erro}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={submeter}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
        >
          <Icon name="spark" size={15} /> {pending ? 'Gerando…' : 'Gerar'}
        </button>
        <span className="text-xs text-muted">
          Em modo demo, a minuta é gerada localmente.
        </span>
      </div>
    </div>
  );
}
