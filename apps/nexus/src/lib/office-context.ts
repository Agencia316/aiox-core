/**
 * Resolve o tenant (office) do request atual.
 *
 * Em produção: lê a sessão do Better Auth e extrai `officeId` do usuário.
 * Em NEXUS_USE_MOCKS: retorna o escritório demo (Almeida & Rocha), permitindo
 * rodar a aplicação inteira sem banco nem login.
 *
 * Este é o ÚNICO ponto que decide o office_id de um request. Tudo abaixo
 * (repositórios → withTenant → RLS) confia nele.
 */
import { DEMO_OFFICE_ID } from '@/db/ids';
import { isMockMode } from '@/lib/env';

export interface OfficeContext {
  officeId: string;
  userId: string | null;
}

export async function getOfficeContext(headers: Headers): Promise<OfficeContext | null> {
  if (isMockMode()) {
    return { officeId: DEMO_OFFICE_ID, userId: 'demo-user' };
  }

  try {
    // Import dinâmico: evita carregar Better Auth/pg quando em modo mock.
    const { auth } = await import('@/lib/auth');
    const session = await auth.api.getSession({ headers });
    const user = session?.user as { id: string; officeId?: string } | undefined;

    if (!user?.officeId) {
      return null;
    }
    return { officeId: user.officeId, userId: user.id };
  } catch (error) {
    // Falha ao resolver sessão é tratada como não autenticado (fail-closed).
    console.error('Falha ao resolver contexto de office', { error });
    return null;
  }
}
