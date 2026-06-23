/**
 * Repositório de Equipe & Plano: usuários (seats) e cobranças (Asaas).
 * Real → withTenant (RLS); mock → fixtures.
 */
import { asc, desc } from 'drizzle-orm';

import { cobrancas, users } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { CobrancaDTO, UsuarioDTO } from '@/server/dto';
import { COBRANCAS_MOCK, USUARIOS_MOCK } from '@/server/mocks/fixtures';

export async function listUsuarios(officeId: string): Promise<UsuarioDTO[]> {
  if (isMockMode()) {
    return USUARIOS_MOCK[officeId] ?? [];
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(users).orderBy(asc(users.createdAt));
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      role: r.role,
      createdAt: r.createdAt.toISOString(),
    }));
  });
}

export async function listCobrancas(officeId: string): Promise<CobrancaDTO[]> {
  if (isMockMode()) {
    return [...(COBRANCAS_MOCK[officeId] ?? [])].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(cobrancas).orderBy(desc(cobrancas.createdAt));
    return rows.map((r) => ({
      id: r.id,
      valor: Number(r.valor),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  });
}
