# =============================================================================
# ABRIR SITE - Projeto Vida / AXIS
# Inicia o servidor na porta 3006 e abre o site em http://localhost:3006 no Chrome.
# Uso: .\abrir-site.ps1   ou   powershell -ExecutionPolicy Bypass -File abrir-site.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$port = 3006
$url = "http://localhost:$port"
$maxWaitSeconds = 15
$checkIntervalMs = 500

# -----------------------------------------------------------------------------
# 1. Navegar para a pasta do projeto
# -----------------------------------------------------------------------------
Set-Location $projectRoot

Write-Host ""
Write-Host "=== AXIS - Iniciando (porta $port) ===" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 2. Liberar porta 3006 se estiver em uso
# -----------------------------------------------------------------------------
try {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $pidToKill = ($conn | Select-Object -First 1).OwningProcess
        Write-Host "[1/4] Porta $port em uso. Encerrando processo PID $pidToKill..." -ForegroundColor Yellow
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "      Porta liberada." -ForegroundColor Green
    } else {
        Write-Host "[1/4] Porta $port livre." -ForegroundColor Green
    }
} catch {
    Write-Host "[1/4] Porta $port livre." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 3. Iniciar servidor Node
# -----------------------------------------------------------------------------
Write-Host "[2/4] Iniciando servidor Node..." -ForegroundColor Cyan

$nodeProcess = Start-Process -FilePath "node" `
    -ArgumentList "server.js" `
    -WorkingDirectory $projectRoot `
    -WindowStyle Normal `
    -PassThru

if (-not $nodeProcess) {
    Write-Host "ERRO: Nao foi possivel iniciar o servidor Node." -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# 4. Aguardar servidor responder (verificação real)
# -----------------------------------------------------------------------------
Write-Host "[3/4] Aguardando servidor responder..." -ForegroundColor Cyan

$elapsed = 0
$ready = $false

while ($elapsed -lt ($maxWaitSeconds * 1000)) {
    try {
        $request = [System.Net.WebRequest]::Create($url)
        $request.Timeout = 2000
        $request.Method = "GET"
        $response = $request.GetResponse()
        $response.Close()
        $ready = $true
        break
    } catch {
        Start-Sleep -Milliseconds $checkIntervalMs
        $elapsed += $checkIntervalMs
    }
}

if (-not $ready) {
    Write-Host "ERRO: Servidor nao respondeu apos ${maxWaitSeconds}s." -ForegroundColor Red
    Stop-Process -Id $nodeProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "      Servidor respondendo OK." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 5. Abrir o site na porta 3006 no Chrome (servidor já rodando em localhost:3006)
# -----------------------------------------------------------------------------
Write-Host "[4/4] Abrindo site em http://localhost:${port} (porta $port)..." -ForegroundColor Cyan

$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chrome = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($chrome) {
    Start-Process -FilePath $chrome -ArgumentList $url
    Write-Host "      Chrome aberto em $url" -ForegroundColor Green
} else {
    Write-Host "      Chrome nao encontrado. Abrindo navegador padrao..." -ForegroundColor Yellow
    Start-Process $url
}

# -----------------------------------------------------------------------------
# Conclusão
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "Site rodando em: $url" -ForegroundColor Green
Write-Host "Feche a janela do servidor Node para parar." -ForegroundColor Gray
Write-Host ""
