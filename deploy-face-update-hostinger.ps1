# Envia ficheiros principais do AXIS (HTML, JS, CSS, versão package.json, config) para o VPS e reinicia o PM2.
# Executar na SUA máquina (onde ssh user@IP já funciona). Ajuste -User e -RemoteDir se necessário.
param(
    [string]$VpsHost = "187.77.246.216",
    [string]$User = "root",
    [string]$RemoteDir = "/var/www/axis"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

function Resolve-FirstPreventivaFile {
    param(
        [string]$BaseDir,
        [string]$SubDir,
        [string]$Pattern,
        [string]$Label
    )
    $dir = Join-Path $BaseDir $SubDir
    $match = Get-ChildItem -Path $dir -File -Filter $Pattern -ErrorAction SilentlyContinue |
        Sort-Object Length -Descending |
        Select-Object -First 1
    if (-not $match) {
        Write-Error "Ficheiro de preventiva não encontrado em: $dir (padrão: $Pattern)"
    }
    return $match.FullName
}

$preventivaHtmlAbs = Resolve-FirstPreventivaFile -BaseDir $root -SubDir "pages" -Pattern "*preventiva*.html" -Label "HTML"
$preventivaCssAbs  = Resolve-FirstPreventivaFile -BaseDir $root -SubDir "css"   -Pattern "*preventiva*.css"  -Label "CSS"
$preventivaJsAbs   = Resolve-FirstPreventivaFile -BaseDir $root -SubDir "js"    -Pattern "*preventiva*.js"   -Label "JS"

$pair = @(
    @{ Local = "index.html"; Remote = "index.html" },
    @{ Local = "js\script.js"; Remote = "js/script.js" },
    @{ Local = "js\axis-face-auth.js"; Remote = "js/axis-face-auth.js" },
    @{ Local = "css\style.css"; Remote = "css/style.css" },
    @{ Local = $preventivaHtmlAbs; Remote = "pages/manutenção_preventiva.html"; IsAbsolute = $true },
    @{ Local = $preventivaHtmlAbs; Remote = "pages/manutencao_preventiva.html"; IsAbsolute = $true },
    @{ Local = $preventivaCssAbs; Remote = "css/manutencao_preventiva.css"; IsAbsolute = $true },
    @{ Local = $preventivaJsAbs; Remote = "js/manutencao_preventiva.js"; IsAbsolute = $true },
    @{ Local = "package.json"; Remote = "package.json" },
    @{ Local = "backend\config.js"; Remote = "backend/config.js" }
)

Write-Host "Destino: ${User}@${VpsHost}:$RemoteDir"
foreach ($p in $pair) {
    $src = if ($p.IsAbsolute) { $p.Local } else { Join-Path $root $p.Local }
    if (-not (Test-Path -LiteralPath $src)) {
        Write-Error "Ficheiro em falta: $src"
    }
    $dest = "${User}@${VpsHost}:${RemoteDir}/$($p.Remote)"
    Write-Host "SCP: $($p.Local) -> $($p.Remote)"
    scp $src $dest
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "PM2 restart (app axis ou primeiro processo)..."
ssh "${User}@${VpsHost}" "cd `"$RemoteDir`" && (pm2 restart axis 2>/dev/null || pm2 restart all 2>/dev/null || true)"
Write-Host "Feito. Teste no telemovel com refresh forçado (cache)."
