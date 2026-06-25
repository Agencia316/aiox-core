# Jurinbox — stop
# Para o container, mantém dados e sessão WhatsApp em volumes.

$ErrorActionPreference = 'Stop'
$APP_DIR = Join-Path $env:USERPROFILE 'jurinbox\apps\whatsapp-crm'

if (-not (Test-Path $APP_DIR)) {
  Write-Host "[X] $APP_DIR não existe" -ForegroundColor Red
  exit 1
}

Push-Location $APP_DIR
try {
  docker compose down
  if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Jurinbox parado. Dados e sessão WhatsApp preservados." -ForegroundColor Green
  }
} finally {
  Pop-Location
}
