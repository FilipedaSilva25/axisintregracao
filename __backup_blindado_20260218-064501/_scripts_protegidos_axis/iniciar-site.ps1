# =============================================================================
# INICIAR SITE AXIS - COPIA DE SEGURANCA (NAO APAGAR)
# =============================================================================
# PROTEGIDO: Este script NAO pode ser alterado sem autorizacao explicita.
# Regras: (1) Porta 3006. (2) Sempre abre na tela de login (?tela=login#login).
# Se o script da raiz for apagado, copie este ficheiro para a raiz do projeto.
# =============================================================================

$ErrorActionPreference = "Stop"
$porta = 3006
$url   = "http://localhost:${porta}/?tela=login#login"
$raiz  = $PSScriptRoot

Set-Location $raiz

Write-Host ""
Write-Host "AXIS - Iniciando na porta $porta" -ForegroundColor Cyan
Write-Host ""

# 1) Node.js
$node = $null
foreach ($p in @(
    "$env:ProgramFiles\nodejs\node.exe",
    "${env:ProgramFiles(x86)}\nodejs\node.exe"
)) {
    if (Test-Path $p) { $node = $p; break }
}
if (-not $node) { $node = (Get-Command node -ErrorAction SilentlyContinue).Source }
if (-not $node) {
    Write-Host "ERRO: Node.js nao encontrado." -ForegroundColor Red
    exit 1
}

# 2) Liberar porta
$emUso = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue
if ($emUso) {
    $emUso | ForEach-Object { $_.OwningProcess } | Select-Object -Unique | ForEach-Object {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# 3) Iniciar servidor
$env:PORT = $porta
$proc = Start-Process -FilePath $node -ArgumentList "server.js" -WorkingDirectory $raiz -PassThru -WindowStyle Normal
if (-not $proc) {
    Write-Host "ERRO: Nao foi possivel iniciar o servidor." -ForegroundColor Red
    exit 1
}

# 4) Esperar servidor responder
Write-Host "Aguardando servidor..." -ForegroundColor Gray
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = [System.Net.WebRequest]::Create("http://localhost:${porta}/")
        $r.Timeout = 2000
        $r.Method = "GET"
        $resp = $r.GetResponse()
        $resp.Close()
        $ok = $true
        break
    } catch {
        Start-Sleep -Milliseconds 500
    }
}
if (-not $ok) {
    Write-Host "ERRO: Servidor nao respondeu." -ForegroundColor Red
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Servidor OK." -ForegroundColor Green
Start-Sleep -Seconds 2

# 5) Abrir no navegador (tela de login)
try {
    Start-Process $url
    Write-Host "Site aberto: $url" -ForegroundColor Green
} catch {
    try {
        [System.Diagnostics.Process]::Start($url)
        Write-Host "Site aberto: $url" -ForegroundColor Green
    } catch {
        Write-Host "Abra manualmente: $url" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Site em: $url" -ForegroundColor Cyan
Write-Host "Feche a janela do Node para parar." -ForegroundColor Gray
Write-Host ""
