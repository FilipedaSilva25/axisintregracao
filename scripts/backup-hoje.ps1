# ============================================================
# BACKUP COMPLETO - Projeto Vida (AXIS)
# Copia o projeto para pasta com data/hora. Nada se perde.
# ============================================================

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
    $projectRoot = $PSScriptRoot
}
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupName = "Projeto-Vida-BACKUP-$timestamp"
$backupRoot = Join-Path $projectRoot "backups"
$dest = Join-Path $backupRoot $backupName
$downloadsBackup = Join-Path (Join-Path $env:USERPROFILE "Downloads") $backupName

Write-Host "`n=== BACKUP PROJETO VIDA ===" -ForegroundColor Cyan
Write-Host "Origem: $projectRoot" -ForegroundColor Gray
Write-Host "Destino 1: $dest" -ForegroundColor Gray
Write-Host "Destino 2: $downloadsBackup" -ForegroundColor Gray
Write-Host ""

function Do-Backup {
    param([string]$targetDir)
    if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    robocopy $projectRoot $targetDir /E /XD "node_modules" ".git" "backups" ".cursor" /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
    $manifest = @"
BACKUP PROJETO VIDA - $timestamp
Gerado em: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Para restaurar: copie o conteudo desta pasta sobre o projeto original
ou use como projeto independente: npm install e npm start.

Excluidos: node_modules, .git, backups, .cursor
"@
    $manifest | Set-Content -Path (Join-Path $targetDir "BACKUP-MANIFEST.txt") -Encoding UTF8
}

try {
    Do-Backup -targetDir $dest
    Write-Host "[OK] Backup em: $dest" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Backup local: $_" -ForegroundColor Yellow
}
try {
    Do-Backup -targetDir $downloadsBackup
    Write-Host "[OK] Copia em Downloads: $downloadsBackup" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Copia Downloads: $_" -ForegroundColor Yellow
}

Write-Host "`nBackup concluido. Nada foi perdido." -ForegroundColor Cyan
Write-Host ""
