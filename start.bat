@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === AXIS - Iniciando ===
echo.

echo Iniciando servidor na porta 3006...
start "AXIS Server - Porta 3006" node server.js

echo Aguardando servidor subir...
ping -n 6 127.0.0.1 >nul

echo Abrindo Chrome...
start chrome http://localhost:3006 2>nul || start http://localhost:3006

echo.
echo Servidor: http://localhost:3006
echo Feche a janela "AXIS Server" para parar.
echo.
