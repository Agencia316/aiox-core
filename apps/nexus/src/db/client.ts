/**
 * Conexões com o PostgreSQL.
 *
 * - `db`      → pool da APLICAÇÃO (role `nexus_app`, sujeito a RLS). Use em
 *               runtime de request, sempre via `withTenant`.
 * - `adminDb` → pool privilegiado (owner) para migrate/seed. NUNCA usar em
 *               runtime de request — bypassa RLS.
 *
 * O pool é construído sem conectar: o pg só abre conexão na primeira query.
 * Em NEXUS_USE_MOCKS nenhuma query roda, então DATABASE_URL é opcional ali.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '@/db/schema';

const appConnectionString = process.env.DATABASE_URL;
if (!appConnectionString && (process.env.NEXUS_USE_MOCKS ?? 'true').toLowerCase() === 'false') {
  // Só é fatal quando não estamos em modo mock (i.e. a app vai mesmo consultar o banco).
  throw new Error('DATABASE_URL não definido — configure o .env.local (ver .env.example)');
}

export const appPool = new Pool(
  appConnectionString ? { connectionString: appConnectionString } : {},
);
export const db = drizzle(appPool, { schema });

/** Pool/owner usado apenas por migrate e seed. */
export function createAdminPool(): Pool {
  const adminConnectionString = process.env.DATABASE_ADMIN_URL ?? appConnectionString;
  if (!adminConnectionString) {
    throw new Error('DATABASE_ADMIN_URL/DATABASE_URL não definido para migrate/seed');
  }
  return new Pool({ connectionString: adminConnectionString });
}

export { schema };
