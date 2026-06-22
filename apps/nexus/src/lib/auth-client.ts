'use client';

/**
 * Cliente do Better Auth para o browser. O baseURL é inferido da origem atual;
 * usa o endpoint /api/auth/[...all].
 */
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
