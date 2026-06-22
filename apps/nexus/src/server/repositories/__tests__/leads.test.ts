/**
 * Testa a mutação moveLeadColuna em modo mock (sem banco).
 * Restaura o estado da fixture ao final para não contaminar outros testes.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { OFFICE_ALMEIDA } from '@/db/ids';
import { moveLeadColuna } from '@/server/repositories/leads';
import { LEADS_MOCK } from '@/server/mocks/fixtures';

const LEAD_ID = 'l-almeida-1';
let original: string;

beforeAll(() => {
  process.env.NEXUS_USE_MOCKS = 'true';
  const lead = LEADS_MOCK[OFFICE_ALMEIDA].find((l) => l.id === LEAD_ID);
  original = lead!.colunaFunil;
});

afterAll(async () => {
  await moveLeadColuna(OFFICE_ALMEIDA, LEAD_ID, original as never);
});

describe('moveLeadColuna (mock)', () => {
  it('move o lead para a coluna informada', async () => {
    await moveLeadColuna(OFFICE_ALMEIDA, LEAD_ID, 'ganho');
    const lead = LEADS_MOCK[OFFICE_ALMEIDA].find((l) => l.id === LEAD_ID);
    expect(lead?.colunaFunil).toBe('ganho');
  });

  it('é no-op para lead inexistente (não lança)', async () => {
    await expect(moveLeadColuna(OFFICE_ALMEIDA, 'inexistente', 'novo')).resolves.toBeUndefined();
  });
});
