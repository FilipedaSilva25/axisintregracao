@echo off
REM =============================================================================
REM INICIAR SITE AXIS - COPIA DE SEGURANCA (NAO APAGAR)
REM PROTEGIDO: Nao alterar sem autorizacao. Se o .bat da raiz for apagado,
REM copie este ficheiro para a raiz do projeto.
REM =============================================================================
chcp 65001 >nul
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0iniciar-site.ps1"
if errorlevel 1 pause
