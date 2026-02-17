Write-Host "================================================" -ForegroundColor Cyan
Write-Host "       INICIANDO PROYECTO COMPLETO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$servicios = @(
    @{Nombre="Auth Service"; Carpeta="backend\auth-service"; Puerto=4001; Color="Green"},
    @{Nombre="User Service"; Carpeta="backend\user-service"; Puerto=4002; Color="Yellow"},
    @{Nombre="Content Service"; Carpeta="backend\content-service"; Puerto=4003; Color="Magenta"},
    @{Nombre="Collaboration Service"; Carpeta="backend\collaboration-service"; Puerto=4004; Color="Blue"},
    @{Nombre="Reputation Service"; Carpeta="backend\reputation-service"; Puerto=4005; Color="DarkGreen"},
    @{Nombre="Recommendation Service"; Carpeta="backend\recommendation-service"; Puerto=4006; Color="DarkYellow"},
    @{Nombre="Chatbot Service"; Carpeta="backend\chatbot-service"; Puerto=4007; Color="DarkMagenta"},
    @{Nombre="Messaging Service"; Carpeta="backend\messaging-service"; Puerto=4008; Color="DarkBlue"},
    @{Nombre="API Gateway"; Carpeta="backend\api-gateway"; Puerto=4000; Color="Cyan"},
    @{Nombre="Frontend"; Carpeta="frontend"; Puerto=3000; Color="Red"}
)

if (-not (Test-Path "backend\auth-service")) {
    Write-Host "ERROR: Ejecuta este script desde la raiz del proyecto" -ForegroundColor Red
    Write-Host "cd D:\RedSocialAprendizajeColaborativoInteligente" -ForegroundColor Yellow
    exit 1
}

Write-Host "Se abriran 10 ventanas de PowerShell" -ForegroundColor Yellow
Write-Host "TIP: Para una sola ventana usa: npm run dev" -ForegroundColor Cyan
Write-Host ""

$ubicacionActual = Get-Location

foreach ($servicio in $servicios) {
    $titulo = "$($servicio.Nombre) - Puerto $($servicio.Puerto)"
    Write-Host "Iniciando $($servicio.Nombre)... " -ForegroundColor Gray -NoNewline
    
    $rutaCompleta = Join-Path $ubicacionActual $servicio.Carpeta
    
    $comandoInicio = "Set-Location '$rutaCompleta'; npm run dev"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $comandoInicio
    Start-Sleep -Seconds 2
    
    Write-Host "OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  TODOS LOS SERVICIOS ESTAN INICIANDO..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "  1. Espera 15-20 segundos" -ForegroundColor White
Write-Host "  2. Abre tu navegador" -ForegroundColor White
Write-Host "  3. Ve a: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  4. Registrate y prueba la aplicacion" -ForegroundColor White
Write-Host ""
Write-Host "Para DETENER todo:" -ForegroundColor Yellow
Write-Host "  Cierra todas las ventanas de PowerShell" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Enter para cerrar esta ventana..." -ForegroundColor Gray
Read-Host
