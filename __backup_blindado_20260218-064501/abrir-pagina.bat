@echo off
chcp 65001 >nul
cd /d "%~dp0"
REM Abre só a página no navegador padrão (servidor já deve estar a correr)
start http://localhost:3007/#login
