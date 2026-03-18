@echo off
REM PROTEGIDO: Nao alterar sem autorizacao. Copia em _scripts_protegidos_axis
chcp 65001 >nul
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0iniciar-site.ps1"
if errorlevel 1 pause
