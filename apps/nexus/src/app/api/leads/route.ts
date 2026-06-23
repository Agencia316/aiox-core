import type { NextRequest } from 'next/server';

import { getOfficeContext } from '@/lib/office-context';
import { errorMessage, ok, serverError, unauthorized } from '@/lib/http';
import { listLeads } from '@/server/repositories/leads';

// Rota dependente do tenant resolvido por request — nunca estática.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getOfficeContext(request.headers);
    if (!ctx) {
      return unauthorized();
    }
    const data = await listLeads(ctx.officeId);
    return ok(data);
  } catch (error) {
    console.error('GET /api/leads falhou', { error });
    return serverError(`Falha ao listar leads: ${errorMessage(error)}`);
  }
}
