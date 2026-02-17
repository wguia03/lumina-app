Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACION DEL PROYECTO - PASO A PASO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "backend\auth-service")) {
    Write-Host "ERROR: Ejecuta este script desde la raiz del proyecto" -ForegroundColor Red
    Write-Host "cd D:\RedSocialAprendizajeColaborativoInteligente" -ForegroundColor Yellow
    exit 1
}

Write-Host "[PASO 1/2] Necesitamos configurar las credenciales" -ForegroundColor Yellow
Write-Host ""

$dbPassword = Read-Host "Ingresa tu password de MySQL (root)"
$openaiKey = Read-Host "Ingresa tu OpenAI API Key (presiona Enter para demo)"

if ([string]::IsNullOrWhiteSpace($openaiKey)) {
    $openaiKey = "demo-key"
    Write-Host "Usando API Key de demostracion" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "[PASO 2/2] Creando archivos .env..." -ForegroundColor Yellow
Write-Host ""

$jwtSecret = "proyecto-red-social-secreto-jwt-2024"

# Auth Service
$content = "PORT=4001`nDB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=$dbPassword`nDB_NAME=redsocial`nJWT_SECRET=$jwtSecret`nJWT_EXPIRES_IN=7d"
$content | Out-File "backend\auth-service\.env" -Encoding utf8 -NoNewline
Write-Host "  OK Auth Service" -ForegroundColor Green

# User Service
$content = "PORT=4002`nDB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=$dbPassword`nDB_NAME=redsocial`nJWT_SECRET=$jwtSecret"
$content | Out-File "backend\user-service\.env" -Encoding utf8 -NoNewline
Write-Host "  OK User Service" -ForegroundColor Green

# Content Service
$content = "PORT=4003`nDB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=$dbPassword`nDB_NAME=redsocial`nJWT_SECRET=$jwtSecret"
$content | Out-File "backend\content-service\.env" -Encoding utf8 -NoNewline
Write-Host "  OK Content Service" -ForegroundColor Green

# Collaboration Service
$content = "PORT=4004`nDB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=$dbPassword`nDB_NAME=redsocial`nJWT_SECRET=$jwtSecret"
$content | Out-File "backend\collaboration-service\.env" -Encoding utf8 -NoNewline
Write-Host "  OK Collaboration Service" -ForegroundColor Green

# Reputation Service
$content = "PORT=4005`nDB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=$dbPassword`nDB_NAME=redsocial`nJWT_SECRET=$jwtSecret"
$content | Out-File "backend\reputation-service\.env" -Encoding utf8 -NoNewline
Write-Host "  OK Reputation Service" -ForegroundColor Green

# Recommendation Service
$content = "PORT=4006`nDB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=$dbPassword`nDB_NAME=redsocial`nJWT_SECRET=$jwtSecret"
$content | Out-File "backend\recommendation-service\.env" -Encoding utf8 -NoNewline
Write-Host "  OK Recommendation Service" -ForegroundColor Green

# Chatbot Service
$content = "PORT=4007`nDB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=$dbPassword`nDB_NAME=redsocial`nJWT_SECRET=$jwtSecret`nOPENAI_API_KEY=$openaiKey`nAI_MODEL=gpt-3.5-turbo"
$content | Out-File "backend\chatbot-service\.env" -Encoding utf8 -NoNewline
Write-Host "  OK Chatbot Service" -ForegroundColor Green

# Messaging Service
$content = "PORT=4008`nDB_HOST=localhost`nDB_USER=root`nDB_PASSWORD=$dbPassword`nDB_NAME=redsocial`nJWT_SECRET=$jwtSecret"
$content | Out-File "backend\messaging-service\.env" -Encoding utf8 -NoNewline
Write-Host "  OK Messaging Service" -ForegroundColor Green

# API Gateway
$content = "PORT=4000`nAUTH_SERVICE_URL=http://localhost:4001`nUSER_SERVICE_URL=http://localhost:4002`nCONTENT_SERVICE_URL=http://localhost:4003`nCOLLABORATION_SERVICE_URL=http://localhost:4004`nREPUTATION_SERVICE_URL=http://localhost:4005`nRECOMMENDATION_SERVICE_URL=http://localhost:4006`nCHATBOT_SERVICE_URL=http://localhost:4007`nMESSAGING_SERVICE_URL=http://localhost:4008"
$content | Out-File "backend\api-gateway\.env" -Encoding utf8 -NoNewline
Write-Host "  OK API Gateway" -ForegroundColor Green

# Frontend
$content = "VITE_API_URL=http://localhost:4000`nVITE_WS_URL=ws://localhost:4000"
$content | Out-File "frontend\.env" -Encoding utf8 -NoNewline
Write-Host "  OK Frontend" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  CONFIGURACION COMPLETADA EXITOSAMENTE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: instalar-dependencias.ps1" -ForegroundColor Cyan
Write-Host ""
