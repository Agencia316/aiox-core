/**
 * Nexus — Schema PostgreSQL multi-tenant (Drizzle ORM).
 *
 * Regra inegociável: TODA tabela de tenant possui `office_id UUID NOT NULL`
 * com FK para `offices`, e Row Level Security ativo. A policy de isolamento
 * vive na migration SQL (ver drizzle/0000_init.sql):
 *   USING (office_id = current_setting('app.office_id')::uuid)
 *
 * A camada de aplicação NUNCA filtra tenant manualmente em queries — o RLS
 * é a fonte da verdade. office_id é injetado por request via SET LOCAL.
 */
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// =============================================================================
// Enums
// =============================================================================

export const planoEnum = pgEnum('plano', ['solo', 'essencial', 'avancado', 'elite']);

export const userRoleEnum = pgEnum('user_role', ['owner', 'admin', 'advogado', 'secretaria']);

export const processoStatusEnum = pgEnum('processo_status', [
  'ativo',
  'suspenso',
  'arquivado',
  'baixado',
]);

export const processoFaseEnum = pgEnum('processo_fase', [
  'conhecimento',
  'recursal',
  'execucao',
  'cumprimento',
]);

export const leadColunaEnum = pgEnum('lead_coluna_funil', [
  'novo',
  'qualificacao',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
]);

export const leadOrigemEnum = pgEnum('lead_origem', [
  'whatsapp',
  'indicacao',
  'site',
  'anuncio',
  'organico',
]);

export const documentoTipoEnum = pgEnum('documento_tipo', [
  'peticao',
  'contrato',
  'procuracao',
  'parecer',
  'outro',
]);

export const assinaturaStatusEnum = pgEnum('assinatura_status', [
  'pendente',
  'assinado',
  'recusado',
  'expirado',
]);

export const cobrancaStatusEnum = pgEnum('cobranca_status', [
  'pendente',
  'pago',
  'vencido',
  'cancelado',
]);

export const honorarioTipoEnum = pgEnum('honorario_tipo', ['fixo', 'hora', 'exito']);

export const honorarioStatusEnum = pgEnum('honorario_status', [
  'aberto',
  'faturado',
  'recebido',
  'atrasado',
]);

export const despesaCategoriaEnum = pgEnum('despesa_categoria', [
  'custas',
  'diligencia',
  'pericia',
  'transporte',
  'outro',
]);

// =============================================================================
// offices — raiz do tenant
// =============================================================================

export const offices = pgTable('offices', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  oab: text('oab').notNull(),
  plano: planoEnum('plano').notNull().default('solo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// users
// =============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    officeId: uuid('office_id')
      .notNull()
      .references(() => offices.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    role: userRoleEnum('role').notNull().default('advogado'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_unique').on(t.email),
  }),
);

// =============================================================================
// processos
// =============================================================================

export const processos = pgTable(
  'processos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    officeId: uuid('office_id')
      .notNull()
      .references(() => offices.id, { onDelete: 'cascade' }),
    cnj: text('cnj').notNull(),
    clienteNome: text('cliente_nome').notNull(),
    area: text('area').notNull(),
    tribunal: text('tribunal').notNull(),
    status: processoStatusEnum('status').notNull().default('ativo'),
    fase: processoFaseEnum('fase').notNull().default('conhecimento'),
    valorCausa: numeric('valor_causa', { precision: 14, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // CNJ é único por escritório (não globalmente — dois escritórios podem
    // acompanhar o mesmo número de processo).
    cnjPorOffice: uniqueIndex('processos_office_cnj_unique').on(t.officeId, t.cnj),
  }),
);

// =============================================================================
// movimentacoes
// =============================================================================

export const movimentacoes = pgTable('movimentacoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  processoId: uuid('processo_id')
    .notNull()
    .references(() => processos.id, { onDelete: 'cascade' }),
  data: timestamp('data', { withTimezone: true }).notNull(),
  titulo: text('titulo').notNull(),
  resumoIa: text('resumo_ia'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// leads
// =============================================================================

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  telefone: text('telefone').notNull(),
  area: text('area').notNull(),
  score: integer('score').notNull().default(0),
  colunaFunil: leadColunaEnum('coluna_funil').notNull().default('novo'),
  origem: leadOrigemEnum('origem').notNull().default('whatsapp'),
  resumoIa: text('resumo_ia'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// conversas_wa — histórico de conversa do WhatsApp (Evolution API)
// =============================================================================

export const conversasWa = pgTable('conversas_wa', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  mensagens: jsonb('mensagens').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// documentos
// =============================================================================

export const documentos = pgTable('documentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  processoId: uuid('processo_id').references(() => processos.id, { onDelete: 'set null' }),
  titulo: text('titulo').notNull(),
  conteudo: text('conteudo').notNull(),
  tipo: documentoTipoEnum('tipo').notNull().default('peticao'),
  criadoPorIa: boolean('criado_por_ia').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// prazos
// =============================================================================

export const prazos = pgTable('prazos', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  processoId: uuid('processo_id').references(() => processos.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  dataVencimento: date('data_vencimento').notNull(),
  urgente: boolean('urgente').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// assinaturas (ZapSign)
// =============================================================================

export const assinaturas = pgTable('assinaturas', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  zapsignId: text('zapsign_id'),
  status: assinaturaStatusEnum('status').notNull().default('pendente'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// cobrancas (Asaas)
// =============================================================================

export const cobrancas = pgTable('cobrancas', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  asaasId: text('asaas_id'),
  valor: numeric('valor', { precision: 14, scale: 2 }).notNull(),
  status: cobrancaStatusEnum('status').notNull().default('pendente'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// honorarios — receitas do escritório (fixo / por hora / por êxito)
// =============================================================================

export const honorarios = pgTable('honorarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  processoId: uuid('processo_id').references(() => processos.id, { onDelete: 'set null' }),
  clienteNome: text('cliente_nome').notNull(),
  descricao: text('descricao').notNull(),
  tipo: honorarioTipoEnum('tipo').notNull().default('fixo'),
  valor: numeric('valor', { precision: 14, scale: 2 }).notNull(),
  status: honorarioStatusEnum('status').notNull().default('aberto'),
  vencimento: date('vencimento'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// despesas — saídas do escritório (custas, diligências, perícias, etc.)
// =============================================================================

export const despesas = pgTable('despesas', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  processoId: uuid('processo_id').references(() => processos.id, { onDelete: 'set null' }),
  descricao: text('descricao').notNull(),
  categoria: despesaCategoriaEnum('categoria').notNull().default('outro'),
  valor: numeric('valor', { precision: 14, scale: 2 }).notNull(),
  reembolsavel: boolean('reembolsavel').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// timesheets — horas trabalhadas (base para honorário por hora)
// =============================================================================

export const timesheets = pgTable('timesheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  processoId: uuid('processo_id').references(() => processos.id, { onDelete: 'set null' }),
  descricao: text('descricao').notNull(),
  advogado: text('advogado').notNull(),
  minutos: integer('minutos').notNull(),
  valorHora: numeric('valor_hora', { precision: 14, scale: 2 }).notNull(),
  data: date('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// Tipos inferidos (consumidos pelo @backend e @frontend)
// =============================================================================

export type Office = typeof offices.$inferSelect;
export type NewOffice = typeof offices.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Processo = typeof processos.$inferSelect;
export type NewProcesso = typeof processos.$inferInsert;
export type Movimentacao = typeof movimentacoes.$inferSelect;
export type NewMovimentacao = typeof movimentacoes.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type ConversaWa = typeof conversasWa.$inferSelect;
export type NewConversaWa = typeof conversasWa.$inferInsert;
export type Documento = typeof documentos.$inferSelect;
export type NewDocumento = typeof documentos.$inferInsert;
export type Prazo = typeof prazos.$inferSelect;
export type NewPrazo = typeof prazos.$inferInsert;
export type Assinatura = typeof assinaturas.$inferSelect;
export type NewAssinatura = typeof assinaturas.$inferInsert;
export type Cobranca = typeof cobrancas.$inferSelect;
export type NewCobranca = typeof cobrancas.$inferInsert;
export type Honorario = typeof honorarios.$inferSelect;
export type NewHonorario = typeof honorarios.$inferInsert;
export type Despesa = typeof despesas.$inferSelect;
export type NewDespesa = typeof despesas.$inferInsert;
export type Timesheet = typeof timesheets.$inferSelect;
export type NewTimesheet = typeof timesheets.$inferInsert;

/** Todas as tabelas de tenant (têm office_id + RLS). Usado por testes e tooling. */
export const TENANT_TABLES = [
  'users',
  'processos',
  'movimentacoes',
  'leads',
  'conversas_wa',
  'documentos',
  'prazos',
  'assinaturas',
  'cobrancas',
  'honorarios',
  'despesas',
  'timesheets',
] as const;
