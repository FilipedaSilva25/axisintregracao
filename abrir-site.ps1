# =============================================================================
# ABRIR SITE - Projeto Vida / AXIS
# Inicia o servidor Node e abre o site no Chrome (servidor + site juntos).
# Uso: .\abrir-site.ps1   ou   start.bat
# =============================================================================

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$port = 3006
$url = "http://localhost:${port}/?tela=login#login"
$maxWaitSeconds = 45
$checkIntervalMs = 500

# O .env pode definir PORT (ex. 30999); o start.bat promete 3006 — forçar para o processo Node filho.
$env:PORT = "$port"

# -----------------------------------------------------------------------------
# 1. Navegar para a pasta do projeto
# -----------------------------------------------------------------------------
Set-Location $projectRoot

Write-Host ""
Write-Host "=== AXIS - Servidor + site no Chrome (porta $port) ===" -ForegroundColor Cyan
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

# Mata processos node.exe que estejam a correr server.js (janelas antigas)
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmdLine -and $cmdLine -match 'server\.js') {
            Write-Host "      Encerrando Node antigo (PID $($_.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    } catch { }
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
# 4. Aguardar servidor E API Status de Bancada responderem
# -----------------------------------------------------------------------------
Write-Host "[3/4] Aguardando servidor e API (Status de Bancada)..." -ForegroundColor Cyan

$elapsed = 0
$ready = $false
$urlCheck = "http://localhost:${port}"
$apiCheck = "http://localhost:${port}/api/bancadas/status"

while ($elapsed -lt ($maxWaitSeconds * 1000)) {
    $tcpOk = $false
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $iar = $tcpClient.BeginConnect([string]'127.0.0.1', [int]$port, $null, $null)
        if ($iar.AsyncWaitHandle.WaitOne(600, $false) -and $tcpClient.Connected) {
            $tcpOk = $true
        }
        $tcpClient.Close()
    } catch { try { $tcpClient.Close() } catch { } }
    if ($tcpOk) {
        try {
            $r = Invoke-WebRequest -Uri $urlCheck -UseBasicParsing -Method GET -TimeoutSec 3 -ErrorAction Stop
            if ([int]$r.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch { }
    }
    # Sempre avançar o tempo (evita ciclo infinito se o pedido não lançar exceção e não for 200)
    Start-Sleep -Milliseconds $checkIntervalMs
    $elapsed += $checkIntervalMs
}

if (-not $ready) {
    Write-Host "ERRO: Servidor nao respondeu apos ${maxWaitSeconds}s." -ForegroundColor Red
    Write-Host "      Veja a janela do Node que abriu - pode haver erro de modulo ou porta. Feche-a e tente de novo." -ForegroundColor Yellow
    Stop-Process -Id $nodeProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "      Servidor respondendo OK." -ForegroundColor Green

# Garantir que a API Status de Bancada esta ativa antes de abrir o site
$apiReady = $false
for ($i = 0; $i -lt 5; $i++) {
    try {
        $ar = Invoke-WebRequest -Uri $apiCheck -UseBasicParsing -Method GET -TimeoutSec 4 -ErrorAction Stop
        if ([int]$ar.StatusCode -eq 200) {
            $apiReady = $true
            Write-Host "      API Status de Bancada OK." -ForegroundColor Green
            break
        }
    } catch { }
    if (-not $apiReady) { Start-Sleep -Seconds 1 }
}

if (-not $apiReady) {
    Write-Host "      Aviso: API /api/bancadas/status ainda nao respondeu; o site abrira mesmo assim." -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# 5. Abrir o site no Chrome no perfil normal (janela habitual do utilizador)
# -----------------------------------------------------------------------------
Write-Host "[4/4] Abrindo site no Chrome (perfil normal)..." -ForegroundColor Cyan

# Copia URL para clipboard (para colar manualmente se precisar)
try {
    Set-Clipboard -Value $url -ErrorAction SilentlyContinue
} catch {
    try { [System.Windows.Forms.Clipboard]::SetText($url) } catch { }
}

# Pausa para o servidor estabilizar
Start-Sleep -Seconds 2

$opened = $false
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

# Abrir no Chrome (prioridade)
foreach ($chromeExe in $chromePaths) {
    if ((Test-Path $chromeExe)) {
        try {
            Start-Process -FilePath $chromeExe -ArgumentList $url -ErrorAction Stop
            Start-Sleep -Milliseconds 800
            $opened = $true
            Write-Host "      Site aberto no Chrome (perfil normal)." -ForegroundColor Green
            break
        } catch { }
    }
}

# Se Chrome falhou com argumento direto, tentar com flags de estabilidade
if (-not $opened) {
    foreach ($chromeExe in $chromePaths) {
        if ((Test-Path $chromeExe)) {
            try {
                Start-Process $chromeExe -ArgumentList "--no-first-run", $url -ErrorAction Stop
                Start-Sleep -Milliseconds 800
                $opened = $true
                Write-Host "      Site aberto no Chrome (perfil normal)." -ForegroundColor Green
                break
            } catch { }
        }
    }
}

# Fallback: VBScript (abre no browser padrao se Chrome nao estiver instalado)
$vbsPath = Join-Path $env:TEMP "axis_abrir_url.vbs"
$vbsContent = "Set s = CreateObject(""WScript.Shell"")`r`ns.Run ""rundll32 url.dll,FileProtocolHandler $url"", 1, False"
try { [System.IO.File]::WriteAllText($vbsPath, $vbsContent, [System.Text.Encoding]::ASCII) } catch { }
if (-not $opened) {
    try {
        Start-Process "wscript.exe" -ArgumentList "`"$vbsPath`"" -WindowStyle Hidden -ErrorAction Stop
        Start-Sleep -Seconds 1
        $opened = $true
        Write-Host "      Chrome nao encontrado. Site aberto no navegador padrao." -ForegroundColor Yellow
    } catch { }
}

# Metodo 2: rundll32 - abre URL via shell do Windows
if (-not $opened) {
    try {
        Start-Process "rundll32.exe" -ArgumentList "url.dll,FileProtocolHandler", $url -WindowStyle Hidden -ErrorAction Stop
        Start-Sleep -Milliseconds 1000
        $opened = $true
        Write-Host "      Site aberto (rundll32)." -ForegroundColor Green
    } catch { }
}

# Metodo 3: HTML de redirecionamento - abre ficheiro local que redireciona (evita crash direto)
if (-not $opened) {
    $htmlPath = Join-Path $env:TEMP "axis_abrir.html"
    try {
        $htmlContent = "<!DOCTYPE html><html><head><meta http-equiv=`"refresh`" content=`"0;url=$url`"></head><body>Redirecionando...</body></html>"
        [System.IO.File]::WriteAllText($htmlPath, $htmlContent, [System.Text.Encoding]::UTF8)
        Start-Process $htmlPath -ErrorAction Stop
        Start-Sleep -Seconds 1
        $opened = $true
        Write-Host "      Site aberto (HTML redirect)." -ForegroundColor Green
    } catch { }
}

# Metodo 4: explorer.exe com URL
if (-not $opened) {
    try {
        Start-Process "explorer.exe" -ArgumentList $url -ErrorAction Stop
        Start-Sleep -Milliseconds 500
        $opened = $true
        Write-Host "      Site aberto (explorer)." -ForegroundColor Green
    } catch { }
}

# Metodo 5: Start-Process com UseShellExecute
if (-not $opened) {
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $url
        $psi.UseShellExecute = $true
        [void][System.Diagnostics.Process]::Start($psi)
        $opened = $true
        Write-Host "      Site aberto (ProcessStartInfo)." -ForegroundColor Green
    } catch { }
}

# Metodo 6: Firefox (se instalado)
if (-not $opened) {
    $firefoxPaths = @(
        "${env:ProgramFiles}\Mozilla Firefox\firefox.exe",
        "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe",
        "$env:LOCALAPPDATA\Mozilla Firefox\firefox.exe"
    )
    foreach ($ffExe in $firefoxPaths) {
        if ((Test-Path $ffExe)) {
            try {
                Start-Process $ffExe -ArgumentList "-private-window", $url -ErrorAction Stop
                $opened = $true
                Write-Host "      Site aberto (Firefox, janela privada)." -ForegroundColor Green
                break
            } catch { }
        }
    }
}

# Metodo 8: Start-Process URL direta
if (-not $opened) {
    try {
        Start-Process $url -ErrorAction Stop
        $opened = $true
        Write-Host "      Site aberto (Start-Process)." -ForegroundColor Green
    } catch { }
}

# Metodo 9: Invoke-Item
if (-not $opened) {
    try {
        Invoke-Item $url -ErrorAction Stop
        $opened = $true
        Write-Host "      Site aberto (Invoke-Item)." -ForegroundColor Green
    } catch { }
}

# Metodo 10: cmd start
if (-not $opened) {
    try {
        Start-Process "cmd.exe" -ArgumentList "/c","start","","`"$url`"" -WindowStyle Hidden -ErrorAction Stop
        $opened = $true
        Write-Host "      Site aberto (cmd start)." -ForegroundColor Green
    } catch { }
}

# Metodo 11: Segunda tentativa VBScript (por vezes a primeira falha por timing)
if (-not $opened) {
    Start-Sleep -Seconds 2
    try {
        if (Test-Path $vbsPath) {
            Start-Process "wscript.exe" -ArgumentList "`"$vbsPath`"" -ErrorAction Stop
            $opened = $true
            Write-Host "      Site aberto (VBScript retry)." -ForegroundColor Green
        }
    } catch { }
}

if (-not $opened) {
    Write-Host "      Nao foi possivel abrir automaticamente." -ForegroundColor Yellow
}

Write-Host "      URL: $url" -ForegroundColor Gray
Write-Host "      (URL copiada para o clipboard - Ctrl+V para colar no navegador)" -ForegroundColor Gray

# -----------------------------------------------------------------------------
# Conclusão
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "Site rodando em: $url" -ForegroundColor Green
if (-not $opened) {
    Write-Host "Copie e abra no navegador: $url" -ForegroundColor Yellow
}
Write-Host "Feche a janela do servidor Node para parar." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
