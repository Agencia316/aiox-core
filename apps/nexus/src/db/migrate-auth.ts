/**
 * Aplica a migração das tabelas do Better Auth (0001_auth.sql) como owner.
 * Idempotente (CREATE TABLE IF NOT EXISTS). Uso: `npm run db:migrate:auth`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAdminPool } from '@/db/client';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const sqlPath = join(__dirname, '..', '..', 'drizzle', '0001_auth.sql');
  const ddl = readFileSync(sqlPath, 'utf8');
  const pool = createAdminPool();
  try {
    await pool.query(ddl);
    console.log('✓ Migração 0001_auth aplicada (tabelas Better Auth).');
  } catch (error) {
    console.error('✗ Falha ao aplicar migração de auth', { error });
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(() => process.exit(1));
