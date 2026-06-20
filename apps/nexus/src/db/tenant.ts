/**
 * Escopo de tenant via Row Level Security.
 *
 * `withTenant` abre uma transação e seta `app.office_id` com `set_config(..., true)`
 * (escopo de transação). Todas as queries dentro do callback enxergam apenas as
 * linhas do escritório informado — o filtro vive no banco (RLS), não na query.
 *
 * Princípio: a aplicação NUNCA adiciona `WHERE office_id = ...` manualmente.
 * Se `withTenant` não for usado, as policies retornam ZERO linhas (fail-closed).
 */
import { sql } from 'drizzle-orm';

import { db } from '@/db/client';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function withTenant<T>(officeId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!officeId || !UUID_RE.test(officeId)) {
    throw new Error(`withTenant: officeId inválido (esperado UUID): ${String(officeId)}`);
  }

  return db.transaction(async (tx) => {
    // is_local = true → válido apenas nesta transação. Parametrizado (sem
    // interpolação de string) para evitar injeção.
    await tx.execute(sql`select set_config('app.office_id', ${officeId}, true)`);
    return fn(tx);
  });
}
