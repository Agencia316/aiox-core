# QA Gate — Isolamento Multi-tenant (RLS)

**Fase 4 — @seguranca-qa** · Veredito: **PASS** · Data: 2026-06-22

## Escopo

Validar que o isolamento por `office_id` é garantido pelo banco (Row Level
Security), não pela camada de aplicação. Critério de aceite do briefing §10.4:

> Confirmar que uma query **sem** `office_id` retorna **zero** resultados.

## Setup

- PostgreSQL 16, schema + policies aplicados por `drizzle/0000_init.sql`.
- Conexão de teste usa a role **`nexus_app`** (sem `BYPASSRLS`, não-owner),
  idêntica à de produção. O seed roda como owner (bypassa RLS).
- Teste automatizado: `src/db/__tests__/rls-isolation.test.ts` (Vitest).
  Execução: `npm run test:rls`.

## Resultados — 10/10 PASS

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `processos` sem `app.office_id` | 0 linhas | ✅ |
| 2 | `leads` sem `app.office_id` | 0 linhas | ✅ |
| 3 | `offices` sem `app.office_id` | 0 linhas | ✅ |
| 4 | Almeida lê processos | 2, todos do próprio office | ✅ |
| 5 | Naves lê processos | 1 (só o próprio) | ✅ |
| 6 | Almeida tenta ler CNJ do Naves | 0 linhas | ✅ |
| 7 | `offices`: cada tenant vê só a própria linha | 1 (a sua) | ✅ |
| 8 | Almeida INSERT com `office_id` do Naves | bloqueado (WITH CHECK) | ✅ |
| 9 | Almeida INSERT no próprio office | permitido | ✅ |
| 10 | App real `withTenant()` (Almeida=2, Naves=1) | isolado | ✅ |

Validação adicional do fluxo documentado (migrate → seed → leitura como
`nexus_app`): Almeida = **5 processos**; sem tenant = **0**.

## Achado corrigido durante o gate

**Cast de UUID em `app.office_id` vazio.** A policy original usava
`current_setting('app.office_id', true)::uuid`. Quando a variável é resetada
para string vazia (`''`), o cast `''::uuid` **lançava erro** em vez de retornar
zero linhas. Isso continua fail-closed (não vaza dados), mas troca um resultado
vazio por uma exceção.

**Correção:** todas as 10 policies passaram a usar
`nullif(current_setting('app.office_id', true), '')::uuid`, normalizando
"não setado" (NULL) e "vazio" (`''`) para o mesmo comportamento: zero linhas.

## Conclusão

O isolamento multi-tenant é **fail-closed por padrão**: sem um `office_id`
válido no contexto da transação, nenhuma linha é visível e nenhuma escrita é
aceita. A aplicação não depende de filtros manuais de `office_id` — o RLS é a
fonte da verdade.
