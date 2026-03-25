# Reinicia apenas o Node (server.js) na porta 3006 - sem abrir o Chrome.
$ErrorActionPreference = "Continue"
$projectRoot = $PSScriptRoot
$port = 3006
$env:PORT = "$port"
Set-Location $projectRoot

try {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $pidToKill = ($conn | Select-Object -First 1).OwningProcess
        Write-Host "[restart] Encerrando PID na porta ${port}: $pidToKill"
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
} catch { }

Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmdLine -and $cmdLine -match 'server\.js') {
            Write-Host "[restart] Encerrando Node server.js PID $($_.Id)"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    } catch { }
}

Start-Sleep -Seconds 2

Write-Host "[restart] A iniciar node server.js..."
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $projectRoot -WindowStyle Normal

$ok = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:${port}/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            $ok = $true
            break
        }
    } catch { }
}

if ($ok) {
    Write-Host "[restart] OK - http://localhost:${port}"
    exit 0
}
Write-Host "[restart] Aviso: /health nao respondeu a tempo. Veja a janela do Node."
exit 1
