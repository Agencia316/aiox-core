import type { NextRequest } from 'next/server';

import { getOfficeContext } from '@/lib/office-context';
import { errorMessage, ok, serverError, unauthorized } from '@/lib/http';
import { listMovimentacoes } from '@/server/repositories/movimentacoes';

// Rota dependente do tenant resolvido por request — nunca estática.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getOfficeContext(request.headers);
    if (!ctx) {
      return unauthorized();
    }
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : 20;
    const data = await listMovimentacoes(ctx.officeId, limit);
    return ok(data);
  } catch (error) {
    console.error('GET /api/movimentacoes falhou', { error });
    return serverError(`Falha ao listar movimentações: ${errorMessage(error)}`);
  }
}
