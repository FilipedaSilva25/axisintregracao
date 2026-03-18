@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo AXIS - Iniciando servidor na porta 3006...
echo.

set PORT=3006
start "AXIS Servidor" cmd /k "node server.js"

echo Aguardando o servidor iniciar (8 segundos)...
timeout /t 8 /nobreak >nul

echo Abrindo o site no navegador...
start http://localhost:3006

echo.
echo Site: http://localhost:3006
echo Feche a janela "AXIS Servidor" para parar o servidor.
echo.
pause
