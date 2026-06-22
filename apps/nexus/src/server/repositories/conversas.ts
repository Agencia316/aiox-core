/**
 * Repositório de conversas de WhatsApp.
 *
 * Em produção (Evolution API): mensagens chegam por webhook e são gravadas em
 * `conversas_wa` como JSONB. Caio responde via `sendMessage` do cliente
 * Evolution (ver @/server/integrations/evolution). Aqui só consultamos.
 *
 * No modo mock: lê das fixtures (CONVERSAS_MOCK).
 */
import { desc, eq } from 'drizzle-orm';

import { conversasWa, leads } from '@/db/schema';
import { withTenant } from '@/db/tenant';
import { isMockMode } from '@/lib/env';
import type { ConversaDTO, ConversaResumo, MensagemWA } from '@/server/dto';
import { CONVERSAS_MOCK } from '@/server/mocks/fixtures';

function ultimaMensagem(msgs: MensagemWA[]): MensagemWA | null {
  if (msgs.length === 0) return null;
  return msgs.reduce((max, m) => (m.em > max.em ? m : max), msgs[0]);
}

function toResumo(c: ConversaDTO): ConversaResumo {
  return {
    id: c.id,
    leadId: c.leadId,
    leadNome: c.leadNome,
    leadTelefone: c.leadTelefone,
    ultimaMensagem: ultimaMensagem(c.mensagens),
    totalMensagens: c.mensagens.length,
  };
}

export async function listConversas(officeId: string): Promise<ConversaResumo[]> {
  if (isMockMode()) {
    const all = CONVERSAS_MOCK[officeId] ?? [];
    return all
      .map(toResumo)
      .sort((a, b) =>
        (b.ultimaMensagem?.em ?? '').localeCompare(a.ultimaMensagem?.em ?? ''),
      );
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx
      .select({
        id: conversasWa.id,
        leadId: conversasWa.leadId,
        leadNome: leads.nome,
        leadTelefone: leads.telefone,
        mensagens: conversasWa.mensagens,
        createdAt: conversasWa.createdAt,
      })
      .from(conversasWa)
      .innerJoin(leads, eq(conversasWa.leadId, leads.id))
      .orderBy(desc(conversasWa.createdAt));

    return rows.map((r) => {
      const msgs = (r.mensagens as MensagemWA[]) ?? [];
      const last = ultimaMensagem(msgs);
      return {
        id: r.id,
        leadId: r.leadId,
        leadNome: r.leadNome,
        leadTelefone: r.leadTelefone,
        ultimaMensagem: last,
        totalMensagens: msgs.length,
      };
    });
  });
}

/**
 * Acrescenta uma mensagem à conversa de um lead. Real → read-modify-write do
 * jsonb via withTenant (RLS); mock → push na fixture.
 */
export async function appendMensagem(
  officeId: string,
  leadId: string,
  mensagem: MensagemWA,
): Promise<void> {
  if (isMockMode()) {
    const conversa = (CONVERSAS_MOCK[officeId] ?? []).find((c) => c.leadId === leadId);
    if (!conversa) {
      throw new Error('Conversa não encontrada para o lead');
    }
    conversa.mensagens.push(mensagem);
    return;
  }

  await withTenant(officeId, async (tx) => {
    const [row] = await tx
      .select({ id: conversasWa.id, mensagens: conversasWa.mensagens })
      .from(conversasWa)
      .where(eq(conversasWa.leadId, leadId))
      .limit(1);
    if (!row) {
      throw new Error('Conversa não encontrada para o lead');
    }
    const atualizadas = [...(row.mensagens as MensagemWA[]), mensagem];
    await tx.update(conversasWa).set({ mensagens: atualizadas }).where(eq(conversasWa.id, row.id));
  });
}

export async function getConversaByLead(
  officeId: string,
  leadId: string,
): Promise<ConversaDTO | null> {
  if (isMockMode()) {
    return CONVERSAS_MOCK[officeId]?.find((c) => c.leadId === leadId) ?? null;
  }

  return withTenant(officeId, async (tx) => {
    const rows = await tx
      .select({
        id: conversasWa.id,
        leadId: conversasWa.leadId,
        leadNome: leads.nome,
        leadTelefone: leads.telefone,
        leadArea: leads.area,
        leadScore: leads.score,
        mensagens: conversasWa.mensagens,
      })
      .from(conversasWa)
      .innerJoin(leads, eq(conversasWa.leadId, leads.id))
      .where(eq(conversasWa.leadId, leadId))
      .limit(1);

    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      leadId: r.leadId,
      leadNome: r.leadNome,
      leadTelefone: r.leadTelefone,
      leadArea: r.leadArea,
      leadScore: r.leadScore,
      mensagens: (r.mensagens as MensagemWA[]) ?? [],
    };
  });
}
