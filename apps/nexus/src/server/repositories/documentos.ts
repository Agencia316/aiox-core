/**
 * Repositório de documentos jurídicos. Real → withTenant (RLS); mock → fixtures.
 * `listDocumentos` retorna resumo (preview do conteúdo); `getDocumento` retorna inteiro.
 */
import { desc, eq } from 'drizzle-orm';

import { documentos } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { DocumentoDTO, DocumentoResumo } from '@/server/dto';
import { DOCUMENTOS_MOCK } from '@/server/mocks/fixtures';

function previewFrom(conteudo: string): string {
  // Primeiras 140 chars sem múltiplos espaços/quebras.
  return conteudo.replace(/\s+/g, ' ').trim().slice(0, 140);
}

export async function listDocumentos(officeId: string): Promise<DocumentoResumo[]> {
  if (isMockMode()) {
    return (DOCUMENTOS_MOCK[officeId] ?? [])
      .map((d) => ({
        id: d.id,
        processoId: d.processoId,
        titulo: d.titulo,
        tipo: d.tipo,
        criadoPorIa: d.criadoPorIa,
        createdAt: d.createdAt,
        preview: previewFrom(d.conteudo),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx.select().from(documentos).orderBy(desc(documentos.createdAt));
    return rows.map((r) => ({
      id: r.id,
      processoId: r.processoId,
      titulo: r.titulo,
      tipo: r.tipo,
      criadoPorIa: r.criadoPorIa,
      createdAt: r.createdAt.toISOString(),
      preview: previewFrom(r.conteudo),
    }));
  });
}

export async function getDocumento(officeId: string, id: string): Promise<DocumentoDTO | null> {
  if (isMockMode()) {
    return DOCUMENTOS_MOCK[officeId]?.find((d) => d.id === id) ?? null;
  }

  return withTenant(officeId, async (tx) => {
    const [row] = await tx.select().from(documentos).where(eq(documentos.id, id)).limit(1);
    if (!row) return null;
    return {
      id: row.id,
      processoId: row.processoId,
      titulo: row.titulo,
      conteudo: row.conteudo,
      tipo: row.tipo,
      criadoPorIa: row.criadoPorIa,
      createdAt: row.createdAt.toISOString(),
    };
  });
}
