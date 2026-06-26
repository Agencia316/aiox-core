# Jurinbox - One-click Windows Installer (PowerShell)
#
# Roda como ADMIN. Faz tudo:
#  1. Garante winget
#  2. Instala Git (se faltar)
#  3. Instala Docker Desktop (se faltar)
#  4. Pede reboot (Docker exige) - depois do reboot rode o script de novo
#  5. Espera Docker daemon iniciar
#  6. Clona / atualiza o repo
#  7. Cria .env se faltar
#  8. `docker compose up -d --build`
#  9. Espera localhost:3100 responder
# 10. Abre o navegador
#
# Uso:
#   1. Salve este arquivo como C:\Users\<voce>\Downloads\install-jurinbox.ps1
#   2. Botao direito -> "Executar com PowerShell" (como administrador)
#   3. Se aparecer aviso de execution policy: rode primeiro
#        Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
#
# Em caso de erro: copie a mensagem e me mande de volta.

#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

# ---------- Configuration ----------
$REPO_URL    = 'https://github.com/Agencia316/aiox-core.git'
$REPO_BRANCH = 'claude/whatsapp-crm-ai-agents-X9JTT'
$REPO_DIR    = Join-Path $env:USERPROFILE 'jurinbox'  # C:\Users\<voce>\jurinbox
$APP_DIR     = Join-Path $REPO_DIR 'apps\whatsapp-crm'
$APP_URL     = 'http://localhost:3100'
$STATE_FILE  = Join-Path $env:LOCALAPPDATA 'jurinbox-installer.state'

# ---------- Utility helpers ----------
function Write-Step([string]$msg)    { Write-Host ''; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Info([string]$msg)    { Write-Host "    $msg" -ForegroundColor Gray }
function Write-Success([string]$msg) { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg)    { Write-Host "    [!] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg)    { Write-Host "    [X] $msg" -ForegroundColor Red }

function Test-Admin {
  $current = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($current)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-Command([string]$name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Save-State([string]$state) {
  $state | Set-Content -Path $STATE_FILE -Encoding UTF8
}

function Get-State {
  if (Test-Path $STATE_FILE) { return (Get-Content $STATE_FILE -Raw).Trim() }
  return 'fresh'
}

function Clear-State {
  if (Test-Path $STATE_FILE) { Remove-Item $STATE_FILE -Force }
}

# ---------- Pre-flight checks ----------
function Assert-Windows11 {
  $os = (Get-CimInstance Win32_OperatingSystem).Caption
  Write-Info "Detectado: $os"
  if ($os -notmatch 'Windows (10|11)') {
    Write-Fail "Sistema nao suportado. Precisa de Windows 10 ou 11."
    exit 1
  }
}

function Assert-Admin {
  if (-not (Test-Admin)) {
    Write-Fail "Este script precisa rodar como Administrador."
    Write-Info "Botao direito no arquivo .ps1 -> 'Executar com PowerShell' (como admin)"
    exit 1
  }
}

# ---------- Installers ----------
function Install-Winget {
  if (Test-Command 'winget') {
    Write-Success "winget disponivel"
    return
  }
  Write-Warn "winget nao encontrado. Instale 'App Installer' pela Microsoft Store e rode este script de novo."
  Write-Info "Link: https://apps.microsoft.com/detail/9NBLGGH4NNS1"
  exit 1
}

function Install-Git {
  if (Test-Command 'git') {
    $v = (git --version 2>&1).Trim()
    Write-Success "Git ja instalado: $v"
    return
  }
  Write-Step 'Instalando Git via winget'
  winget install -e --id Git.Git --silent --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) { Write-Fail 'Falha ao instalar Git'; exit 1 }
  # Refresh PATH
  $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
  Write-Success 'Git instalado'
}

function Install-Docker {
  if (Test-Command 'docker') {
    $v = (docker --version 2>&1).Trim()
    Write-Success "Docker ja instalado: $v"
    return $false  # didn't install now
  }
  Write-Step 'Instalando Docker Desktop via winget (pode demorar ~5 min)'
  winget install -e --id Docker.DockerDesktop --silent --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) { Write-Fail 'Falha ao instalar Docker Desktop'; exit 1 }
  Write-Success 'Docker Desktop instalado'
  return $true  # installed now -> needs reboot
}

function Wait-DockerDaemon {
  Write-Step 'Aguardando Docker daemon iniciar'
  # Try to start Docker Desktop if not running
  $dockerExe = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if ((Test-Path $dockerExe) -and (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue))) {
    Write-Info 'Iniciando Docker Desktop...'
    Start-Process $dockerExe | Out-Null
  }

  $maxWaitSec = 180  # 3 minutes
  $waited = 0
  while ($waited -lt $maxWaitSec) {
    try {
      docker info 2>&1 | Out-Null
      if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker daemon respondendo (apos ${waited}s)"
        return
      }
    } catch {}
    Start-Sleep -Seconds 3
    $waited += 3
    Write-Host -NoNewline '.'
  }
  Write-Host ''
  Write-Fail "Docker daemon nao respondeu em ${maxWaitSec}s"
  Write-Info 'Abra Docker Desktop manualmente, aguarde "Engine running" verde, e rode este script de novo.'
  exit 1
}

# ---------- Repo + app ----------
function Sync-Repo {
  Write-Step "Sincronizando repo em $REPO_DIR"
  if (-not (Test-Path $REPO_DIR)) {
    Write-Info "Clonando $REPO_URL ..."
    git clone $REPO_URL $REPO_DIR
    if ($LASTEXITCODE -ne 0) { Write-Fail 'git clone falhou'; exit 1 }
  } else {
    Write-Info 'Repo ja existe - atualizando'
    Push-Location $REPO_DIR
    try {
      git fetch origin $REPO_BRANCH
      if ($LASTEXITCODE -ne 0) { Write-Fail 'git fetch falhou'; exit 1 }
    } finally { Pop-Location }
  }
  Push-Location $REPO_DIR
  try {
    git checkout $REPO_BRANCH 2>&1 | Out-Null
    git pull origin $REPO_BRANCH 2>&1 | Out-Null
  } finally { Pop-Location }
  Write-Success "Branch $REPO_BRANCH pronta em $REPO_DIR"
}

function Ensure-Env {
  $envPath = Join-Path $APP_DIR '.env'
  $examplePath = Join-Path $APP_DIR '.env.example'
  if (Test-Path $envPath) {
    Write-Success ".env ja existe (mantido)"
    return
  }
  if (-not (Test-Path $examplePath)) {
    Write-Fail ".env.example nao encontrado em $APP_DIR"
    exit 1
  }
  Copy-Item $examplePath $envPath
  Write-Success ".env criado a partir do .env.example"
  Write-Info 'Edite com suas chaves OPENAI_API_KEY / GEMINI_API_KEY depois (opcional pra primeiro teste)'
}

function Start-App {
  Write-Step 'Subindo container (docker compose up -d --build)'
  Push-Location $APP_DIR
  try {
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { Write-Fail 'docker compose falhou - veja logs acima'; exit 1 }
  } finally { Pop-Location }
  Write-Success 'Container subindo'
}

function Wait-AppReady {
  Write-Step "Aguardando $APP_URL responder"
  $maxWaitSec = 120
  $waited = 0
  while ($waited -lt $maxWaitSec) {
    try {
      $r = Invoke-WebRequest -Uri "$APP_URL/api/status" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
      if ($r.StatusCode -eq 200) {
        Write-Success "App respondendo em ${waited}s"
        return
      }
    } catch {}
    Start-Sleep -Seconds 2
    $waited += 2
    Write-Host -NoNewline '.'
  }
  Write-Host ''
  Write-Warn "App ainda nao respondeu em ${maxWaitSec}s - verifique:"
  Write-Info "  docker compose -f $APP_DIR\docker-compose.yml logs -f"
}

function Open-Browser {
  Start-Process $APP_URL
}

# ---------- State machine ----------
function Schedule-RebootResume {
  # Cria task agendada que roda este script no proximo logon
  $scriptPath = $MyInvocation.MyCommand.Path
  if (-not $scriptPath) {
    # Fallback se invocado de pipe - copia o script pra um local fixo
    Write-Warn 'Nao detectei caminho do script - voce tera que roda-lo manualmente apos reboot.'
    return
  }
  $taskName = 'JurinboxInstallerResume'
  # Remove se ja existe
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  $action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null
  Write-Success "Task '$taskName' agendada - vai rodar automaticamente apos reboot"
}

function Cleanup-RebootTask {
  Unregister-ScheduledTask -TaskName 'JurinboxInstallerResume' -Confirm:$false -ErrorAction SilentlyContinue
}

# ---------- Main flow ----------
function Main {
  Write-Host ''
  Write-Host '====================================' -ForegroundColor Cyan
  Write-Host '  Jurinbox - Windows Installer'        -ForegroundColor Cyan
  Write-Host '====================================' -ForegroundColor Cyan

  Assert-Admin
  Assert-Windows11
  Install-Winget

  $state = Get-State

  if ($state -eq 'fresh') {
    Install-Git
    $dockerJustInstalled = Install-Docker
    if ($dockerJustInstalled) {
      Save-State 'awaiting-reboot'
      Schedule-RebootResume
      Write-Host ''
      Write-Host '====================================' -ForegroundColor Yellow
      Write-Host '  REINICIE O PC PARA CONTINUAR'      -ForegroundColor Yellow
      Write-Host '====================================' -ForegroundColor Yellow
      Write-Info 'Apos reiniciar, o instalador volta sozinho. Pode fechar esta janela.'
      $reboot = Read-Host 'Reiniciar agora? (S/N)'
      if ($reboot -match '^[SsYy]') { Restart-Computer -Force }
      exit 0
    }
    Save-State 'docker-installed'
  }

  if ((Get-State) -eq 'awaiting-reboot') {
    # Came back from reboot via scheduled task
    Save-State 'docker-installed'
  }

  Wait-DockerDaemon
  Sync-Repo
  Ensure-Env
  Start-App
  Wait-AppReady
  Open-Browser

  Cleanup-RebootTask
  Clear-State

  Write-Host ''
  Write-Host '====================================' -ForegroundColor Green
  Write-Host '  Jurinbox rodando em ' -ForegroundColor Green -NoNewline
  Write-Host $APP_URL -ForegroundColor Cyan
  Write-Host '====================================' -ForegroundColor Green
  Write-Info 'Comandos uteis (PowerShell, fora desta janela):'
  Write-Info "  cd $APP_DIR"
  Write-Info '  docker compose logs -f       # ver logs em tempo real'
  Write-Info '  docker compose restart       # reiniciar'
  Write-Info '  docker compose down          # parar (mantem dados)'
  Write-Info '  docker compose up -d --build # subir de novo'
}

try {
  Main
} catch {
  Write-Host ''
  Write-Fail "Erro: $_"
  Write-Info 'Copie a mensagem inteira acima e envie no chat para suporte.'
  exit 1
}
