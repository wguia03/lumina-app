Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   INSTALANDO DEPENDENCIAS - PASO A PASO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este proceso puede tomar 5-10 minutos..." -ForegroundColor Yellow
Write-Host "Por favor espera, no cierres esta ventana." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "backend\shared")) {
    Write-Host "ERROR: Ejecuta este script desde la raiz del proyecto" -ForegroundColor Red
    Write-Host "cd D:\RedSocialAprendizajeColaborativoInteligente" -ForegroundColor Yellow
    exit 1
}

Write-Host "[0/10] Instalando dependencias en raiz del proyecto..." -ForegroundColor Yellow
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Completado" -ForegroundColor Green
} else {
    Write-Host "  ERROR al instalar" -ForegroundColor Red
}
Write-Host ""

$servicios = @(
    "backend\shared",
    "backend\api-gateway",
    "backend\auth-service",
    "backend\user-service",
    "backend\content-service",
    "backend\collaboration-service",
    "backend\reputation-service",
    "backend\recommendation-service",
    "backend\chatbot-service",
    "backend\messaging-service",
    "frontend"
)

$contador = 2
$total = $servicios.Count + 1

foreach ($servicio in $servicios) {
    Write-Host "[$contador/$total] Instalando en $servicio..." -ForegroundColor Yellow
    
    Push-Location $servicio
    npm install 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK Completado" -ForegroundColor Green
    } else {
        Write-Host "  ERROR al instalar" -ForegroundColor Red
    }
    
    Pop-Location
    $contador++
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Green
Write-Host "   TODAS LAS DEPENDENCIAS INSTALADAS!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: iniciar-proyecto.ps1" -ForegroundColor Cyan
Write-Host ""
