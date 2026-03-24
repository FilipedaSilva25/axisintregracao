@echo off
REM ============================================================
REM PROTEGIDO: NAO alterar sem autorizacao explicita do usuario.
REM Script de inicio AXIS - chama abrir-site.ps1
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  AXIS - Site na porta 3006 (portaria)
echo  URL: http://localhost:3006/?tela=login#login
echo  O script abre o Chrome no PERFIL NORMAL (sessao habitual do utilizador).
echo  URL com tela=login - use sessao anonima so se quiser testar sem dados guardados.
echo.

REM Chama o script PowerShell que faz tudo de forma robusta (porta 3006 em abrir-site.ps1)
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0abrir-site.ps1"

if errorlevel 1 (
    echo.
    echo [ERRO] O script falhou. Leia a mensagem em vermelho/amarelo acima.
    echo Se Node.js nao foi encontrado: instale de https://nodejs.org e reinicie o PC.
    echo.
    pause
)
