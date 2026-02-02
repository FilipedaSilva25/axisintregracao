@echo off
cd /d "%~dp0"
echo.
echo === BACKUP PROJETO VIDA ===
powershell -ExecutionPolicy Bypass -File ".\scripts\backup-hoje.ps1"
echo.
pause
