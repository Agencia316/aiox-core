'use server';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

import { appPool } from '@/db/client';
import * as authSchema from '@/db/auth-schema';
import type { Plano } from '@/lib/agentes';
import { auth } from '@/lib/auth';
import { isMockMode } from '@/lib/env';
import { criarOfficeComOwner } from '@/server/repositories/office';

export interface CriarContaInput {
  officeNome: string;
  oab: string;
  plano: Plano;
  nome: string;
  email: string;
  senha: string;
}

const PLANOS_VALIDOS: Plano[] = ['solo', 'essencial', 'avancado', 'elite'];

/**
 * Onboarding self-service: cria o escritório (tenant) + usuário owner de domínio,
 * cria a identidade de login (Better Auth) e vincula o officeId. O cliente faz
 * o sign-in em seguida.
 */
export async function criarContaAction(input: CriarContaInput): Promise<{ ok: true }> {
  if (isMockMode()) {
    throw new Error('Cadastro indisponível em modo demo (NEXUS_USE_MOCKS).');
  }

  const officeNome = input.officeNome.trim();
  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();

  if (!officeNome || !nome || !email || input.senha.length < 8) {
    throw new Error('Preencha todos os campos (senha com 8+ caracteres).');
  }
  const plano: Plano = PLANOS_VALIDOS.includes(input.plano) ? input.plano : 'solo';

  try {
    // 1) Identidade de login primeiro (valida unicidade do e-mail).
    await auth.api.signUpEmail({ body: { name: nome, email, password: input.senha } });

    // 2) Escritório + owner de domínio (RLS via withTenant).
    const officeId = await criarOfficeComOwner({
      nome: officeNome,
      oab: input.oab.trim() || 'OAB a definir',
      plano,
      ownerNome: nome,
      ownerEmail: email,
    });

    // 3) Vincula o tenant à identidade de login.
    const db = drizzle(appPool, { schema: authSchema });
    await db.update(authSchema.user).set({ officeId }).where(eq(authSchema.user.email, email));

    return { ok: true };
  } catch (error) {
    console.error('criarContaAction falhou', { email, error });
    throw new Error(
      `Falha ao criar conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    );
  }
}
