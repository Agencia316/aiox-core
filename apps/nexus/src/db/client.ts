/**
 * Conexões com o PostgreSQL.
 *
 * - `db`      → pool da APLICAÇÃO (role `nexus_app`, sujeito a RLS). Use em
 *               runtime de request, sempre via `withTenant`.
 * - `adminDb` → pool privilegiado (owner) para migrate/seed. NUNCA usar em
 *               runtime de request — bypassa RLS.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '@/db/schema';

const appConnectionString = process.env.DATABASE_URL;
if (!appConnectionString) {
  throw new Error('DATABASE_URL não definido — configure o .env.local (ver .env.example)');
}

export const appPool = new Pool({ connectionString: appConnectionString });
export const db = drizzle(appPool, { schema });

/** Pool/owner usado apenas por migrate e seed. */
export function createAdminPool(): Pool {
  const adminConnectionString = process.env.DATABASE_ADMIN_URL ?? appConnectionString;
  return new Pool({ connectionString: adminConnectionString });
}

export { schema };
