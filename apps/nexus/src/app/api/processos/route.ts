import type { NextRequest } from 'next/server';

import { getOfficeContext } from '@/lib/office-context';
import { errorMessage, ok, serverError, unauthorized } from '@/lib/http';
import { listProcessos } from '@/server/repositories/processos';

// Rota dependente do tenant resolvido por request — nunca estática.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getOfficeContext(request.headers);
    if (!ctx) {
      return unauthorized();
    }
    const data = await listProcessos(ctx.officeId);
    return ok(data);
  } catch (error) {
    console.error('GET /api/processos falhou', { error });
    return serverError(`Falha ao listar processos: ${errorMessage(error)}`);
  }
}
