'use client';

import { useMemo, useState, useTransition } from 'react';

import {
  registrarHonorarioAction,
  registrarTimesheetAction,
} from '@/app/(app)/financeiro/actions';
import { Icon } from '@/components/shell/icons';
import { formatBRL, formatDataFull } from '@/lib/format';
import type {
  DespesaDTO,
  HonorarioDTO,
  HonorarioStatus,
  HonorarioTipo,
  TimesheetDTO,
} from '@/server/dto';

const TIPO_LABEL: Record<HonorarioTipo, string> = {
  fixo: 'Fixo',
  hora: 'Por hora',
  exito: 'Êxito',
};

const STATUS_TONE: Record<HonorarioStatus, { label: string; tone: string }> = {
  recebido: { label: 'Recebido', tone: 'bg-success/15 text-success' },
  faturado: { label: 'Faturado', tone: 'bg-brand/15 text-brand' },
  aberto: { label: 'Em aberto', tone: 'bg-gold/15 text-gold' },
  atrasado: { label: 'Atrasado', tone: 'bg-danger/15 text-danger' },
};

function somaHonorarios(honos: HonorarioDTO[], status: HonorarioStatus[]): number {
  return honos.filter((h) => status.includes(h.status)).reduce((acc, h) => acc + h.valor, 0);
}

export interface PainelFinanceiroProps {
  honorariosIniciais: HonorarioDTO[];
  despesas: DespesaDTO[];
  timesheetsIniciais: TimesheetDTO[];
}

export function PainelFinanceiro({
  honorariosIniciais,
  despesas,
  timesheetsIniciais,
}: PainelFinanceiroProps) {
  const [honorarios, setHonorarios] = useState<HonorarioDTO[]>(honorariosIniciais);
  const [timesheets, setTimesheets] = useState<TimesheetDTO[]>(timesheetsIniciais);
  const [pending, startTransition] = useTransition();

  // Formulário de honorário
  const [hCliente, setHCliente] = useState('');
  const [hDescricao, setHDescricao] = useState('');
  const [hTipo, setHTipo] = useState<HonorarioTipo>('fixo');
  const [hValor, setHValor] = useState('');
  const [hVencimento, setHVencimento] = useState('');
  const [hErro, setHErro] = useState<string | null>(null);

  // Formulário de timesheet
  const [tDescricao, setTDescricao] = useState('');
  const [tAdvogado, setTAdvogado] = useState('');
  const [tMinutos, setTMinutos] = useState('');
  const [tValorHora, setTValorHora] = useState('');
  const [tErro, setTErro] = useState<string | null>(null);

  const totalDespesas = useMemo(
    () => despesas.reduce((acc, d) => acc + d.valor, 0),
    [despesas],
  );

  const resumo = useMemo(() => {
    const recebido = somaHonorarios(honorarios, ['recebido']);
    const aReceber = somaHonorarios(honorarios, ['aberto', 'faturado']);
    const atrasado = somaHonorarios(honorarios, ['atrasado']);
    const horas = timesheets.reduce((acc, t) => acc + t.minutos, 0) / 60;
    return {
      recebido,
      aReceber,
      atrasado,
      saldo: recebido - totalDespesas,
      horas: Math.round(horas * 10) / 10,
    };
  }, [honorarios, timesheets, totalDespesas]);

  const registrarHonorario = () => {
    setHErro(null);
    const valor = Number(hValor.replace(',', '.'));
    if (!hCliente.trim() || !hDescricao.trim() || !Number.isFinite(valor) || valor <= 0) {
      setHErro('Informe cliente, descrição e um valor maior que zero.');
      return;
    }
    startTransition(async () => {
      const r = await registrarHonorarioAction({
        clienteNome: hCliente,
        descricao: hDescricao,
        tipo: hTipo,
        valor,
        vencimento: hVencimento || null,
      });
      if (r.ok && r.honorario) {
        setHonorarios((prev) => [r.honorario!, ...prev]);
        setHCliente('');
        setHDescricao('');
        setHValor('');
        setHVencimento('');
        setHTipo('fixo');
      } else {
        setHErro(
          r.motivo === 'indisponivel'
            ? 'Indisponível fora do modo demo (requer Asaas configurado).'
            : 'Dados inválidos.',
        );
      }
    });
  };

  const registrarTimesheet = () => {
    setTErro(null);
    const minutos = Number(tMinutos);
    const valorHora = Number(tValorHora.replace(',', '.'));
    if (
      !tDescricao.trim() ||
      !tAdvogado.trim() ||
      !Number.isFinite(minutos) ||
      minutos <= 0 ||
      !Number.isFinite(valorHora) ||
      valorHora <= 0
    ) {
      setTErro('Informe descrição, advogado, minutos e valor/hora válidos.');
      return;
    }
    startTransition(async () => {
      const r = await registrarTimesheetAction({
        descricao: tDescricao,
        advogado: tAdvogado,
        minutos,
        valorHora,
      });
      if (r.ok && r.timesheet) {
        setTimesheets((prev) => [r.timesheet!, ...prev]);
        setTDescricao('');
        setTAdvogado('');
        setTMinutos('');
        setTValorHora('');
      } else {
        setTErro(
          r.motivo === 'indisponivel'
            ? 'Indisponível fora do modo demo.'
            : 'Dados inválidos.',
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <article className="nx-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted">Recebido</p>
          <p className="mt-2 font-display text-2xl font-bold text-success">
            {formatBRL(resumo.recebido)}
          </p>
        </article>
        <article className="nx-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted">A receber</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">
            {formatBRL(resumo.aReceber)}
          </p>
        </article>
        <article className="nx-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted">Inadimplência</p>
          <p className="mt-2 font-display text-2xl font-bold text-danger">
            {formatBRL(resumo.atrasado)}
          </p>
        </article>
        <article className="nx-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted">Saldo (− despesas)</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{formatBRL(resumo.saldo)}</p>
          <p className="mt-1 text-xs text-muted">
            {formatBRL(totalDespesas)} em despesas · {resumo.horas}h registradas
          </p>
        </article>
      </div>

      {/* Honorários */}
      <section className="nx-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-display text-base font-semibold text-ink">Honorários</h3>
          <span className="text-xs text-muted">{honorarios.length} lançamentos</span>
        </div>

        {/* Form honorário */}
        <div className="border-b border-border bg-elevated/40 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              type="text"
              value={hCliente}
              onChange={(e) => setHCliente(e.target.value)}
              placeholder="Cliente"
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none md:col-span-2"
            />
            <input
              type="text"
              value={hDescricao}
              onChange={(e) => setHDescricao(e.target.value)}
              placeholder="Descrição"
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none md:col-span-2"
            />
            <select
              value={hTipo}
              onChange={(e) => setHTipo(e.target.value as HonorarioTipo)}
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink focus:border-brand/60 focus:outline-none"
            >
              {(Object.keys(TIPO_LABEL) as HonorarioTipo[]).map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="decimal"
              value={hValor}
              onChange={(e) => setHValor(e.target.value)}
              placeholder="Valor R$"
              className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted">
              Vencimento
              <input
                type="date"
                value={hVencimento}
                onChange={(e) => setHVencimento(e.target.value)}
                className="ml-2 rounded-lg border border-border bg-elevated px-2 py-1.5 text-sm text-ink focus:border-brand/60 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={registrarHonorario}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              <Icon name="wallet" size={14} /> Lançar honorário
            </button>
            {hErro ? <span className="text-xs text-danger">{hErro}</span> : null}
          </div>
        </div>

        {honorarios.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">Nenhum honorário lançado.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Cliente / descrição</th>
                <th className="px-5 py-2 font-medium">Tipo</th>
                <th className="px-5 py-2 font-medium">Vencimento</th>
                <th className="px-5 py-2 font-medium">Valor</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {honorarios.map((h) => (
                <tr key={h.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{h.clienteNome}</p>
                    <p className="text-xs text-muted">{h.descricao}</p>
                  </td>
                  <td className="px-5 py-3 text-muted">{TIPO_LABEL[h.tipo]}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">
                    {h.vencimento ? formatDataFull(h.vencimento) : '—'}
                  </td>
                  <td className="px-5 py-3 font-mono text-ink">{formatBRL(h.valor)}</td>
                  <td className="px-5 py-3">
                    <span className={`nx-chip ${STATUS_TONE[h.status].tone}`}>
                      {STATUS_TONE[h.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Timesheet */}
        <section className="nx-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="font-display text-base font-semibold text-ink">Timesheet</h3>
            <span className="text-xs text-muted">{resumo.horas}h no total</span>
          </div>
          <div className="border-b border-border bg-elevated/40 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={tDescricao}
                onChange={(e) => setTDescricao(e.target.value)}
                placeholder="Atividade"
                className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none sm:col-span-2"
              />
              <input
                type="text"
                value={tAdvogado}
                onChange={(e) => setTAdvogado(e.target.value)}
                placeholder="Advogado(a)"
                className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
              />
              <input
                type="text"
                inputMode="numeric"
                value={tMinutos}
                onChange={(e) => setTMinutos(e.target.value)}
                placeholder="Minutos"
                className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none"
              />
              <input
                type="text"
                inputMode="decimal"
                value={tValorHora}
                onChange={(e) => setTValorHora(e.target.value)}
                placeholder="Valor/hora R$"
                className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand/60 focus:outline-none sm:col-span-2"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={registrarTimesheet}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
              >
                <Icon name="calendar" size={14} /> Registrar horas
              </button>
              {tErro ? <span className="text-xs text-danger">{tErro}</span> : null}
            </div>
          </div>
          {timesheets.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma hora registrada.</p>
          ) : (
            <ul className="divide-y divide-border">
              {timesheets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.descricao}</p>
                    <p className="text-xs text-muted">
                      {t.advogado} · {formatDataFull(t.data)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-ink">
                      {Math.floor(t.minutos / 60)}h{String(t.minutos % 60).padStart(2, '0')}
                    </p>
                    <p className="text-xs text-muted">
                      {formatBRL((t.minutos / 60) * t.valorHora)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Despesas */}
        <section className="nx-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="font-display text-base font-semibold text-ink">Despesas</h3>
            <span className="text-xs text-muted">{formatBRL(totalDespesas)}</span>
          </div>
          {despesas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma despesa registrada.</p>
          ) : (
            <ul className="divide-y divide-border">
              {despesas.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{d.descricao}</p>
                    <p className="text-xs capitalize text-muted">
                      {d.categoria}
                      {d.reembolsavel ? ' · reembolsável' : ''}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-danger">− {formatBRL(d.valor)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-xs text-muted">
        Em modo demo, os lançamentos ficam na sessão. A emissão de boleto/PIX e a baixa automática
        de pagamento exigem o <code className="font-mono">ASAAS_API_KEY</code> configurado.
      </p>
    </div>
  );
}
</content>
