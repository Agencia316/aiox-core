/**
 * Acesso tipado a variáveis de ambiente relevantes ao backend.
 * Centraliza o toggle de mocks (§9 do briefing — integrações sem credencial).
 */

/** Quando true, repositórios e integrações usam fixtures/mocks (sem APIs reais). */
export function isMockMode(): boolean {
  // Default true: o ambiente de dev/demo roda sem Postgres nem credenciais.
  return (process.env.NEXUS_USE_MOCKS ?? 'true').toLowerCase() !== 'false';
}

/** Modelo Claude default para o assistente Caio (redação — alta qualidade). */
export function aiModel(): string {
  return process.env.NEXUS_AI_MODEL ?? 'claude-opus-4-5';
}

/** Modelo Claude para agentes de alto volume/baixo custo (recepção, resumo). */
export function aiModelFast(): string {
  return process.env.NEXUS_AI_MODEL_FAST ?? 'claude-haiku-4-5-20251001';
}
