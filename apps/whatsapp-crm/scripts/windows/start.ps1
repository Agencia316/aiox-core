# Jurinbox - start (uso diario apos install.ps1)
#
# Sobe o container e abre o navegador. NAO precisa rodar como admin.

$ErrorActionPreference = 'Stop'
$REPO_DIR = Join-Path $env:USERPROFILE 'jurinbox'
$APP_DIR  = Join-Path $REPO_DIR 'apps\whatsapp-crm'
$APP_URL  = 'http://localhost:3100'

if (-not (Test-Path $APP_DIR)) {
  Write-Host "[X] Repo nao encontrado em $APP_DIR - rode install.ps1 primeiro" -ForegroundColor Red
  exit 1
}

Push-Location $APP_DIR
try {
  Write-Host '==> docker compose up -d' -ForegroundColor Cyan
  docker compose up -d
  if ($LASTEXITCODE -ne 0) { throw 'docker compose up falhou' }

  Write-Host "==> Aguardando $APP_URL ..." -ForegroundColor Cyan
  for ($i = 0; $i -lt 60; $i++) {
    try {
      $r = Invoke-WebRequest -Uri "$APP_URL/api/status" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
      if ($r.StatusCode -eq 200) {
        Write-Host "[OK] App pronto" -ForegroundColor Green
        Start-Process $APP_URL
        exit 0
      }
    } catch {}
    Start-Sleep 2
    Write-Host -NoNewline '.'
  }
  Write-Host ''
  Write-Host "[!] App ainda nao respondeu. Rode: docker compose logs -f" -ForegroundColor Yellow
} finally {
  Pop-Location
}
