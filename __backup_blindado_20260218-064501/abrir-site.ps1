# =============================================================================
# ABRIR SITE - Projeto Vida / AXIS
# =============================================================================
# PROTEGIDO: Este script NAO pode ser alterado sem autorizacao explicita.
# Regras: (1) Inicia sempre na tela de LOGIN, nunca dentro de usuario logado.
#         (2) Porta original 3006. (3) Nao abre QR Code - abre site principal.
# =============================================================================

$projectRoot = $PSScriptRoot
$port = 3006
$url = "http://localhost:${port}/?tela=login#login"
$maxWaitSeconds = 15
$checkIntervalMs = 500

# -----------------------------------------------------------------------------
# 0. Ir para a pasta do projeto e verificar Node.js
# -----------------------------------------------------------------------------
Set-Location $projectRoot

Write-Host ""
Write-Host "=== AXIS - Iniciando (porta $port) ===" -ForegroundColor Cyan
Write-Host ""

$nodeExe = $null
try {
    $nodeExe = (Get-Command node -ErrorAction Stop).Source
} catch {
    # Tentar caminhos comuns do Node no Windows
    $paths = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:APPDATA\npm\node.exe",
        "$env:LOCALAPPDATA\Programs\node\node.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) { $nodeExe = $p; break }
    }
}

if (-not $nodeExe) {
    Write-Host "ERRO: Node.js nao encontrado." -ForegroundColor Red
    Write-Host "      Instale o Node.js de https://nodejs.org e reinicie o PC (ou abra um novo terminal)." -ForegroundColor Yellow
    Write-Host "      Se ja instalou, feche esta janela e execute este script de novo a partir da pasta do projeto." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "$projectRoot\server.js")) {
    Write-Host "ERRO: server.js nao encontrado em: $projectRoot" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------------------------------------
# 1. Liberar porta 3006 - mata TUDO que estiver a usar
# -----------------------------------------------------------------------------
$portFreed = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
    $pidsToKill = @()
    try {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            $pidsToKill += ($conn | Select-Object -ExpandProperty OwningProcess -Unique)
        }
    } catch { }
    try {
        $netstat = netstat -ano 2>$null | Select-String ":$port\s+.*LISTENING"
        if ($netstat) {
            $netstat | ForEach-Object {
                $parts = $_ -split '\s+'
                $pidVal = $parts[-1]
                if ($pidVal -match '^\d+$') { $pidsToKill += [int]$pidVal }
            }
        }
    } catch { }
    if ($pidsToKill.Count -gt 0) {
        $pidsToKill = $pidsToKill | Select-Object -Unique
        Write-Host "[1/4] Porta $port em uso. Encerrando PIDs: $($pidsToKill -join ', ')..." -ForegroundColor Yellow
        foreach ($p in $pidsToKill) {
            try { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } catch { }
            try { taskkill /F /PID $p 2>$null | Out-Null } catch { }
        }
        Start-Sleep -Seconds 3
    } else {
        $portFreed = $true
        Write-Host "[1/4] Porta $port livre." -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
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
# 2. Iniciar servidor Node na porta 3006
# -----------------------------------------------------------------------------
Write-Host "[2/4] Iniciando servidor Node (porta $port)..." -ForegroundColor Cyan

$env:PORT = $port
try {
    $nodeProcess = Start-Process -FilePath $nodeExe `
        -ArgumentList "server.js" `
        -WorkingDirectory $projectRoot `
        -WindowStyle Normal `
        -PassThru
} catch {
    Write-Host "ERRO ao iniciar o servidor: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

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

$urlCheck = "http://localhost:${port}"
while ($elapsed -lt ($maxWaitSeconds * 1000)) {
    try {
        $request = [System.Net.WebRequest]::Create($urlCheck)
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
    Write-Host "      Veja a janela do Node que abriu - pode haver erro de modulo ou porta. Feche-a e tente de novo." -ForegroundColor Yellow
    Stop-Process -Id $nodeProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "      Servidor respondendo OK." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 5. Abrir o site no navegador - MULTIPLOS METODOS para garantir funcionamento
# -----------------------------------------------------------------------------
Write-Host "[4/4] Abrindo site (porta $port)..." -ForegroundColor Cyan

# Copia URL para clipboard SEMPRE (para colar manualmente se precisar)
try {
    Set-Clipboard -Value $url -ErrorAction SilentlyContinue
} catch {
    try { [System.Windows.Forms.Clipboard]::SetText($url) } catch { }
}

# Pausa maior para o servidor estabilizar (evita crash ao abrir cedo demais)
Start-Sleep -Seconds 3

$opened = $false
$vbsPath = Join-Path $env:TEMP "axis_abrir_url.vbs"
$vbsContent = "Set s = CreateObject(""WScript.Shell"")`r`ns.Run ""rundll32 url.dll,FileProtocolHandler $url"", 1, False"
try { [System.IO.File]::WriteAllText($vbsPath, $vbsContent, [System.Text.Encoding]::ASCII) } catch { }

# Metodo 0: Chrome com flags de estabilidade PRIMEIRO (evita crash 0x80000003)
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
foreach ($chromeExe in $chromePaths) {
    if ((Test-Path $chromeExe)) {
        try {
            Start-Process $chromeExe -ArgumentList "--disable-gpu","--disable-software-rasterizer","--no-first-run","--disable-extensions","--disable-background-networking","--disable-sync","--no-sandbox",$url -ErrorAction Stop
            Start-Sleep -Milliseconds 1500
            $opened = $true
            Write-Host "      Site aberto (Chrome com flags de estabilidade)." -ForegroundColor Green
            break
        } catch { }
    }
}

# Metodo 1: VBScript - usa WScript.Shell (diferente dos outros, muito estavel)
if (-not $opened) {
try {
    Start-Process "wscript.exe" -ArgumentList "`"$vbsPath`"" -WindowStyle Hidden -ErrorAction Stop
    Start-Sleep -Seconds 1
    $opened = $true
    Write-Host "      Site aberto (VBScript)." -ForegroundColor Green
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
                Start-Process $ffExe -ArgumentList $url -ErrorAction Stop
                $opened = $true
                Write-Host "      Site aberto (Firefox)." -ForegroundColor Green
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
Write-Host ""
