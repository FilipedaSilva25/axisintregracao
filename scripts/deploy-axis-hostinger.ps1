# Deploy AXIS para VPS Hostinger (ajuste $server se o IP mudar)
$ErrorActionPreference = "Stop"
$server  = "root@187.77.246.216"
$project = Split-Path -Parent $PSScriptRoot
$remote  = "/var/www/axis"
$stamp   = Get-Date -Format "yyyyMMdd-HHmmss"
$archive = Join-Path $env:TEMP "axis-deploy-$stamp.tar.gz"

Write-Host "Pacote: $archive"
tar -czf $archive `
  --exclude=".git" `
  --exclude="node_modules" `
  --exclude="__backup_blindado_*" `
  --exclude="docs-storage" `
  --exclude="config/data/totp-secrets.json" `
  --exclude="config/data/whatsapp-auth" `
  --exclude="config/data/axis-browser-users.json" `
  --exclude="backups" `
  -C $project .

scp $archive "${server}:/tmp/axis-deploy.tar.gz"

$remoteScript = @"
set -e
mkdir -p $remote
tar -xzf /tmp/axis-deploy.tar.gz -C $remote
cd $remote
npm install --omit=dev
pm2 restart axis || pm2 start ecosystem.config.cjs --name axis
pm2 save || true
rm -f /tmp/axis-deploy.tar.gz
curl -sS http://127.0.0.1:3006/health
echo ""
test -f $remote/config/data/axis-browser-users.json && echo OK_axis-browser-users || echo AVISO_ficheiro_users
"@

ssh $server $remoteScript
Remove-Item $archive -Force
Write-Host "Deploy concluido."
