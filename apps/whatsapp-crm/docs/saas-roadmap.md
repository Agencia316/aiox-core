# Roadmap SaaS — WhatsApp CRM Vertical Advogados

> Documento estratégico. Decisões tomadas em conjunto com o fundador. Versionado pra sobreviver a reset de container/sessão. Atualizar sempre que o plano mudar.

## 1. Posicionamento

**Categoria:** CRM conversacional para escritórios de advocacia, com agentes IA configurados por área do direito.

**Cliente alvo (ICP):**
- Escritórios de advocacia de pequeno e médio porte
- 5 a 50 atendentes (sócios + advogados + estagiários + recepção)
- Volume de WhatsApp: 200-5000 mensagens/dia
- Ticket esperado: **R$ 297 – R$ 1.497/mês** (3 faixas)
- Geografia inicial: Brasil (PT-BR, OAB)

**Diferencial vs concorrentes horizontais (Take Blip, Octadesk, Huggy, Manychat):**
1. Templates de prompts e fluxos prontos por área (cível, criminal, trabalhista, família, tributário, previdenciário, empresarial)
2. Compliance OAB nativo — IA nunca presta consulta jurídica, sempre encaminha pra advogado humano
3. Vocabulário e fluxos do dia a dia jurídico (triagem, agendamento, lembrete de prazo, follow-up de processo)
4. Integrações específicas (futuras): Google Calendar, agendamento online, e-mail jurídico, PJe/eSAJ (consulta read-only)

## 2. Restrições OAB (NÃO NEGOCIÁVEL)

**Provimento 205/2021 OAB** regula publicidade e captação na advocacia. Impacto direto no produto:

| Permitido | Proibido |
|-----------|----------|
| Triagem inicial (área, urgência) | "Vender" serviço jurídico via IA |
| Agendamento de consulta | Mercantilização da advocacia |
| Lembretes administrativos (prazo, audiência) | Captação ativa de clientes (cold outbound) |
| Resposta a perguntas administrativas (endereço, horários, formas de pagamento) | Consulta jurídica gerada por IA sem revisão humana |
| Follow-up de cliente existente | Promessa de resultado |
| Coleta de fatos antes da consulta | Honorários abaixo do mínimo da tabela OAB local |

**Implicação no produto:** todo agente IA precisa de um **disclaimer obrigatório** ("Esta é uma assistente virtual administrativa. Para orientação jurídica, será encaminhado a um advogado.") inserido no system prompt, não editável pelo usuário. Botão de "transferir para advogado humano" sempre visível na inbox.

**Sigilo profissional + LGPD:** dados sensíveis (CPF, números de processo, fatos) precisam de:
- Criptografia em repouso (Supabase faz nativo)
- Logs de acesso por usuário
- Retenção configurável (default 5 anos, ajustável)
- Direito ao esquecimento (DELETE em cascata via RLS)

## 3. Roadmap 6 meses (bootstrap, zero orçamento até mês 3)

### Mês 1 — Foundation multi-tenant
**Meta:** transformar o MVP single-user atual em SaaS multi-tenant funcional, ainda sem billing.

- Migração SQLite → Supabase (Postgres + Auth + Realtime)
- Esquema multi-tenant: `tenants` (cada escritório), `users` (membros do escritório com roles: owner/admin/atendente), `tenant_id` em todas as tabelas do CRM
- RLS policies no Supabase pra isolar dados por tenant
- Auth completo via Supabase Auth (signup/login/reset)
- Onboarding: criar tenant → escolher área(s) → conectar WhatsApp → templates de agentes pré-prontos carregados
- Landing page simples em Vercel (free tier)
- Templates iniciais: 3 áreas (cível, trabalhista, família) com 1 agente cada
- Disclaimer OAB hardcoded em todo system prompt

**Custo mensal:** R$ 0 (Supabase free + Vercel free + Hetzner CX11 R$ 25 OPCIONAL pro worker WhatsApp)

### Mês 2 — Beta fechado
**Meta:** 5-10 escritórios testando de graça. Você é o suporte humano.

- Recrutamento via sua rede OAB (3-5 escritórios) + indicações
- Polimento de bugs e UX baseado em uso real
- Adicionar áreas: criminal, tributário, empresarial, previdenciário (templates completos)
- Multi-instância WhatsApp por tenant (cada escritório conecta 1-3 números)
- Métricas básicas: msgs enviadas, conversas ativas, tempo médio de resposta
- Documentação de ajuda (10-15 artigos curtos em /help)
- Termo de uso + Política de privacidade (LGPD compliant)

**Custo:** R$ 25-50/mês (VPS pra worker)

### Mês 3 — Billing + primeiros pagantes
**Meta:** converter 3-5 beta em pagantes. Validar preço.

- Stripe Brasil ou Mercado Pago integrado (escolher pelo fee menor pra tickets baixos — Mercado Pago tem PIX assinatura)
- 1 plano único inicial: **R$ 297/mês** (1 número, até 5 usuários, agentes ilimitados, 5000 msgs/mês)
- Trial 14 dias sem cartão
- Faturamento, recibos, gestão de assinatura básica
- Onboarding melhorado: vídeo de 3 min + checklist
- Audit log básico (quem fez o quê, quando)
- E-mail transacional via Resend (free tier 3000/mês)

**Custo:** R$ 50-100/mês

### Mês 4 — Polimento mid-market
**Meta:** preparar pra escritórios maiores. Adicionar features que vendedor de mid-market vai pedir.

- Roles granulares: Owner (admin total) / Advogado (vê seus clientes) / Recepção (tria, não acessa fatos sensíveis)
- Relatórios: produtividade por usuário, tempo de resposta, conversões, conversas perdidas
- Exports (CSV/PDF) de conversas e relatórios
- Tag/categorização de conversas (área do direito, status do caso, prioridade)
- Templates de mensagem (respostas prontas reutilizáveis)
- Notificações por e-mail (mensagem nova, prazo próximo)
- Plano profissional: **R$ 697/mês** (3 números, até 15 usuários, 25k msgs)

**Custo:** R$ 100-200/mês

### Mês 5 — WhatsApp Cloud API (piloto)
**Meta:** oferecer alternativa oficial Meta pros maiores, sem risco de ban.

- Integração com WhatsApp Cloud API da Meta (oficial)
- Setup BSP (Business Solution Provider) — escolher entre 360dialog, Z-API, Gupshup (fees variados)
- Add-on: +R$ 297/mês pra usar Cloud API + custos de conversação repassados (~R$ 0,10-0,30 por conv business-initiated)
- Migração assistida pra clientes maiores que querem oficialização
- Plano enterprise: **R$ 1.497/mês** (Cloud API incluída até 1000 conv/mês, ilimitado de usuários e números)

**Custo:** R$ 200-400/mês

### Mês 6 — Crescimento + integrações
**Meta:** crescer base + abrir 2ª vertical (saúde ou imobiliárias).

- Integração Google Calendar (agendamento sync)
- Consulta read-only PJe/eSAJ (status de processo)
- Webhooks pra integração custom
- API pública (REST)
- SSO (Google Workspace, Microsoft 365) — comum em escritórios maiores
- Programa de afiliados (advogados indicando advogados → desconto recíproco)
- Início da vertical seguinte (mantendo a base multi-tenant agnóstica)

**Custo:** R$ 400-700/mês

## 4. Stack técnica

| Camada | Escolha | Razão |
|--------|---------|-------|
| Banco + Auth | **Supabase** (free → pro R$ 125/mês a partir do mês 4) | Postgres + Auth + Realtime + RLS num só serviço; free tier resolve até ~50 clientes |
| Worker WhatsApp | Node.js (já temos) | Reutiliza código existente |
| Hosting worker | **Hetzner CX11** (R$ 25/mês) ou Render free tier | VPS barato pra processo persistente com Chrome |
| Hosting dashboard | **Vercel** (free) | Next.js nativo, zero ops |
| Landing/marketing | **Vercel** (free) | Mesma conta |
| Billing | **Mercado Pago** (PIX assinatura — fee menor que Stripe pra ticket baixo BR) | Brasileiros pagam mais via PIX que cartão |
| E-mail | **Resend** (3000/mês free → R$ 100/mês) | Stripe-quality DX |
| DNS | **Cloudflare** (free) | Cache + DDoS protection grátis |
| Monitoring | **Uptime Kuma** self-hosted no Hetzner | Zero custo, dashboard próprio |
| Error tracking | **Sentry** (free tier 5k events/mês) | Padrão indústria |

**Custo total mês 1-2:** R$ 25/mês (só o VPS). Tudo o resto free tier.
**Custo total mês 6:** R$ 600-800/mês.

## 5. Modelo de preço (3 planos)

| Plano | Preço/mês | Limites | Público |
|-------|-----------|---------|---------|
| **Starter** | R$ 297 | 1 número, 5 usuários, 5k msgs, whatsapp-web.js | Escritório solo / dupla |
| **Pro** | R$ 697 | 3 números, 15 usuários, 25k msgs, relatórios, exports | Escritório 5-15 advogados |
| **Enterprise** | R$ 1.497 | Cloud API oficial, ilimitado de números/usuários, SSO, integrações, suporte prioritário | Escritório 15-50 |

**Add-ons:**
- Cloud API: pass-through dos custos Meta + 20% margem (a partir do mês 5)
- Treinamento ao vivo: R$ 500/sessão
- Custom integration: orçamento

**Trial:** 14 dias sem cartão em todos os planos. Trial estendido pra 30 dias se converter pra anual (10% desconto).

## 6. Métricas que importam (mês 3+)

| Métrica | Target mês 3 | Target mês 6 |
|---------|--------------|--------------|
| Beta → pagante (conversão) | 50% | 60% |
| Trial → pagante (conversão) | 25% | 35% |
| MRR | R$ 1.500 | R$ 15.000 |
| Clientes pagantes | 5 | 30-50 |
| Churn mensal | < 10% | < 5% |
| Tempo médio onboarding | < 30 min | < 15 min |
| NPS | n/a | > 40 |

## 7. Riscos conhecidos e mitigação

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| WhatsApp banir conta web.js de cliente | 🔴 Alta | Termo de uso deixa claro; oferecer migração pra Cloud API; backup de sessão diário |
| OAB regulamentar IA em advocacia (mudança no Provimento) | 🟡 Média | Conselho consultivo com 2-3 advogados; releases acompanhando mudanças OAB |
| LGPD — vazamento de dados sensíveis | 🔴 Alta | RLS rigorosa, criptografia, audit log, pentest no mês 4 |
| Concorrente vertical específico aparecer | 🟡 Média | Velocidade de feature, comunidade OAB, relacionamento com clientes |
| Custos Supabase explodirem em scale | 🟢 Baixa | Free tier resolve ~50 tenants; depois ~R$ 2/tenant/mês — repassável |
| Você ficar sem tempo de fazer suporte humano | 🔴 Alta | Plano Enterprise paga suporte; contratar 1 atendente PJ no mês 5 |

## 8. O que muda na codebase atual

**Aproveitável (~70% do MVP):**
- ✅ Worker WhatsApp (`src/worker/`) — só adicionar isolamento por tenant
- ✅ AI router (`src/ai/`) — sem mudanças, só sobe um nível
- ✅ CRM modules (`src/crm/`) — todas as queries ganham `WHERE tenant_id = ?`
- ✅ Dashboard Next.js (`app/`) — adicionar layout autenticado, esconder QR atrás de tenant
- ✅ Kanban DnD, Inbox, Agent Builder — só passam a respeitar tenant scope

**A criar (~30%):**
- 🆕 Schema multi-tenant (Supabase migrations)
- 🆕 Auth (Supabase Auth + UI de login/signup)
- 🆕 Onboarding flow (escolher áreas, conectar primeiro número, criar agentes from template)
- 🆕 Templates pré-prontos por área do direito (system prompts curados)
- 🆕 Roles + permissions (Owner/Advogado/Recepção)
- 🆕 Billing (Mercado Pago integration + página de assinatura)
- 🆕 Landing page (Vercel separado ou rota /marketing)
- 🆕 Termo + privacidade + DPA (Data Processing Agreement)

## 9. Próximas decisões em aberto (ordem de prioridade)

1. **Validar este roadmap com você** (sessão de revisão)
2. **Escolher BSP da Cloud API** (mês 5 — pode adiar)
3. **Definir nome do produto + domínio** (impacta landing e branding)
4. **Pricing definitivo** — fazer entrevista com 5-10 escritórios da sua rede pra validar R$ 297 / R$ 697 / R$ 1.497
5. **Nome do conselho consultivo OAB** (2-3 advogados pra revisar compliance)
6. **Modelo legal de cobrança** — PJ próprio? MEI? SCP com sócio advogado?

## 10. Story tracking

Cada item do roadmap vai virar uma story formal em `docs/stories/active/` seguindo o fluxo AIOX (`@po/@sm cria → @dev implementa → @qa valida → @devops push`). Mês 1 vai ter pelo menos 8-12 stories.

Primeira story a ser criada após aprovação deste roadmap:
- `SAAS-001`: Migrar SQLite → Supabase (schema + RLS + dual-write durante transição)

---

**Status do documento:** Draft v1. Aguardando revisão do fundador.
**Última atualização:** 2026-06-04
**Próxima revisão:** após sessão de validação do roadmap
