// Placeholder da Fase 2. A Fase 3 (@frontend) substitui por redirect para
// /dashboard e constrói as páginas dos 13 módulos.
export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Nexus — backend ativo</h1>
      <p>Endpoints mockados disponíveis (contexto de office resolvido por request):</p>
      <ul>
        <li><code>GET /api/dashboard</code></li>
        <li><code>GET /api/processos</code></li>
        <li><code>GET /api/leads</code></li>
        <li><code>GET /api/movimentacoes</code></li>
      </ul>
      <p>UI temática (sidebar + Dashboard) chega na Fase 3.</p>
    </main>
  );
}
