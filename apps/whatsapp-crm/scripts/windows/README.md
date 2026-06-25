# Jurinbox — Setup Windows 11

Scripts PowerShell que automatizam todo o setup. Em vez de seguir 8 comandos manuais, você roda **um arquivo** e o resto é automático.

## Primeira instalação (uma vez só, ~15 min)

1. Salve [`install.ps1`](./install.ps1) no seu PC (ex.: `C:\Users\<voce>\Downloads\install.ps1`)
2. Botão direito no arquivo → **"Executar com PowerShell"** (PowerShell abre como admin sozinho se você confirmar UAC)
3. Se aparecer aviso de "execution policy" bloqueando, abra PowerShell como admin e rode primeiro:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
   ```
   Depois tente o script de novo.

### O que o `install.ps1` faz

| Passo | Ação |
|-------|------|
| 1 | Verifica que é Windows 10/11 + admin |
| 2 | Garante que `winget` está disponível |
| 3 | Instala **Git** (se faltar) |
| 4 | Instala **Docker Desktop** (se faltar) |
| 5 | Pede pra reiniciar o PC (Docker exige) |
| 6 | Após reboot, **continua sozinho** via tarefa agendada |
| 7 | Espera Docker daemon ficar pronto |
| 8 | Clona o repo em `C:\Users\<voce>\jurinbox\` |
| 9 | Cria `.env` a partir do `.env.example` |
| 10 | `docker compose up -d --build` (~5 min na 1ª vez) |
| 11 | Espera `http://localhost:3100` responder |
| 12 | Abre o navegador automaticamente |

**Tempo total:** ~15 min de instalação + ~3 min de reboot + ~5 min de build na 1ª execução. Próximas vezes são segundos.

## Uso diário

### Subir o app
Botão direito em [`start.ps1`](./start.ps1) → **"Executar com PowerShell"**. Sobe e abre o navegador.

Equivalente manual:
```powershell
cd $env:USERPROFILE\jurinbox\apps\whatsapp-crm
docker compose up -d
```

### Parar o app
Botão direito em [`stop.ps1`](./stop.ps1) → **"Executar com PowerShell"**.

Dados e sessão WhatsApp ficam preservados (volumes Docker).

Equivalente manual:
```powershell
cd $env:USERPROFILE\jurinbox\apps\whatsapp-crm
docker compose down
```

## Se algo der errado

**O instalador falhou. E agora?**
Copie a mensagem inteira que aparece em vermelho e me envie no chat. Erros comuns:

| Erro | Causa provável | Resolução |
|------|----------------|-----------|
| `winget : termo não reconhecido` | Win10 muito antigo | Instale "App Installer" pela Microsoft Store |
| `Failed when searching source: winget` | Fontes desatualizadas | `winget source update` então tente de novo |
| `Installer failed with exit code -2147023293` | Virtualização desligada na BIOS | Entre na BIOS (F2/Del no boot), procure "VT-x" ou "AMD-V", ative |
| `WSL 2 installation is incomplete` | WSL faltando | `wsl --install` e reinicie |
| `Cannot connect to the Docker daemon` | Docker Desktop não está rodando | Abra Docker Desktop pelo menu Iniciar e espere "Engine running" verde |
| `port is already allocated: 3100` | Algo já usa porta 3100 | Edite `docker-compose.yml` linha 8: troque `'3100:3100'` por `'3101:3100'` |

## Atualizar pra última versão

```powershell
cd $env:USERPROFILE\jurinbox
git pull origin claude/whatsapp-crm-ai-agents-X9JTT
cd apps\whatsapp-crm
docker compose up -d --build
```

Ou rode `install.ps1` de novo — ele detecta que tudo já está instalado e só atualiza/reinicia o container.

## Desinstalar tudo

```powershell
# 1. Para e remove containers + volumes (perde dados!)
cd $env:USERPROFILE\jurinbox\apps\whatsapp-crm
docker compose down -v

# 2. Remove o repo
Remove-Item -Recurse -Force $env:USERPROFILE\jurinbox

# 3. (Opcional) Desinstala Docker Desktop
winget uninstall Docker.DockerDesktop
```
