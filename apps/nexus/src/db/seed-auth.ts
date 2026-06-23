/**
 * Seed de identidades de login (Better Auth). Cria usuários demo com senha e
 * vincula cada um ao seu escritório (office_id).
 *
 * Requer NEXUS_USE_MOCKS=false, DATABASE_URL (app) e BETTER_AUTH_SECRET.
 * Uso: `npm run db:seed:auth`.
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

import { appPool } from '@/db/client';
import * as authSchema from '@/db/auth-schema';
import { OFFICE_ALMEIDA, OFFICE_NAVES } from '@/db/ids';
import { auth } from '@/lib/auth';

interface SeedUser {
  nome: string;
  email: string;
  senha: string;
  officeId: string;
}

const USERS: SeedUser[] = [
  {
    nome: 'Dra. Carolina Almeida',
    email: 'carolina@almeidarocha.adv.br',
    senha: 'nexus1234',
    officeId: OFFICE_ALMEIDA,
  },
  {
    nome: 'Dr. Marcelo Rocha',
    email: 'marcelo@almeidarocha.adv.br',
    senha: 'nexus1234',
    officeId: OFFICE_ALMEIDA,
  },
  {
    nome: 'Dr. Henrique Naves',
    email: 'henrique@naves.adv.br',
    senha: 'nexus1234',
    officeId: OFFICE_NAVES,
  },
];

async function main(): Promise<void> {
  const db = drizzle(appPool, { schema: authSchema });

  for (const u of USERS) {
    try {
      await auth.api.signUpEmail({ body: { name: u.nome, email: u.email, password: u.senha } });
      // officeId é input:false — definimos diretamente após o cadastro.
      await db
        .update(authSchema.user)
        .set({ officeId: u.officeId })
        .where(eq(authSchema.user.email, u.email));
      console.log(`✓ ${u.email} → office ${u.officeId.slice(0, 8)}…`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'erro';
      console.log(`• ${u.email} ignorado (${msg})`);
    }
  }

  await appPool.end();
  console.log('Seed de auth concluído. Senha demo: nexus1234');
}

main().catch((error) => {
  console.error('Falha no seed de auth', { error });
  process.exit(1);
});
