/**
 * Aplica a migração inicial (schema + RLS) usando a conexão de owner.
 * Idempotência: a 0000_init.sql usa CREATE EXTENSION IF NOT EXISTS e DO-block
 * para a role; as tabelas/types não são guardados — rode contra um DB limpo.
 *
 * Uso: `npm run db:migrate` (lê DATABASE_ADMIN_URL).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAdminPool } from '@/db/client';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const sqlPath = join(__dirname, '..', '..', 'drizzle', '0000_init.sql');
  const ddl = readFileSync(sqlPath, 'utf8');

  const pool = createAdminPool();
  try {
    await pool.query(ddl);
    console.log('✓ Migração 0000_init aplicada (schema + RLS).');
  } catch (error) {
    console.error('✗ Falha ao aplicar migração', { error });
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(() => process.exit(1));
