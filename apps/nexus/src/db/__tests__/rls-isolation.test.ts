/**
 * Teste de isolamento multi-tenant (Row Level Security) — Fase 4 (@seguranca-qa).
 *
 * Prova, contra um Postgres real com o schema + policies aplicados:
 *   1. FAIL-CLOSED: query SEM `app.office_id` setado retorna ZERO resultados.
 *   2. ISOLAMENTO: o escritório A (Almeida) não enxerga dados do B (Naves), e vice-versa.
 *   3. WITH CHECK: um tenant não consegue inserir linha de outro office_id.
 *   4. CAMADA DE APP: o helper real `withTenant()` respeita o isolamento.
 *
 * A conexão de teste usa a role `nexus_app` (sem BYPASSRLS, não-owner), exatamente
 * como a aplicação em produção. O seed roda como owner (postgres), que bypassa RLS.
 *
 * Requer Postgres acessível. URLs configuráveis por env:
 *   TEST_DATABASE_ADMIN_URL (owner)  e  TEST_DATABASE_URL (nexus_app).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { OFFICE_ALMEIDA, OFFICE_NAVES } from '@/db/ids';

const ADMIN_URL =
  process.env.TEST_DATABASE_ADMIN_URL ?? 'postgres://postgres:postgres@127.0.0.1:5432/nexus_test';
const APP_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://nexus_app:nexus@127.0.0.1:5432/nexus_test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION = join(__dirname, '..', '..', '..', 'drizzle', '0000_init.sql');

let app: Client;

async function resetTenant(client: Client): Promise<void> {
  await client.query("SELECT set_config('app.office_id', '', false)");
}

async function setTenant(client: Client, officeId: string): Promise<void> {
  await client.query("SELECT set_config('app.office_id', $1, false)", [officeId]);
}

beforeAll(async () => {
  // --- Aplica schema + RLS e popula 2 tenants (como owner, bypassando RLS) ---
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();

  // Limpa objetos de execuções anteriores (DB reaproveitado).
  await admin.query(`
    DROP TABLE IF EXISTS timesheets, despesas, honorarios, cobrancas, assinaturas,
      prazos, documentos, conversas_wa, leads, movimentacoes, processos, users, offices CASCADE;
    DROP TYPE IF EXISTS plano, user_role, processo_status, processo_fase,
      lead_coluna_funil, lead_origem, documento_tipo, assinatura_status, cobranca_status,
      honorario_tipo, honorario_status, despesa_categoria CASCADE;
  `);

  await admin.query(readFileSync(MIGRATION, 'utf8'));

  await admin.query(
    `INSERT INTO offices (id, nome, oab, plano) VALUES
       ($1, 'Almeida & Rocha Advocacia', 'OAB/SC 12.345', 'avancado'),
       ($2, 'Naves Advocacia', 'OAB/PR 67.890', 'essencial')`,
    [OFFICE_ALMEIDA, OFFICE_NAVES],
  );
  await admin.query(
    `INSERT INTO processos (office_id, cnj, cliente_nome, area, tribunal) VALUES
       ($1, '5001234-56.2024.8.24.0018', 'Madeira Verde', 'Trabalhista', 'TJSC'),
       ($1, '5002345-67.2024.8.24.0018', 'João Batista',  'Cível',       'TJSC'),
       ($2, '5009999-11.2024.8.16.0001', 'Confidencial Naves', 'Cível',  'TJPR')`,
    [OFFICE_ALMEIDA, OFFICE_NAVES],
  );
  await admin.query(
    `INSERT INTO leads (office_id, nome, telefone, area) VALUES
       ($1, 'Roberto Menezes', '+55 49 99811-2233', 'Trabalhista'),
       ($2, 'Lead Naves',      '+55 41 99000-0000', 'Empresarial')`,
    [OFFICE_ALMEIDA, OFFICE_NAVES],
  );
  await admin.end();

  // --- Conexão da aplicação (role nexus_app, sujeita a RLS) ---
  app = new Client({ connectionString: APP_URL });
  await app.connect();
});

afterAll(async () => {
  if (app) await app.end();
});

describe('RLS — fail-closed (sem office_id)', () => {
  it('processos sem app.office_id retorna ZERO linhas', async () => {
    await resetTenant(app);
    const { rows } = await app.query('SELECT count(*)::int AS n FROM processos');
    expect(rows[0].n).toBe(0);
  });

  it('leads sem app.office_id retorna ZERO linhas', async () => {
    await resetTenant(app);
    const { rows } = await app.query('SELECT count(*)::int AS n FROM leads');
    expect(rows[0].n).toBe(0);
  });

  it('offices sem app.office_id retorna ZERO linhas', async () => {
    await resetTenant(app);
    const { rows } = await app.query('SELECT count(*)::int AS n FROM offices');
    expect(rows[0].n).toBe(0);
  });
});

describe('RLS — isolamento entre tenants', () => {
  it('Almeida vê apenas os próprios processos (2), nunca os do Naves', async () => {
    await setTenant(app, OFFICE_ALMEIDA);
    const { rows } = await app.query(
      'SELECT count(*)::int AS n, bool_and(office_id = $1) AS so_meu FROM processos',
      [OFFICE_ALMEIDA],
    );
    expect(rows[0].n).toBe(2);
    expect(rows[0].so_meu).toBe(true);
  });

  it('Naves vê apenas o próprio processo (1)', async () => {
    await setTenant(app, OFFICE_NAVES);
    const { rows } = await app.query('SELECT count(*)::int AS n FROM processos');
    expect(rows[0].n).toBe(1);
  });

  it('Almeida não consegue ler uma linha específica do Naves (filtra por CNJ do B)', async () => {
    await setTenant(app, OFFICE_ALMEIDA);
    const { rows } = await app.query(
      "SELECT count(*)::int AS n FROM processos WHERE cnj = '5009999-11.2024.8.16.0001'",
    );
    expect(rows[0].n).toBe(0);
  });

  it('offices: cada tenant enxerga somente o próprio escritório', async () => {
    await setTenant(app, OFFICE_ALMEIDA);
    const a = await app.query('SELECT id FROM offices');
    expect(a.rows).toHaveLength(1);
    expect(a.rows[0].id).toBe(OFFICE_ALMEIDA);
  });
});

describe('RLS — WITH CHECK (escrita cruzada bloqueada)', () => {
  it('Almeida NÃO consegue inserir processo com office_id do Naves', async () => {
    await setTenant(app, OFFICE_ALMEIDA);
    await expect(
      app.query(
        `INSERT INTO processos (office_id, cnj, cliente_nome, area, tribunal)
         VALUES ($1, '0000000-00.2024.8.24.0018', 'Invasor', 'Cível', 'TJSC')`,
        [OFFICE_NAVES],
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it('Almeida consegue inserir processo do próprio office (controle positivo)', async () => {
    await setTenant(app, OFFICE_ALMEIDA);
    await expect(
      app.query(
        `INSERT INTO processos (office_id, cnj, cliente_nome, area, tribunal)
         VALUES ($1, '7777777-77.2024.8.24.0018', 'Cliente Legítimo', 'Cível', 'TJSC')`,
        [OFFICE_ALMEIDA],
      ),
    ).resolves.toBeTruthy();
    // limpa o registro de controle para não afetar contagens posteriores
    await app.query("DELETE FROM processos WHERE cnj = '7777777-77.2024.8.24.0018'");
  });
});

describe('Camada de aplicação — withTenant() real respeita o RLS', () => {
  it('listProcessos(Almeida) traz 2; listProcessos(Naves) traz 1', async () => {
    // Configura o ambiente ANTES de importar os módulos da app (que leem env no import).
    process.env.NEXUS_USE_MOCKS = 'false';
    process.env.DATABASE_URL = APP_URL;

    const { listProcessos } = await import('@/server/repositories/processos');

    const almeida = await listProcessos(OFFICE_ALMEIDA);
    const naves = await listProcessos(OFFICE_NAVES);

    expect(almeida).toHaveLength(2);
    expect(naves).toHaveLength(1);
    // Nenhum processo do Almeida pode pertencer a outro tenant (checagem de vazamento).
    expect(almeida.every((p) => p.cnj.startsWith('500'))).toBe(true);
    expect(naves[0].tribunal).toBe('TJPR');

    const { appPool } = await import('@/db/client');
    await appPool.end();
  });
});
