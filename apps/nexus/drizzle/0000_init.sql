-- =============================================================================
-- Nexus — Migração inicial: schema multi-tenant + Row Level Security
-- =============================================================================
-- Modelo de isolamento:
--   * A aplicação conecta como role `nexus_app` (SEM BYPASSRLS, NÃO owner).
--   * migrate/seed conectam como owner/superuser (bypassam RLS).
--   * Toda tabela de tenant tem `office_id` e uma policy:
--       USING (office_id = nullif(current_setting('app.office_id', true), '')::uuid)
--   * Sem `app.office_id` setado (NULL) OU vazio ('') → nullif/current_setting
--     resultam NULL → `office_id = NULL` é sempre falso → ZERO linhas. (Fail-closed.)
--     O nullif evita erro de cast (''::uuid) quando a var é resetada para vazio.
-- =============================================================================

-- Extensão necessária para defaultRandom() (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Role da aplicação (idempotente). Senha definida via ALTER em ambiente real.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexus_app') THEN
    CREATE ROLE nexus_app LOGIN PASSWORD 'nexus';
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
CREATE TYPE "plano" AS ENUM ('solo', 'essencial', 'avancado', 'elite');
CREATE TYPE "user_role" AS ENUM ('owner', 'admin', 'advogado', 'secretaria');
CREATE TYPE "processo_status" AS ENUM ('ativo', 'suspenso', 'arquivado', 'baixado');
CREATE TYPE "processo_fase" AS ENUM ('conhecimento', 'recursal', 'execucao', 'cumprimento');
CREATE TYPE "lead_coluna_funil" AS ENUM ('novo', 'qualificacao', 'proposta', 'negociacao', 'ganho', 'perdido');
CREATE TYPE "lead_origem" AS ENUM ('whatsapp', 'indicacao', 'site', 'anuncio', 'organico');
CREATE TYPE "documento_tipo" AS ENUM ('peticao', 'contrato', 'procuracao', 'parecer', 'outro');
CREATE TYPE "assinatura_status" AS ENUM ('pendente', 'assinado', 'recusado', 'expirado');
CREATE TYPE "cobranca_status" AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');
CREATE TYPE "honorario_tipo" AS ENUM ('fixo', 'hora', 'exito');
CREATE TYPE "honorario_status" AS ENUM ('aberto', 'faturado', 'recebido', 'atrasado');
CREATE TYPE "despesa_categoria" AS ENUM ('custas', 'diligencia', 'pericia', 'transporte', 'outro');

-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------
CREATE TABLE "offices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" text NOT NULL,
  "oab" text NOT NULL,
  "plano" "plano" NOT NULL DEFAULT 'solo',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "nome" text NOT NULL,
  "email" text NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'advogado',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");

CREATE TABLE "processos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "cnj" text NOT NULL,
  "cliente_nome" text NOT NULL,
  "area" text NOT NULL,
  "tribunal" text NOT NULL,
  "status" "processo_status" NOT NULL DEFAULT 'ativo',
  "fase" "processo_fase" NOT NULL DEFAULT 'conhecimento',
  "valor_causa" numeric(14, 2),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "processos_office_cnj_unique" ON "processos" ("office_id", "cnj");

CREATE TABLE "movimentacoes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "processo_id" uuid NOT NULL REFERENCES "processos"("id") ON DELETE CASCADE,
  "data" timestamptz NOT NULL,
  "titulo" text NOT NULL,
  "resumo_ia" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "movimentacoes_processo_idx" ON "movimentacoes" ("processo_id");

CREATE TABLE "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "nome" text NOT NULL,
  "telefone" text NOT NULL,
  "area" text NOT NULL,
  "score" integer NOT NULL DEFAULT 0,
  "coluna_funil" "lead_coluna_funil" NOT NULL DEFAULT 'novo',
  "origem" "lead_origem" NOT NULL DEFAULT 'whatsapp',
  "resumo_ia" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "conversas_wa" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "mensagens" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "documentos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "processo_id" uuid REFERENCES "processos"("id") ON DELETE SET NULL,
  "titulo" text NOT NULL,
  "conteudo" text NOT NULL,
  "tipo" "documento_tipo" NOT NULL DEFAULT 'peticao',
  "criado_por_ia" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "prazos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "processo_id" uuid REFERENCES "processos"("id") ON DELETE CASCADE,
  "titulo" text NOT NULL,
  "data_vencimento" date NOT NULL,
  "urgente" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "assinaturas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "zapsign_id" text,
  "status" "assinatura_status" NOT NULL DEFAULT 'pendente',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "cobrancas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "asaas_id" text,
  "valor" numeric(14, 2) NOT NULL,
  "status" "cobranca_status" NOT NULL DEFAULT 'pendente',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "honorarios" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "processo_id" uuid REFERENCES "processos"("id") ON DELETE SET NULL,
  "cliente_nome" text NOT NULL,
  "descricao" text NOT NULL,
  "tipo" "honorario_tipo" NOT NULL DEFAULT 'fixo',
  "valor" numeric(14, 2) NOT NULL,
  "status" "honorario_status" NOT NULL DEFAULT 'aberto',
  "vencimento" date,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "despesas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "processo_id" uuid REFERENCES "processos"("id") ON DELETE SET NULL,
  "descricao" text NOT NULL,
  "categoria" "despesa_categoria" NOT NULL DEFAULT 'outro',
  "valor" numeric(14, 2) NOT NULL,
  "reembolsavel" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "timesheets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "office_id" uuid NOT NULL REFERENCES "offices"("id") ON DELETE CASCADE,
  "processo_id" uuid REFERENCES "processos"("id") ON DELETE SET NULL,
  "descricao" text NOT NULL,
  "advogado" text NOT NULL,
  "minutos" integer NOT NULL,
  "valor_hora" numeric(14, 2) NOT NULL,
  "data" date NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Grants para a role da aplicação
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nexus_app;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
-- offices: o tenant só enxerga a própria linha (id == app.office_id).
ALTER TABLE "offices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offices_tenant_isolation" ON "offices"
  FOR ALL
  USING ("id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("id" = nullif(current_setting('app.office_id', true), '')::uuid);

-- Macro de policy padrão para tabelas com office_id.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_tenant_isolation" ON "users"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "processos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "processos_tenant_isolation" ON "processos"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "movimentacoes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movimentacoes_tenant_isolation" ON "movimentacoes"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_tenant_isolation" ON "leads"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "conversas_wa" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversas_wa_tenant_isolation" ON "conversas_wa"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "documentos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documentos_tenant_isolation" ON "documentos"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "prazos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prazos_tenant_isolation" ON "prazos"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "assinaturas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assinaturas_tenant_isolation" ON "assinaturas"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "cobrancas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cobrancas_tenant_isolation" ON "cobrancas"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "honorarios" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "honorarios_tenant_isolation" ON "honorarios"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "despesas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "despesas_tenant_isolation" ON "despesas"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);

ALTER TABLE "timesheets" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timesheets_tenant_isolation" ON "timesheets"
  FOR ALL
  USING ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid)
  WITH CHECK ("office_id" = nullif(current_setting('app.office_id', true), '')::uuid);
