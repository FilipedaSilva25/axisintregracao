# Script PowerShell para enviar ao GitHub
# Execute este script como Administrador se necessário

Write-Host "🚀 Preparando para enviar ao GitHub..." -ForegroundColor Green

# Navegar para o diretório do projeto
$projectPath = "c:\Users\Filipe da Silva\Downloads\Projeto Vida copia cursor"
Set-Location $projectPath

Write-Host "`n📋 Verificando status do repositório..." -ForegroundColor Yellow
git status

Write-Host "`n🔍 Verificando repositório remoto..." -ForegroundColor Yellow
git remote -v

Write-Host "`n📦 Verificando commits locais..." -ForegroundColor Yellow
git log --oneline -5

Write-Host "`n⚠️  Tentando fazer push..." -ForegroundColor Yellow
Write-Host "Se pedir autenticação:" -ForegroundColor Cyan
Write-Host "  Username: FilipedaSilva25" -ForegroundColor Cyan
Write-Host "  Password: Use Personal Access Token (não sua senha)" -ForegroundColor Cyan
Write-Host ""

# Tentar fazer push
try {
    git push -u origin main
    Write-Host "`n✅ Push realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Erro ao fazer push. Tente usar GitHub Desktop:" -ForegroundColor Red
    Write-Host "   https://desktop.github.com/" -ForegroundColor Yellow
    Write-Host "`nOu verifique:" -ForegroundColor Yellow
    Write-Host "   1. Conexão com internet" -ForegroundColor Yellow
    Write-Host "   2. Configuração de proxy" -ForegroundColor Yellow
    Write-Host "   3. Personal Access Token do GitHub" -ForegroundColor Yellow
}

Write-Host "`n📝 Para mais informações, consulte: SOLUCAO_GITHUB.md" -ForegroundColor Cyan
