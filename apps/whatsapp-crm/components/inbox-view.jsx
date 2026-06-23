'use client';

import { useEffect, useState } from 'react';
import { api } from '@/components/api-client';

export default function InboxView() {
  const [convs, setConvs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [draft, setDraft] = useState('');
  const [agents, setAgents] = useState([]);
  const [chosenAgent, setChosenAgent] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function loadConvs() {
    try {
      const data = await api.conversations();
      setConvs(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function loadMsgs(id) {
    try {
      const data = await api.messages(id);
      setMsgs(data);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    loadConvs();
    api
      .agents()
      .then((a) => {
        const active = a.filter((x) => x.active);
        setAgents(active);
        if (active[0]) setChosenAgent(String(active[0].id));
      })
      .catch((e) => setErr(e.message));
    const t = setInterval(loadConvs, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected) loadMsgs(selected.id);
  }, [selected]);

  async function onSend() {
    if (!selected || !draft.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await api.send(selected.phone, draft.trim());
      setDraft('');
      await loadMsgs(selected.id);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSuggest() {
    if (!selected || !chosenAgent) return;
    setBusy(true);
    setErr(null);
    try {
      const { reply } = await api.suggestReply(chosenAgent, selected.id);
      setDraft(reply || '');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h1 className="h1">Inbox</h1>
      {err && <div className="error">{err}</div>}
      <div className="inbox">
        <div className="list">
          {convs.length === 0 && (
            <div style={{ padding: 16 }} className="muted">
              Sem conversas. Quando o worker estiver conectado e chegar a primeira mensagem, ela
              aparecerá aqui.
            </div>
          )}
          {convs.map((c) => (
            <div
              key={c.id}
              className={`item ${selected?.id === c.id ? 'active' : ''}`}
              onClick={() => setSelected(c)}
            >
              <div className="name">{c.contact_name || c.phone}</div>
              <div className="preview">{c.last_body || '(sem mensagens)'}</div>
            </div>
          ))}
        </div>

        <div className="thread">
          {!selected ? (
            <div style={{ padding: 24 }} className="muted">
              Selecione uma conversa.
            </div>
          ) : (
            <>
              <div className="msgs">
                {msgs.map((m) => (
                  <div key={m.id} className={`bubble ${m.direction === 'inbound' ? 'in' : 'out'}`}>
                    {m.body || `[${m.media_type || 'media'}]`}
                    <span className="ts">{m.created_at}</span>
                  </div>
                ))}
                {msgs.length === 0 && <div className="muted">(sem mensagens ainda)</div>}
              </div>
              <div className="composer">
                <select
                  value={chosenAgent}
                  onChange={(e) => setChosenAgent(e.target.value)}
                  style={{ width: 200 }}
                >
                  <option value="">— agente IA —</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.provider})
                    </option>
                  ))}
                </select>
                <button
                  className="ghost"
                  onClick={onSuggest}
                  disabled={busy || !chosenAgent}
                  type="button"
                >
                  Sugerir
                </button>
                <textarea
                  placeholder="Digite uma resposta..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button onClick={onSend} disabled={busy || !draft.trim()} type="button">
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
