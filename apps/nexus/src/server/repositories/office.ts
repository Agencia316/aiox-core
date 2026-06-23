/**
 * Perfil do escritório atual + usuário (para o app shell).
 * Real → withTenant (RLS); mock → derivado das fixtures de tenant.
 */
import { randomUUID } from 'node:crypto';

import { asc, eq } from 'drizzle-orm';

import { OFFICE_ALMEIDA, OFFICE_NAVES } from '@/db/ids';
import { offices, users } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { Plano } from '@/lib/agentes';

export interface OfficeProfile {
  nome: string;
  plano: string;
  usuarioNome: string;
}

export interface NovaConta {
  nome: string;
  oab: string;
  plano: Plano;
  ownerNome: string;
  ownerEmail: string;
}

/**
 * Cria um novo escritório (tenant) + usuário owner. Pré-gera o officeId e roda
 * dentro de withTenant — assim o WITH CHECK do RLS (id/office_id = app.office_id)
 * é satisfeito sem bypassar a policy.
 */
export async function criarOfficeComOwner(input: NovaConta): Promise<string> {
  const officeId = randomUUID();
  await withTenant(officeId, async (tx) => {
    await tx
      .insert(offices)
      .values({ id: officeId, nome: input.nome, oab: input.oab, plano: input.plano });
    await tx.insert(users).values({
      officeId,
      nome: input.ownerNome,
      email: input.ownerEmail,
      role: 'owner',
    });
  });
  return officeId;
}

const PROFILE_MOCK: Record<string, OfficeProfile> = {
  [OFFICE_ALMEIDA]: {
    nome: 'Almeida & Rocha Advocacia',
    plano: 'avancado',
    usuarioNome: 'Dra. Carolina Almeida',
  },
  [OFFICE_NAVES]: {
    nome: 'Naves Advocacia',
    plano: 'essencial',
    usuarioNome: 'Dr. Henrique Naves',
  },
};

export async function getOfficeProfile(officeId: string): Promise<OfficeProfile> {
  if (isMockMode()) {
    return (
      PROFILE_MOCK[officeId] ?? { nome: 'Escritório', plano: 'solo', usuarioNome: 'Usuário' }
    );
  }

  return withTenant(officeId, async (tx) => {
    const [office] = await tx.select().from(offices).where(eq(offices.id, officeId)).limit(1);
    const [user] = await tx.select().from(users).orderBy(asc(users.createdAt)).limit(1);
    return {
      nome: office?.nome ?? 'Escritório',
      plano: office?.plano ?? 'solo',
      usuarioNome: user?.nome ?? 'Usuário',
    };
  });
}
