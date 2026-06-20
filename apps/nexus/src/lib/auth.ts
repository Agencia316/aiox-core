/**
 * Better Auth — instância de autenticação do Nexus.
 *
 * Cada usuário carrega `officeId` (tenant) como campo adicional, resolvido para
 * o contexto de RLS em cada request (ver office-context.ts).
 *
 * NOTA: as tabelas próprias do Better Auth (user/session/account/verification)
 * são geradas pelo CLI do Better Auth (`npx @better-auth/cli generate`) numa
 * migração dedicada. Em NEXUS_USE_MOCKS o login é stubado e o banco não é
 * necessário — por isso a instância é criada preguiçosamente.
 */
import { betterAuth, type BetterAuthOptions } from 'better-auth';

import { appPool } from '@/db/client';

const options = {
  database: appPool,
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      officeId: { type: 'string', required: true, input: false },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
} satisfies BetterAuthOptions;

export const auth = betterAuth(options);

export type Session = typeof auth.$Infer.Session;
