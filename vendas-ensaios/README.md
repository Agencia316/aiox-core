# Vendas de Ensaios

App web para registrar e acompanhar as vendas dos seus ensaios fotográficos — no celular e no computador, com dados sincronizados na nuvem.

## O que ele faz

- Registrar cada venda: **data**, **tipo de ensaio**, **valor**, cliente e observações (opcionais)
- Acompanhamento **diário, semanal e mensal** com totais e gráficos
- Painel com: vendas de hoje, da semana, do mês, ticket médio e total geral
- Gráfico de evolução (por dia / semana / mês) e divisão por tipo de ensaio
- Lista de vendas com filtros, edição e exclusão
- Exportar para **CSV** (abre no Excel/Google Sheets)
- Funciona offline para abrir e pode ser **instalado na tela inicial** do celular

## Tipos de ensaio

- Copa do Mundo Futebol
- Ensaio de Grávida
- Aniversário Infantil - Menino
- Aniversário Infantil - Menina
- Fotos Profissionais
- Restauração de Fotos Antigas
- Fotos 45+ Pessoais

> Para adicionar/alterar tipos, edite a lista `TIPOS_ENSAIO` no início de `app.js`.

## Primeiro acesso

1. Abra o app (link de hospedagem ou `index.html`).
2. Toque em **Criar conta**, informe seu e-mail e uma senha (mínimo 6 caracteres).
3. Faça login. Use o **mesmo e-mail e senha** em qualquer aparelho para ver os mesmos dados.

### Fazer o link de confirmação abrir no app (recomendado)

Mantendo a confirmação por e-mail ligada, configure as URLs para o link do e-mail
voltar para o app (em vez de cair em `localhost`):

1. Acesse: <https://supabase.com/dashboard/project/ziprirvpvlvxqjuseeyg/auth/url-configuration>
2. Em **Site URL**, cole a URL onde o app está hospedado, ex.:
   `https://aiox-core-git-claude-photography-sa-6b24ab-agencia316s-projects.vercel.app`
3. Em **Redirect URLs**, clique **Add URL** e cole a mesma URL.
4. Salve. (O app já envia esse retorno automaticamente via `emailRedirectTo`.)

### Alternativa: cadastro instantâneo (sem confirmar e-mail)

Se preferir entrar na hora, sem confirmação:

1. Acesse: <https://supabase.com/dashboard/project/ziprirvpvlvxqjuseeyg/auth/providers>
2. Em **Email**, desligue **Confirm email** e salve.

## Backend (nuvem)

- Plataforma: **Supabase** (projeto `vendas-ensaios`, região São Paulo)
- Tabela `vendas` protegida por **RLS**: cada conta só enxerga seus próprios dados
- As chaves no `app.js` são **públicas** (a segurança é garantida pelo RLS no banco)

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura das telas |
| `styles.css` | Visual / layout responsivo |
| `app.js` | Lógica (login, vendas, gráficos, relatórios) |
| `manifest.webmanifest` + `sw.js` + `icon.svg` | Instalação como app (PWA) |

## Rodar localmente

Como usa módulos JavaScript, sirva a pasta por um servidor local (não abra via `file://`):

```bash
cd vendas-ensaios
python3 -m http.server 8080
# abra http://localhost:8080
```
