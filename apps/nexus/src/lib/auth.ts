/**
 * Better Auth — instância de autenticação do Nexus.
 *
 * Usa o Drizzle adapter sobre o schema de auth (user/session/account/verification).
 * Cada usuário carrega `officeId` (tenant), resolvido para o RLS em cada request
 * (ver office-context.ts).
 *
 * Em NEXUS_USE_MOCKS o login é dispensado e este módulo nem é carregado
 * (office-context faz import dinâmico só fora do modo mock).
 */
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';

import { appPool } from '@/db/client';
import * as authSchema from '@/db/auth-schema';

const db = drizzle(appPool, { schema: authSchema });

const options = {
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      officeId: { type: 'string', required: false, input: false },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
} satisfies BetterAuthOptions;

export const auth = betterAuth(options);

export type Session = typeof auth.$Infer.Session;
