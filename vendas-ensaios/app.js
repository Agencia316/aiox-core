import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ===================== CONFIGURAÇÃO =====================
// Estes dados são públicos e seguros de expor (protegidos por RLS no banco).
const SUPABASE_URL = 'https://ziprirvpvlvxqjuseeyg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9qw6sKR8FEi3MyrC894iKA_yGnX-IS2';

const TIPOS_ENSAIO = [
  'Copa do Mundo Futebol',
  'Ensaio de Grávida',
  'Aniversário Infantil - Menino',
  'Aniversário Infantil - Menina',
  'Fotos Profissionais',
  'Restauração de Fotos Antigas',
  'Fotos 45+ Pessoais',
];

const CHART_COLORS = ['#7c3aed', '#2563eb', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#ca8a04', '#9333ea'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===================== ESTADO =====================
const state = {
  user: null,
  vendas: [],
  period: 'dia',
  tab: 'painel',
  editingId: null,
};
const charts = { evolucao: null, tipos: null };

// ===================== HELPERS =====================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtMoney = (n) => brl.format(Number(n) || 0);

function todayISO() {
  const d = new Date();
  return toISO(d);
}
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function weekStart(d) {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // 0 = segunda
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}
function monthName(i) {
  return ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][i];
}

function parseValor(str) {
  let s = String(str).trim().replace(/[^\d.,]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

function showToast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '');
  t.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { t.hidden = true; }, 2600);
}

// ===================== AUTENTICAÇÃO =====================
let authMode = 'login'; // 'login' | 'signup'

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === 'login';
  $('#auth-submit').textContent = isLogin ? 'Entrar' : 'Criar conta';
  $('#auth-toggle-text').textContent = isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?';
  $('#auth-toggle-btn').textContent = isLogin ? 'Criar conta' : 'Entrar';
  $('#auth-password').autocomplete = isLogin ? 'current-password' : 'new-password';
  setAuthMessage('');
}
function setAuthMessage(msg, type = '') {
  const el = $('#auth-message');
  el.textContent = msg;
  el.className = 'auth-message' + (type ? ' ' + type : '');
}

$('#auth-toggle-btn').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'signup' : 'login'));

$('#auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  const btn = $('#auth-submit');
  btn.disabled = true;
  setAuthMessage('Aguarde...', '');

  try {
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (data.session) {
        setAuthMessage('Conta criada!', 'success');
      } else {
        setAuthMessage('Conta criada! Verifique seu e-mail para confirmar e depois entre.', 'success');
        setAuthMode('login');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (err) {
    setAuthMessage(translateAuthError(err.message), 'error');
  } finally {
    btn.disabled = false;
  }
});

function translateAuthError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (verifique a caixa de entrada).';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Este e-mail já tem conta. Use "Entrar".';
  if (m.includes('password should be')) return 'A senha deve ter no mínimo 6 caracteres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um momento.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'E-mail inválido.';
  return msg || 'Não foi possível concluir. Tente novamente.';
}

$('#logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
});

supabase.auth.onAuthStateChange((_event, session) => {
  state.user = session?.user ?? null;
  if (state.user) enterApp();
  else exitApp();
});

function exitApp() {
  $('#app-view').hidden = true;
  $('#auth-view').style.display = '';
  $('#auth-form').reset();
}

async function enterApp() {
  $('#auth-view').style.display = 'none';
  $('#app-view').hidden = false;
  $('#user-email').textContent = state.user.email;
  await loadVendas();
}

// ===================== DADOS =====================
async function loadVendas() {
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .order('data_venda', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    showToast('Erro ao carregar vendas', true);
    console.error(error);
    return;
  }
  state.vendas = data || [];
  renderAll();
}

async function saveVenda(payload) {
  if (state.editingId) {
    const { error } = await supabase.from('vendas').update(payload).eq('id', state.editingId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('vendas').insert(payload);
    if (error) throw error;
  }
}

async function deleteVenda(id) {
  const { error } = await supabase.from('vendas').delete().eq('id', id);
  if (error) { showToast('Erro ao excluir', true); return; }
  await loadVendas();
  showToast('Venda excluída');
}

// ===================== RENDER =====================
function renderAll() {
  renderKPIs();
  renderEvolucao();
  renderTipos();
  renderRanking();
  renderLista();
}

function sum(arr) { return arr.reduce((a, v) => a + Number(v.valor), 0); }

function renderKPIs() {
  const hojeStr = todayISO();
  const ws = weekStart(new Date());
  const now = new Date();
  const mAtual = now.getMonth(), yAtual = now.getFullYear();

  const hoje = state.vendas.filter((v) => v.data_venda === hojeStr);
  const semana = state.vendas.filter((v) => parseISO(v.data_venda) >= ws);
  const mes = state.vendas.filter((v) => {
    const d = parseISO(v.data_venda);
    return d.getMonth() === mAtual && d.getFullYear() === yAtual;
  });

  $('#kpi-hoje').textContent = fmtMoney(sum(hoje));
  $('#kpi-hoje-qtd').textContent = `${hoje.length} ${hoje.length === 1 ? 'venda' : 'vendas'}`;
  $('#kpi-semana').textContent = fmtMoney(sum(semana));
  $('#kpi-semana-qtd').textContent = `${semana.length} ${semana.length === 1 ? 'venda' : 'vendas'}`;
  $('#kpi-mes').textContent = fmtMoney(sum(mes));
  $('#kpi-mes-qtd').textContent = `${mes.length} ${mes.length === 1 ? 'venda' : 'vendas'}`;

  const ticket = mes.length ? sum(mes) / mes.length : 0;
  $('#kpi-ticket').textContent = fmtMoney(ticket);
  $('#kpi-total').textContent = `Total geral: ${fmtMoney(sum(state.vendas))}`;
}

function buildSeries(period) {
  const labels = [], values = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (period === 'dia') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const iso = toISO(d);
      labels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
      values.push(sum(state.vendas.filter((v) => v.data_venda === iso)));
    }
  } else if (period === 'semana') {
    const start = weekStart(today);
    for (let i = 11; i >= 0; i--) {
      const ini = new Date(start); ini.setDate(ini.getDate() - i * 7);
      const fim = new Date(ini); fim.setDate(fim.getDate() + 7);
      labels.push(`${String(ini.getDate()).padStart(2, '0')}/${String(ini.getMonth() + 1).padStart(2, '0')}`);
      values.push(sum(state.vendas.filter((v) => { const d = parseISO(v.data_venda); return d >= ini && d < fim; })));
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(`${monthName(d.getMonth())}/${String(d.getFullYear()).slice(2)}`);
      values.push(sum(state.vendas.filter((v) => {
        const x = parseISO(v.data_venda);
        return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear();
      })));
    }
  }
  return { labels, values };
}

function renderEvolucao() {
  if (typeof Chart === 'undefined') return;
  const { labels, values } = buildSeries(state.period);
  const ctx = $('#chart-evolucao');
  if (charts.evolucao) charts.evolucao.destroy();
  charts.evolucao = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: '#7c3aed', borderRadius: 6, maxBarThickness: 38 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => fmtMoney(c.parsed.y) } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, font: { size: 10 } } },
        y: { beginAtZero: true, ticks: { callback: (v) => 'R$ ' + v } },
      },
    },
  });
}

function monthVendasByTipo() {
  const now = new Date();
  const mes = state.vendas.filter((v) => {
    const d = parseISO(v.data_venda);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const map = new Map();
  for (const v of mes) map.set(v.tipo_ensaio, (map.get(v.tipo_ensaio) || 0) + Number(v.valor));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function renderTipos() {
  if (typeof Chart === 'undefined') return;
  const entries = monthVendasByTipo();
  const ctx = $('#chart-tipos');
  if (charts.tipos) charts.tipos.destroy();
  if (!entries.length) {
    const c = ctx.getContext('2d');
    c.clearRect(0, 0, ctx.width, ctx.height);
    return;
  }
  charts.tipos = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map((e) => e[0]),
      datasets: [{ data: entries.map((e) => e[1]), backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, padding: 8 } },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${fmtMoney(c.parsed)}` } },
      },
    },
  });
}

function renderRanking() {
  const entries = monthVendasByTipo();
  const ul = $('#ranking-list');
  if (!entries.length) {
    ul.innerHTML = '<li class="empty">Nenhuma venda neste mês.</li>';
    return;
  }
  const max = entries[0][1];
  ul.innerHTML = entries.map(([nome, val]) => `
    <li>
      <div class="rk-top"><span class="rk-name">${esc(nome)}</span><span class="rk-val">${fmtMoney(val)}</span></div>
      <div class="rk-bar"><i style="width:${Math.max(4, (val / max) * 100)}%"></i></div>
    </li>`).join('');
}

function getFiltered() {
  const periodo = $('#filtro-periodo').value;
  const tipo = $('#filtro-tipo').value;
  const now = new Date();
  const ws = weekStart(now);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return state.vendas.filter((v) => {
    if (tipo !== 'todos' && v.tipo_ensaio !== tipo) return false;
    const d = parseISO(v.data_venda);
    if (periodo === 'hoje') return v.data_venda === todayISO();
    if (periodo === 'semana') return d >= ws;
    if (periodo === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (periodo === 'mes-ant') return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    return true;
  });
}

function renderLista() {
  const list = getFiltered();
  const cont = $('#vendas-list');
  $('#list-summary').textContent = `${list.length} ${list.length === 1 ? 'venda' : 'vendas'} · Total ${fmtMoney(sum(list))}`;
  if (!list.length) {
    cont.innerHTML = '<div class="empty">Nenhuma venda encontrada para este filtro.</div>';
    return;
  }
  cont.innerHTML = list.map((v) => {
    const d = parseISO(v.data_venda);
    const cliente = v.cliente ? esc(v.cliente) : '';
    const obs = v.observacoes ? ' · ' + esc(v.observacoes) : '';
    const meta = [cliente].filter(Boolean).join('') + obs;
    return `
      <div class="venda-item">
        <div class="venda-date"><span class="d">${String(d.getDate()).padStart(2, '0')}</span><span class="m">${monthName(d.getMonth())}</span></div>
        <div>
          <div class="venda-tipo">${esc(v.tipo_ensaio)}</div>
          <div class="venda-meta">${meta || '&nbsp;'}</div>
        </div>
        <div class="venda-valor">${fmtMoney(v.valor)}</div>
        <div class="venda-actions">
          <button class="icon-btn" data-edit="${v.id}" title="Editar" aria-label="Editar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
          </button>
          <button class="icon-btn danger" data-del="${v.id}" title="Excluir" aria-label="Excluir">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===================== FORMULÁRIO =====================
function fillTipoSelects() {
  const opts = TIPOS_ENSAIO.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  $('#venda-tipo').innerHTML = opts;
  $('#filtro-tipo').innerHTML = '<option value="todos">Todos</option>' + opts;
}

function resetForm() {
  state.editingId = null;
  $('#venda-form').reset();
  $('#venda-id').value = '';
  $('#venda-data').value = todayISO();
  $('#form-title').textContent = 'Nova venda';
  $('#form-submit').textContent = 'Salvar venda';
  $('#form-cancel').hidden = true;
  setFormMessage('');
}

function startEdit(id) {
  const v = state.vendas.find((x) => x.id === id);
  if (!v) return;
  state.editingId = id;
  $('#venda-id').value = id;
  $('#venda-data').value = v.data_venda;
  $('#venda-tipo').value = v.tipo_ensaio;
  $('#venda-valor').value = Number(v.valor).toFixed(2).replace('.', ',');
  $('#venda-cliente').value = v.cliente || '';
  $('#venda-obs').value = v.observacoes || '';
  $('#form-title').textContent = 'Editar venda';
  $('#form-submit').textContent = 'Salvar alterações';
  $('#form-cancel').hidden = false;
  setFormMessage('');
  switchTab('nova');
}

function setFormMessage(msg, type = '') {
  const el = $('#form-message');
  el.textContent = msg;
  el.className = 'form-message' + (type ? ' ' + type : '');
}

$('#venda-valor').addEventListener('blur', (e) => {
  const n = parseValor(e.target.value);
  if (!isNaN(n)) e.target.value = n.toFixed(2).replace('.', ',');
});

$('#form-cancel').addEventListener('click', () => { resetForm(); switchTab('vendas'); });

$('#venda-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const valor = parseValor($('#venda-valor').value);
  if (isNaN(valor) || valor < 0) { setFormMessage('Informe um valor válido.', 'error'); return; }

  const payload = {
    data_venda: $('#venda-data').value,
    tipo_ensaio: $('#venda-tipo').value,
    valor: valor,
    cliente: $('#venda-cliente').value.trim() || null,
    observacoes: $('#venda-obs').value.trim() || null,
  };
  if (!payload.data_venda) { setFormMessage('Informe a data.', 'error'); return; }

  const btn = $('#form-submit');
  btn.disabled = true;
  try {
    const editing = !!state.editingId;
    await saveVenda(payload);
    resetForm();
    await loadVendas();
    showToast(editing ? 'Venda atualizada' : 'Venda registrada');
    switchTab(editing ? 'vendas' : 'painel');
  } catch (err) {
    setFormMessage('Erro ao salvar: ' + (err.message || 'tente novamente'), 'error');
  } finally {
    btn.disabled = false;
  }
});

// Delegação de cliques na lista (editar/excluir)
$('#vendas-list').addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const delBtn = e.target.closest('[data-del]');
  if (editBtn) startEdit(editBtn.getAttribute('data-edit'));
  if (delBtn) {
    const id = delBtn.getAttribute('data-del');
    const v = state.vendas.find((x) => x.id === id);
    const label = v ? `${v.tipo_ensaio} (${fmtMoney(v.valor)})` : 'esta venda';
    if (confirm(`Excluir ${label}? Esta ação não pode ser desfeita.`)) deleteVenda(id);
  }
});

$('#filtro-periodo').addEventListener('change', renderLista);
$('#filtro-tipo').addEventListener('change', renderLista);

// ===================== EXPORTAR CSV =====================
$('#btn-export').addEventListener('click', () => {
  const list = getFiltered();
  if (!list.length) { showToast('Nada para exportar', true); return; }
  const header = ['Data', 'Tipo de ensaio', 'Valor', 'Cliente', 'Observações'];
  const rows = list.map((v) => [
    v.data_venda.split('-').reverse().join('/'),
    v.tipo_ensaio,
    Number(v.valor).toFixed(2).replace('.', ','),
    v.cliente || '',
    v.observacoes || '',
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vendas-ensaios-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado');
});

// ===================== ABAS =====================
function switchTab(tab) {
  state.tab = tab;
  $$('.tab-panel').forEach((p) => { p.hidden = p.id !== 'tab-' + tab; });
  $$('.nav-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  if (tab === 'nova' && !state.editingId) resetForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$$('.nav-btn').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

$$('.seg-btn').forEach((b) => b.addEventListener('click', () => {
  $$('.seg-btn').forEach((x) => x.classList.remove('is-active'));
  b.classList.add('is-active');
  state.period = b.dataset.period;
  renderEvolucao();
}));

// ===================== INIT =====================
fillTipoSelects();
resetForm();
setAuthMode('login');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
