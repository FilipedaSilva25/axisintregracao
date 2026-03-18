@echo off
chcp 65001 >nul
cd /d "%~dp0"
set DATA=%date:~-4%%date:~3,2%%date:~0,2%
set HORA=%time:~0,2%%time:~3,2%%time:~6,2%
set HORA=%HORA: =0%
set PASTA=__backup_criticos_%DATA%_%HORA%
echo.
echo AXIS - Backup dos ficheiros criticos
echo Pasta: %PASTA%
echo.
if not exist "%PASTA%" mkdir "%PASTA%"
if not exist "%PASTA%\js" mkdir "%PASTA%\js"
if not exist "%PASTA%\backend" mkdir "%PASTA%\backend"
if not exist "%PASTA%\config\data" mkdir "%PASTA%\config\data"
copy /Y "index.html" "%PASTA%\" >nul 2>&1
copy /Y "js\script.js" "%PASTA%\js\" >nul 2>&1
copy /Y "backend\routes.js" "%PASTA%\backend\" >nul 2>&1
copy /Y "backend\totp.js" "%PASTA%\backend\" >nul 2>&1
copy /Y "backend\config.js" "%PASTA%\backend\" >nul 2>&1
if exist "config\data\totp-secrets.json" copy /Y "config\data\totp-secrets.json" "%PASTA%\config\data\" >nul 2>&1
copy /Y "server.js" "%PASTA%\" >nul 2>&1
copy /Y "iniciar-site.ps1" "%PASTA%\" >nul 2>&1
copy /Y "iniciar-site.bat" "%PASTA%\" >nul 2>&1
echo Ficheiros copiados para %PASTA%
echo.
echo Para restaurar: copie os ficheiros de %PASTA% de volta para a raiz do projeto.
echo.
pause
