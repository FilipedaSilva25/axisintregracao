@echo off
REM ============================================================
REM PROTEGIDO: NAO alterar sem autorizacao explicita do usuario.
REM Script de inicio AXIS - chama abrir-site.ps1
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"

REM Chama o script PowerShell que faz tudo de forma robusta
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0abrir-site.ps1"

if errorlevel 1 (
    echo.
    echo [ERRO] O script falhou. Leia a mensagem em vermelho/amarelo acima.
    echo Se Node.js nao foi encontrado: instale de https://nodejs.org e reinicie o PC.
    echo.
    pause
)
