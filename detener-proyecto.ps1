Write-Host "================================================" -ForegroundColor Red
Write-Host "        DETENIENDO PROYECTO COMPLETO" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Red
Write-Host ""

Write-Host "Buscando procesos de Node.js en puertos del proyecto..." -ForegroundColor Yellow
Write-Host ""

$puertos = @(3000, 4000, 4001, 4002, 4003, 4004, 4005, 4006, 4007)

foreach ($puerto in $puertos) {
    Write-Host "Verificando puerto $puerto..." -ForegroundColor Gray -NoNewline
    
    $conexiones = netstat -ano | Select-String ":$puerto" | Select-String "LISTENING"
    
    if ($conexiones) {
        foreach ($linea in $conexiones) {
            $pid = ($linea -split '\s+')[-1]
            
            try {
                $proceso = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proceso) {
                    Stop-Process -Id $pid -Force
                    Write-Host " Detenido (PID: $pid)" -ForegroundColor Green
                }
            } catch {
                Write-Host " Error al detener" -ForegroundColor Red
            }
        }
    } else {
        Write-Host " (no activo)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "Todos los servicios han sido detenidos" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
