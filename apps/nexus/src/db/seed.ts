/**
 * Seed de dados. Roda como owner (DATABASE_ADMIN_URL) e bypassa RLS para
 * popular múltiplos escritórios.
 *
 * Tenant principal (demo das apresentações): Almeida & Rocha Advocacia,
 * Dra. Carolina Almeida — Caçador/SC. 3 usuários, 5 processos, 6 leads.
 *
 * Tenant secundário: Naves Advocacia — existe apenas para validar isolamento
 * multi-tenant (escritório A não enxerga dados do B). Ver teste de RLS.
 */
import { drizzle } from 'drizzle-orm/node-postgres';

import { createAdminPool } from '@/db/client';
import { OFFICE_ALMEIDA, OFFICE_NAVES } from '@/db/ids';
import * as schema from '@/db/schema';

async function main(): Promise<void> {
  const pool = createAdminPool();
  const db = drizzle(pool, { schema });

  try {
    // Limpeza idempotente (cascata cobre as tabelas filhas).
    await db.delete(schema.offices);

    // -------------------------------------------------------------------------
    // Tenant 1 — Almeida & Rocha Advocacia (demo)
    // -------------------------------------------------------------------------
    await db.insert(schema.offices).values({
      id: OFFICE_ALMEIDA,
      nome: 'Almeida & Rocha Advocacia',
      oab: 'OAB/SC 12.345',
      plano: 'avancado',
    });

    await db.insert(schema.users).values([
      {
        officeId: OFFICE_ALMEIDA,
        nome: 'Dra. Carolina Almeida',
        email: 'carolina@almeidarocha.adv.br',
        role: 'owner',
      },
      {
        officeId: OFFICE_ALMEIDA,
        nome: 'Dr. Marcelo Rocha',
        email: 'marcelo@almeidarocha.adv.br',
        role: 'advogado',
      },
      {
        officeId: OFFICE_ALMEIDA,
        nome: 'Juliana Prado',
        email: 'juliana@almeidarocha.adv.br',
        role: 'secretaria',
      },
    ]);

    const processosAlmeida = await db
      .insert(schema.processos)
      .values([
        {
          officeId: OFFICE_ALMEIDA,
          cnj: '5001234-56.2024.8.24.0018',
          clienteNome: 'Indústria Madeira Verde Ltda.',
          area: 'Trabalhista',
          tribunal: 'TJSC',
          status: 'ativo',
          fase: 'conhecimento',
          valorCausa: '85000.00',
        },
        {
          officeId: OFFICE_ALMEIDA,
          cnj: '5002345-67.2024.8.24.0018',
          clienteNome: 'João Batista dos Santos',
          area: 'Cível',
          tribunal: 'TJSC',
          status: 'ativo',
          fase: 'recursal',
          valorCausa: '32000.00',
        },
        {
          officeId: OFFICE_ALMEIDA,
          cnj: '5003456-78.2023.8.24.0018',
          clienteNome: 'Cooperativa Agro Caçador',
          area: 'Empresarial',
          tribunal: 'TJSC',
          status: 'ativo',
          fase: 'execucao',
          valorCausa: '240000.00',
        },
        {
          officeId: OFFICE_ALMEIDA,
          cnj: '5004567-89.2024.8.24.0018',
          clienteNome: 'Maria Aparecida Lima',
          area: 'Família',
          tribunal: 'TJSC',
          status: 'suspenso',
          fase: 'conhecimento',
          valorCausa: '15000.00',
        },
        {
          officeId: OFFICE_ALMEIDA,
          cnj: '5005678-90.2022.8.24.0018',
          clienteNome: 'Transportes Planalto S/A',
          area: 'Tributário',
          tribunal: 'TJSC',
          status: 'arquivado',
          fase: 'cumprimento',
          valorCausa: '410000.00',
        },
      ])
      .returning({ id: schema.processos.id });

    // Movimentações (com resumo da IA — Agente Resumo) para os 2 primeiros.
    await db.insert(schema.movimentacoes).values([
      {
        officeId: OFFICE_ALMEIDA,
        processoId: processosAlmeida[0].id,
        data: new Date('2026-06-12T13:30:00Z'),
        titulo: 'Audiência de instrução designada',
        resumoIa:
          'O juiz marcou audiência para 14/07. É preciso arrolar testemunhas até 5 dias antes.',
      },
      {
        officeId: OFFICE_ALMEIDA,
        processoId: processosAlmeida[0].id,
        data: new Date('2026-06-05T10:00:00Z'),
        titulo: 'Contestação juntada pela parte ré',
        resumoIa: 'A empresa contestou negando o vínculo. Cabe réplica no prazo de 15 dias.',
      },
      {
        officeId: OFFICE_ALMEIDA,
        processoId: processosAlmeida[1].id,
        data: new Date('2026-06-15T09:15:00Z'),
        titulo: 'Recurso de apelação distribuído',
        resumoIa: 'A apelação subiu ao tribunal. Aguardando designação de relator.',
      },
    ]);

    // Prazos (Agenda & Prazos).
    await db.insert(schema.prazos).values([
      {
        officeId: OFFICE_ALMEIDA,
        processoId: processosAlmeida[0].id,
        titulo: 'Arrolar testemunhas',
        dataVencimento: '2026-07-09',
        urgente: true,
      },
      {
        officeId: OFFICE_ALMEIDA,
        processoId: processosAlmeida[0].id,
        titulo: 'Apresentar réplica à contestação',
        dataVencimento: '2026-06-26',
        urgente: true,
      },
      {
        officeId: OFFICE_ALMEIDA,
        processoId: processosAlmeida[1].id,
        titulo: 'Contrarrazões de apelação',
        dataVencimento: '2026-07-20',
        urgente: false,
      },
    ]);

    // Leads (CRM — funil + score da IA).
    const leadsAlmeida = await db
      .insert(schema.leads)
      .values([
        {
          officeId: OFFICE_ALMEIDA,
          nome: 'Roberto Menezes',
          telefone: '+55 49 99811-2233',
          area: 'Trabalhista',
          score: 88,
          colunaFunil: 'qualificacao',
          origem: 'whatsapp',
          resumoIa: 'Demitido sem justa causa, verbas não pagas. Caso forte, urgência alta.',
        },
        {
          officeId: OFFICE_ALMEIDA,
          nome: 'Cleusa Fernandes',
          telefone: '+55 49 99744-5566',
          area: 'Previdenciário',
          score: 72,
          colunaFunil: 'novo',
          origem: 'whatsapp',
          resumoIa: 'Aposentadoria por idade rural, falta documentação. Mérito provável.',
        },
        {
          officeId: OFFICE_ALMEIDA,
          nome: 'Supermercado Bom Preço',
          telefone: '+55 49 99655-7788',
          area: 'Empresarial',
          score: 91,
          colunaFunil: 'proposta',
          origem: 'indicacao',
          resumoIa: 'Recuperação de crédito de R$ 60k. Provas sólidas, cliente recorrente.',
        },
        {
          officeId: OFFICE_ALMEIDA,
          nome: 'Antônio Carlos Pereira',
          telefone: '+55 49 99566-8899',
          area: 'Família',
          score: 54,
          colunaFunil: 'negociacao',
          origem: 'site',
          resumoIa: 'Divórcio consensual. Caso simples, baixa urgência.',
        },
        {
          officeId: OFFICE_ALMEIDA,
          nome: 'Fernanda Souza',
          telefone: '+55 49 99477-9900',
          area: 'Consumidor',
          score: 35,
          colunaFunil: 'perdido',
          origem: 'anuncio',
          resumoIa: 'Negativação indevida, valor baixo. Optou por não prosseguir.',
        },
        {
          officeId: OFFICE_ALMEIDA,
          nome: 'Lucas Andrade',
          telefone: '+55 49 99388-0011',
          area: 'Cível',
          score: 79,
          colunaFunil: 'ganho',
          origem: 'organico',
          resumoIa: 'Acidente de trânsito com danos materiais. Contrato fechado.',
        },
      ])
      .returning({ id: schema.leads.id });

    // Conversa de WhatsApp (Evolution API) do primeiro lead.
    await db.insert(schema.conversasWa).values({
      officeId: OFFICE_ALMEIDA,
      leadId: leadsAlmeida[0].id,
      mensagens: [
        { de: 'lead', texto: 'Boa tarde, fui demitido e não recebi nada', em: '2026-06-18T18:02:00Z' },
        {
          de: 'caio',
          texto: 'Olá, Roberto! Sinto muito. Pode me dizer há quanto tempo trabalhava na empresa?',
          em: '2026-06-18T18:02:20Z',
        },
        { de: 'lead', texto: '3 anos e 4 meses', em: '2026-06-18T18:03:10Z' },
      ],
    });

    // Documento gerado pela IA (Agente Redator / Caio).
    await db.insert(schema.documentos).values({
      officeId: OFFICE_ALMEIDA,
      processoId: processosAlmeida[0].id,
      titulo: 'Réplica à contestação — Madeira Verde',
      conteudo: 'EXCELENTÍSSIMO SENHOR DOUTOR JUIZ... (minuta gerada pelo Caio)',
      tipo: 'peticao',
      criadoPorIa: true,
    });

    // Cobrança (Asaas) e assinatura (ZapSign).
    await db.insert(schema.cobrancas).values({
      officeId: OFFICE_ALMEIDA,
      asaasId: 'pay_mock_almeida_001',
      valor: '679.00',
      status: 'pago',
    });
    await db.insert(schema.assinaturas).values({
      officeId: OFFICE_ALMEIDA,
      zapsignId: 'doc_mock_almeida_001',
      status: 'assinado',
    });

    // -------------------------------------------------------------------------
    // Tenant 2 — Naves Advocacia (somente para teste de isolamento)
    // -------------------------------------------------------------------------
    await db.insert(schema.offices).values({
      id: OFFICE_NAVES,
      nome: 'Naves Advocacia',
      oab: 'OAB/PR 67.890',
      plano: 'essencial',
    });
    await db.insert(schema.users).values({
      officeId: OFFICE_NAVES,
      nome: 'Dr. Henrique Naves',
      email: 'henrique@naves.adv.br',
      role: 'owner',
    });
    await db.insert(schema.processos).values({
      officeId: OFFICE_NAVES,
      cnj: '5009999-11.2024.8.16.0001',
      clienteNome: 'Confidencial — Naves',
      area: 'Cível',
      tribunal: 'TJPR',
      status: 'ativo',
      fase: 'conhecimento',
      valorCausa: '50000.00',
    });
    await db.insert(schema.leads).values({
      officeId: OFFICE_NAVES,
      nome: 'Lead Confidencial Naves',
      telefone: '+55 41 99000-0000',
      area: 'Empresarial',
      score: 60,
      colunaFunil: 'novo',
      origem: 'whatsapp',
    });

    console.log('✓ Seed concluído.');
    console.log(`  Almeida & Rocha (${OFFICE_ALMEIDA}): 3 usuários, 5 processos, 6 leads`);
    console.log(`  Naves Advocacia (${OFFICE_NAVES}): 1 usuário, 1 processo, 1 lead`);
  } catch (error) {
    console.error('✗ Falha no seed', { error });
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(() => process.exit(1));
