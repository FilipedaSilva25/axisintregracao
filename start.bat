@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM Chama o script PowerShell que faz tudo de forma robusta
powershell -ExecutionPolicy Bypass -File "%~dp0abrir-site.ps1"

if errorlevel 1 (
    echo.
    echo Erro ao iniciar. Verifique se Node.js esta instalado.
    pause
)
