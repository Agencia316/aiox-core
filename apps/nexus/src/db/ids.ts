/**
 * Identificadores fixos de tenants conhecidos.
 *
 * Mantidos fora de seed.ts porque seed.ts executa `main()` ao ser importado.
 * Estes UUIDs são reproduzíveis e usados por seed, mocks e testes.
 */
export const OFFICE_ALMEIDA = '11111111-1111-1111-1111-111111111111';
export const OFFICE_NAVES = '22222222-2222-2222-2222-222222222222';

/** Tenant usado como contexto padrão quando NEXUS_USE_MOCKS está ativo. */
export const DEMO_OFFICE_ID = OFFICE_ALMEIDA;
