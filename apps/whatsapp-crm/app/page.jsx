'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api } from '@/components/api-client';

export default function StatusPage() {
  const [status, setStatus] = useState(null);
  const [counts, setCounts] = useState(null);
  const [qrPng, setQrPng] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function refresh() {
    try {
      const [s, q] = await Promise.all([api.status(), api.qr()]);
      setStatus(s);
      if (q.qr && q.worker !== 'READY') {
        const dataUrl = await QRCode.toDataURL(q.qr, { width: 280, margin: 1 });
        setQrPng(dataUrl);
      } else {
        setQrPng(null);
      }
      const [convs, agents, board] = await Promise.all([
        api.conversations(),
        api.agents(),
        api.board(),
      ]);
      setCounts({
        conversations: convs.length,
        agents: agents.length,
        active_agents: agents.filter((a) => a.active).length,
        columns: board.length,
        cards: board.reduce((acc, c) => acc + (c.cards ? c.cards.length : 0), 0),
      });
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  async function onStart() {
    setBusy(true);
    setErr(null);
    try {
      await api.startWorker();
      await refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const workerPill =
    status?.worker === 'READY'
      ? 'green'
      : status?.worker === 'CONNECTING'
      ? 'yellow'
      : status?.worker === 'AUTH_FAILED' || status?.worker === 'DISCONNECTED'
      ? 'red'
      : 'blue';

  const canStart =
    status?.worker === 'IDLE' ||
    status?.worker === 'DISCONNECTED' ||
    status?.worker === 'AUTH_FAILED';

  return (
    <div className="stack">
      <h1 className="h1">Status do sistema</h1>
      {err && <div className="error">{err}</div>}

      <div className="grid-status">
        <div className="stat-card">
          <div className="label">Worker WhatsApp</div>
          <div className="value">
            <span className={`pill ${workerPill}`}>{status?.worker || '...'}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">OpenAI</div>
          <div className="value">
            <span className={`pill ${status?.openai_configured ? 'green' : 'red'}`}>
              {status?.openai_configured ? 'OK' : 'sem chave'}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Gemini</div>
          <div className="value">
            <span className={`pill ${status?.gemini_configured ? 'green' : 'red'}`}>
              {status?.gemini_configured ? 'OK' : 'sem chave'}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Conversas</div>
          <div className="value">{counts?.conversations ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Cards no Kanban</div>
          <div className="value">{counts?.cards ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="label">Agentes IA</div>
          <div className="value">
            {counts ? `${counts.active_agents} / ${counts.agents}` : '-'}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Conectar WhatsApp</h2>
        {status?.worker === 'READY' ? (
          <p className="success">WhatsApp conectado e pronto para enviar/receber mensagens.</p>
        ) : qrPng ? (
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <img
              src={qrPng}
              alt="WhatsApp QR Code"
              style={{ background: '#fff', padding: 12, borderRadius: 'var(--radius)' }}
            />
            <div className="stack" style={{ maxWidth: 360 }}>
              <p className="muted" style={{ margin: 0 }}>
                <b>1.</b> Abra o WhatsApp no seu celular
                <br />
                <b>2.</b> Toque em <i>Dispositivos conectados → Conectar um aparelho</i>
                <br />
                <b>3.</b> Aponte a câmera para o QR Code
              </p>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                Status: <span className={`pill ${workerPill}`}>{status?.worker}</span> · O QR
                expira em ~60s e é renovado automaticamente.
              </p>
            </div>
          </div>
        ) : status?.worker === 'CONNECTING' ? (
          <p className="muted">Aguardando QR Code...</p>
        ) : (
          <div className="stack">
            <p className="muted" style={{ margin: 0 }}>
              O worker está parado. Clique abaixo para iniciar e gerar o QR Code (alternativa: rode{' '}
              <code>npx whatsapp-crm qr</code> em um terminal).
            </p>
            <div>
              <button onClick={onStart} disabled={busy || !canStart} type="button">
                {busy ? 'Iniciando...' : 'Iniciar worker WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="h2">Caminhos</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--muted)', fontSize: 13 }}>
          <li>
            <b>DB:</b> <code>{status?.db_path || '...'}</code>
          </li>
          <li>
            <b>Sessão WhatsApp:</b> <code>{status?.session_path || '...'}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
