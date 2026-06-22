# Nexus — Plataforma de Inteligência Jurídica

SaaS multi-tenant de inteligência jurídica para advogados solo e escritórios de
pequeno porte (PR/SC). Fluxo central:

> WhatsApp → IA Score → Cliente 360 → Monitoramento → Redação IA → Protocolo INTIMA.AI

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind |
| Banco | PostgreSQL multi-tenant (`office_id` + Row Level Security) |
| ORM | Drizzle |
| Auth | Better Auth |
| IA | Claude API (assistente "Caio", mascote "Capi") |
| Cache | Redis |
| Dev local | Docker Compose |

## Multi-tenancy (não-negociável)

Toda tabela de tenant tem `office_id UUID NOT NULL` com FK para `offices` e RLS
ativo. A policy de isolamento:

```sql
USING (office_id = current_setting('app.office_id', true)::uuid)
```

A aplicação conecta como a role `nexus_app` (sem BYPASSRLS) e seta `app.office_id`
por request via `withTenant()`. **Sem** tenant setado, as queries retornam zero
linhas (fail-closed). A camada de aplicação nunca filtra `office_id` manualmente.

## Setup local

```bash
cp .env.example .env.local        # ajuste credenciais
docker compose up -d              # Postgres + Redis
npm install
npm run db:migrate                # cria schema + RLS (roda como owner)
npm run db:seed                   # popula Almeida & Rocha + Naves
npm run dev                       # http://localhost:3000
```

## Dados de seed

- **Almeida & Rocha Advocacia** (`11111111-…`) — tenant demo: 3 usuários,
  5 processos, 6 leads, movimentações, prazos, documento IA, cobrança e assinatura.
- **Naves Advocacia** (`22222222-…`) — tenant de controle, usado para provar
  isolamento (escritório A não acessa dados do B).

## Estrutura

```
apps/nexus/
├── drizzle/0000_init.sql     # schema + RLS policies
├── drizzle.config.ts
├── docker-compose.yml
└── src/
    └── db/
        ├── schema.ts          # tabelas Drizzle + tipos inferidos
        ├── client.ts          # pools app (RLS) e admin (migrate/seed)
        ├── tenant.ts          # withTenant() — escopo por office_id
        ├── migrate.ts
        └── seed.ts
```

## Testes

```bash
docker compose up -d            # Postgres precisa estar no ar
npm run test:rls                # teste de isolamento multi-tenant (RLS)
```

O teste de RLS conecta como a role `nexus_app` (sujeita às policies) e prova
fail-closed + isolamento entre escritórios. Relatório: `docs/qa/rls-isolation-report.md`.

## Status de implementação

- [x] **Fase 1 — Arquitetura de dados:** schema, migrations, RLS, seed
- [x] **Fase 2 — Backend:** rotas App Router, auth Better Auth, context de office_id, mocks
- [x] **Fase 3 — Frontend:** layout, sidebar (13 módulos), tema dark, Dashboard
- [x] **Fase 4 — Segurança/QA:** teste de isolamento RLS (10/10 PASS)

### Módulos (13/13 com UI)

| Módulo | Rota | Estado |
|--------|------|--------|
| Dashboard | `/dashboard` | KPIs, funil, atividade recente |
| Monitoramento | `/processos`, `/processos/[id]` | Tabela + detalhe com movimentações |
| CRM & Leads | `/crm` | Kanban de 6 colunas, score IA |
| Atendimento WhatsApp | `/atendimento` | Chat 2 colunas (stub Evolution) |
| Peticionamento | `/peticionamento` | Lista + editor (stub INTIMA.AI) |
| Portal do Cliente | `/portal` | Prévia self-service |
| Agenda & Prazos | `/agenda` | Lista por vencimento |
| Central de IA | `/ia` | Hub dos 6 agentes |
| Cliente 360 | `/cliente-360` | Score de risco PF/PJ |
| Jurimetria | `/jurimetria` | Prévia (Fase 2 · JUIT) |
| Background Check | `/background-check` | BNMP + SEEU (add-on) |
| Estúdio de Agentes | `/agentes` | Config dos 6 agentes |
| Equipe & Plano | `/equipe` | Seats + plano + cobranças |

### Integrações (stubs prontos para credencial)

`src/server/integrations/` — `evolution.ts` (WhatsApp), `intima.ts` (peticionamento).
Trocam de mock para real apenas com env configurado; nenhuma outra mudança no app.
