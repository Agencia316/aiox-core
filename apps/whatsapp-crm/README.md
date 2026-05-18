# WhatsApp CRM — AIOX MVP

CLI-first WhatsApp CRM with Kanban board and AI agents (OpenAI / Gemini).

> **Constitution Art. I — CLI First:** todo o sistema funciona 100% via CLI. UI Next.js virá em story posterior, observando este backend.

## Stack

- **Runtime:** Node.js 20+ (CommonJS, ES2022)
- **WhatsApp:** `whatsapp-web.js` (QR Code + sessão local)
- **DB:** SQLite via `better-sqlite3` (zero ops; migração para Supabase é trivial)
- **AI:** `openai` + `@google/generative-ai`
- **CLI:** `commander`

## Setup

```bash
cd apps/whatsapp-crm
npm install
cp .env.example .env
# preencha OPENAI_API_KEY e/ou GEMINI_API_KEY no .env
npm run migrate
```

## Comandos

### Conexão WhatsApp

```bash
# Inicia worker e mostra QR Code no terminal (Ctrl+C para parar)
npx whatsapp-crm qr

# Mostra status e configuração
npx whatsapp-crm status

# Envia mensagem (worker precisa estar rodando em outro processo)
npx whatsapp-crm send 5511999990001 "Olá!"
```

### CRM

```bash
# Lista conversas recentes
npx whatsapp-crm conversations --limit 20

# Lista mensagens de uma conversa
npx whatsapp-crm messages 1 --mark-read
```

### Kanban

```bash
# Cria o board com colunas default
npx whatsapp-crm board init

# Mostra colunas e cards
npx whatsapp-crm board show

# Cria card manualmente
npx whatsapp-crm card create 1 --column "Em atendimento"

# Move card
npx whatsapp-crm card move 1 "Fechado"
```

### Agentes IA

```bash
# Cria agente OpenAI
npx whatsapp-crm agent create \
  --name vendas \
  --provider openai \
  --model gpt-4o \
  --prompt "Você é um vendedor amigável e objetivo. Responda em PT-BR."

# Cria agente Gemini
npx whatsapp-crm agent create \
  --name suporte \
  --provider gemini \
  --model gemini-1.5-pro \
  --prompt "Você é um agente de suporte técnico. Seja claro e empático."

# Lista agentes
npx whatsapp-crm agent list

# Liga / desliga
npx whatsapp-crm agent toggle vendas on

# Atribui agente a uma coluna do Kanban
npx whatsapp-crm agent assign vendas "Novo"

# Gera resposta sugerida (não envia automaticamente)
npx whatsapp-crm agent reply 1 --agent vendas
# ou pela coluna:
npx whatsapp-crm agent reply 1 --column "Novo"
```

## Fluxo típico

1. `npm run migrate` → schema criado em `data/whatsapp-crm.db`
2. `npx whatsapp-crm board init`
3. `npx whatsapp-crm qr` → escaneia QR no celular
4. Mensagens recebidas → contato + conversa + card auto-criados na coluna "Novo"
5. `npx whatsapp-crm agent create ...` → configura agente IA
6. `npx whatsapp-crm agent assign vendas "Novo"`
7. `npx whatsapp-crm agent reply <conv-id>` → gera sugestão
8. `npx whatsapp-crm send <phone> "<resposta-revisada>"` → operador envia

## Testes

```bash
npm test
```

## Arquitetura

```
bin/whatsapp-crm.js              # entrypoint
└── src/
    ├── cli/                     # commander
    ├── worker/                  # whatsapp-web.js wrapper + handlers
    ├── ai/                      # router + openai + gemini providers
    ├── crm/                     # contacts, conversations, kanban, agents
    ├── db/                      # SQLite (schema + driver)
    └── utils/logger.js
```

## Notas de produção

- **Não-oficial:** `whatsapp-web.js` usa WhatsApp Web por baixo. Para produção crítica, migre para WhatsApp Cloud API (Meta).
- **SQLite:** ótimo para uma instância. Para multi-usuário em produção, migre para Postgres/Supabase (interface dos módulos `src/crm/*` permanece idêntica).
- **Segurança:** `.env` nunca deve ser versionado. `sessions/` contém credenciais do WhatsApp — também não versionar.

## Próximos passos (fora desta story)

- `WHATSAPP-CRM-002`: Dashboard Next.js com Kanban drag-and-drop, Inbox e Agent Builder visual
- `WHATSAPP-CRM-003`: Auto-resposta (agente envia direto com aprovação opcional)
- `WHATSAPP-CRM-004`: Migração SQLite → Supabase
