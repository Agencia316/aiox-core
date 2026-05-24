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

## Como usar

1. Abra o link do app (no celular ou no PC). **Não tem login** — já abre direto pronto pra usar.
2. Toque em **Nova** para registrar uma venda.
3. Os dados ficam na nuvem e aparecem igual em qualquer aparelho que abrir o mesmo link.

> ⚠️ **Atenção (segurança):** como não há login, qualquer pessoa que tiver o link
> consegue ver e editar as vendas. Trate o link como secreto — não publique nem
> compartilhe. Se um dia quiser proteger com senha, dá pra reativar o login.

## Backend (nuvem)

- Plataforma: **Supabase** (projeto `vendas-ensaios`, região São Paulo)
- Tabela `vendas` com acesso aberto pela chave pública (sem login) — modelo "link secreto"
- As chaves no `app.js` são **públicas** por design

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura das telas |
| `styles.css` | Visual / layout responsivo |
| `app.js` | Lógica (vendas, gráficos, relatórios) |
| `manifest.webmanifest` + `sw.js` + `icon.svg` | Instalação como app (PWA) |

## Rodar localmente

Como usa módulos JavaScript, sirva a pasta por um servidor local (não abra via `file://`):

```bash
cd vendas-ensaios
python3 -m http.server 8080
# abra http://localhost:8080
```
