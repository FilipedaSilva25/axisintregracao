@echo off
REM Abrir AXIS como administrador - inicia o servidor e abre o site na tela de login
chcp 65001 >nul
cd /d "%~dp0"

REM Pedir elevação de administrador e executar iniciar-site
powershell -ExecutionPolicy Bypass -NoProfile -Command "Start-Process '%~dp0iniciar-site.bat' -Verb RunAs"
