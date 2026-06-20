/**
 * Endpoint do Better Auth (login, logout, sessão, etc).
 * Import dinâmico para não carregar pg/better-auth em modo mock.
 */
import type { NextRequest } from 'next/server';

async function handler(request: NextRequest): Promise<Response> {
  const { auth } = await import('@/lib/auth');
  const { toNextJsHandler } = await import('better-auth/next-js');
  const { GET, POST } = toNextJsHandler(auth);
  return request.method === 'GET' ? GET(request) : POST(request);
}

export const GET = handler;
export const POST = handler;
