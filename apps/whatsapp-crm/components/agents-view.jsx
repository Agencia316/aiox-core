'use client';

import { useEffect, useState } from 'react';
import { api } from '@/components/api-client';

const DEFAULT_FORM = {
  name: '',
  provider: 'openai',
  model: 'gpt-4o-mini',
  systemPrompt: 'Você é um agente de atendimento amigável e direto. Responda em PT-BR.',
  temperature: 0.7,
};

const MODEL_HINTS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
};

export default function AgentsView() {
  const [agents, setAgents] = useState([]);
  const [columns, setColumns] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  async function load() {
    try {
      const [a, b] = await Promise.all([api.agents(), api.board()]);
      setAgents(a);
      setColumns(b);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      await api.createAgent({
        ...form,
        temperature: parseFloat(form.temperature) || 0.7,
      });
      setForm(DEFAULT_FORM);
      setOk('Agente criado');
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onToggle(a) {
    setErr(null);
    try {
      await api.toggleAgent(a.id, !a.active);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function onAssign(a, columnName) {
    if (!columnName) return;
    setErr(null);
    try {
      await api.assignAgent(a.id, columnName);
      setOk(`Agente "${a.name}" atribuído à coluna "${columnName}"`);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="stack">
      <h1 className="h1">Agentes IA</h1>
      {err && <div className="error">{err}</div>}
      {ok && <div className="success">{ok}</div>}

      <div className="agents">
        <div className="card">
          <h2 className="h2">Criar agente</h2>
          <form onSubmit={onCreate}>
            <div className="field">
              <label>Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ex.: vendas-novos"
                required
              />
            </div>
            <div className="field">
              <label>Provedor</label>
              <select
                value={form.provider}
                onChange={(e) =>
                  setForm({
                    ...form,
                    provider: e.target.value,
                    model: MODEL_HINTS[e.target.value][0],
                  })
                }
              >
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="gemini">Google Gemini</option>
              </select>
            </div>
            <div className="field">
              <label>Modelo</label>
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              >
                {MODEL_HINTS[form.provider].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Temperatura ({form.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={form.temperature}
                onChange={(e) => setForm({ ...form, temperature: e.target.value })}
              />
            </div>
            <div className="field">
              <label>System Prompt</label>
              <textarea
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={busy}>
              {busy ? 'Salvando...' : 'Criar agente'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="h2">Agentes configurados</h2>
          {agents.length === 0 ? (
            <p className="muted">Nenhum agente ainda. Crie o primeiro ao lado.</p>
          ) : (
            <div className="stack">
              {agents.map((a) => (
                <div key={a.id} className="row-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {a.provider} / {a.model} · temp {a.temperature}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        onAssign(a, e.target.value);
                        e.target.value = '';
                      }}
                    >
                      <option value="">atribuir a coluna...</option>
                      {columns.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className={a.active ? 'danger' : 'ghost'}
                      onClick={() => onToggle(a)}
                      type="button"
                    >
                      {a.active ? 'Desligar' : 'Ligar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
