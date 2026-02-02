# AXIS - Inicia servidor na porta 3006 e abre no Chrome
$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$port = 3006
$url = "http://localhost:$port"

Write-Host "`n=== AXIS - Iniciando ===" -ForegroundColor Cyan
Set-Location $projectRoot

# Encerra processo na porta 3006 se já existir (quando disponível)
try {
    $existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Porta $port em uso. Encerrando processo anterior..." -ForegroundColor Yellow
        $existing | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
    }
} catch { }

# Inicia o servidor Node em nova janela (permanece aberta)
Write-Host "Iniciando servidor Node na porta $port..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $projectRoot -WindowStyle Normal

# Aguarda o servidor subir
Start-Sleep -Seconds 3

# Abre no Chrome
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
$chrome = $chromePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($chrome) {
    Write-Host "Abrindo Chrome em $url ..." -ForegroundColor Green
    Start-Process -FilePath $chrome -ArgumentList $url
} else {
    Write-Host "Chrome nao encontrado. Abrindo navegador padrao..." -ForegroundColor Yellow
    Start-Process $url
}

Write-Host "`nServidor rodando em $url" -ForegroundColor Cyan
Write-Host "Feche a janela 'node server.js' para parar o servidor.`n" -ForegroundColor Gray
