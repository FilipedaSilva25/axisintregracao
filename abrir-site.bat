@echo off
chcp 65001 >nul
echo Abrindo site em http://localhost:3006 ...
start http://localhost:3006
echo Se o navegador nao abriu, copie e cole no Chrome: http://localhost:3006
timeout /t 3 >nul
